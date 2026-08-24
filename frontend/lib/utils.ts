import { type OrderStatus } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Created',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  RESCHEDULED: 'Rescheduled',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  CREATED: 'bg-slate-100 text-slate-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-violet-100 text-violet-700',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  CREATED: 'bg-slate-400',
  ASSIGNED: 'bg-blue-500',
  PICKED_UP: 'bg-indigo-500',
  IN_TRANSIT: 'bg-violet-500',
  OUT_FOR_DELIVERY: 'bg-amber-500',
  DELIVERED: 'bg-emerald-500',
  FAILED: 'bg-red-500',
  RESCHEDULED: 'bg-orange-500',
  CANCELLED: 'bg-gray-400',
};

export const AGENT_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  BUSY: 'bg-amber-100 text-amber-700',
  OFFLINE: 'bg-gray-100 text-gray-500',
};

export const RISK_COLORS = {
  LOW: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
  HIGH: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
};
