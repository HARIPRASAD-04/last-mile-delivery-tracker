"""
NotificationService — In-app and email notifications.

If RESEND_API_KEY is not configured, notifications are logged and stored in-app only.
The application NEVER crashes due to missing email credentials.
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Notification, NotificationType, Order, User
from app.config import settings

logger = logging.getLogger(__name__)


def send_in_app(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.GENERAL,
    order_id: Optional[int] = None,
) -> Notification:
    """Create an in-app notification record."""
    notif = Notification(
        user_id=user_id,
        order_id=order_id,
        type=notification_type,
        title=title,
        message=message,
        is_read=False,
    )
    db.add(notif)
    db.flush()
    return notif


def send_email(
    to_email: str,
    subject: str,
    body: str,
) -> bool:
    """
    Send email notification.
    Falls back to logging if RESEND_API_KEY is not configured.
    Returns True if email sent, False if logged only.
    """
    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL LOG] To: {to_email} | Subject: {subject} | Body: {body[:200]}...")
        return False

    try:
        import httpx
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": f"<p>{body}</p>",
            },
            timeout=10.0,
        )
        if response.status_code == 200:
            logger.info(f"Email sent to {to_email}")
            return True
        else:
            logger.warning(f"Email failed: {response.status_code} {response.text}")
            return False
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False


STATUS_NOTIFICATION_MAP = {
    "CREATED": ("Order Created", "Your order {tracking} has been created and is awaiting pickup.", "ORDER_CREATED"),
    "ASSIGNED": ("Agent Assigned", "A delivery agent has been assigned to your order {tracking}.", "AGENT_ASSIGNED"),
    "PICKED_UP": ("Package Picked Up", "Your package for order {tracking} has been picked up by the agent.", "PICKED_UP"),
    "IN_TRANSIT": ("In Transit", "Your order {tracking} is now in transit.", "IN_TRANSIT"),
    "OUT_FOR_DELIVERY": ("Out for Delivery", "Your order {tracking} is out for delivery. Expect it soon!", "OUT_FOR_DELIVERY"),
    "DELIVERED": ("Delivered!", "Your order {tracking} has been successfully delivered. Thank you!", "DELIVERED"),
    "FAILED": ("Delivery Failed", "Delivery attempt for order {tracking} failed. You can reschedule.", "FAILED"),
    "RESCHEDULED": ("Delivery Rescheduled", "Your order {tracking} has been rescheduled for delivery.", "RESCHEDULED"),
    "CANCELLED": ("Order Cancelled", "Your order {tracking} has been cancelled.", "CANCELLED"),
}


def notify_order_status(
    db: Session,
    order: Order,
    status: str,
    extra_message: Optional[str] = None,
) -> None:
    """
    Send both in-app and email notifications for an order status change.
    Gets recipient from the customer's user record.
    """
    try:
        tracking = order.tracking_number
        template = STATUS_NOTIFICATION_MAP.get(status)
        if not template:
            return

        title, msg_template, notif_type_str = template
        message = msg_template.format(tracking=tracking)
        if extra_message:
            message += f" {extra_message}"

        notif_type = NotificationType[notif_type_str] if notif_type_str in NotificationType.__members__ else NotificationType.GENERAL

        # Get customer user
        customer_profile = order.customer
        if not customer_profile:
            return
        user = customer_profile.user

        # In-app notification
        send_in_app(
            db=db,
            user_id=user.id,
            title=title,
            message=message,
            notification_type=notif_type,
            order_id=order.id,
        )

        # Email notification (non-blocking)
        send_email(
            to_email=user.email,
            subject=f"[LastMile] {title} — {tracking}",
            body=message,
        )

        db.flush()
    except Exception as e:
        # Never crash due to notification failure
        logger.error(f"Notification error for order {order.id}: {e}")
