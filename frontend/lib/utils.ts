import { type OrderStatus } from '@/types';

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  const flat: string[] = [];
  const process = (val: ClassValue) => {
    if (!val) return;
    if (typeof val === 'string') {
      flat.push(val);
    } else if (typeof val === 'number') {
      flat.push(String(val));
    } else if (Array.isArray(val)) {
      val.forEach(process);
    }
  };
  classes.forEach(process);
  return flat.join(' ');
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
  CREATED:          'bg-[#E0E5EC] text-[#5a6580] ring-1 ring-[rgba(163,177,198,0.5)]',
  ASSIGNED:         'bg-[#E0E5EC] text-[#4f6ac0] ring-1 ring-[rgba(79,106,192,0.3)]',
  PICKED_UP:        'bg-[#E0E5EC] text-[#6C63FF] ring-1 ring-[rgba(108,99,255,0.35)]',
  IN_TRANSIT:       'bg-[#E0E5EC] text-[#7c5cbf] ring-1 ring-[rgba(124,92,191,0.3)]',
  OUT_FOR_DELIVERY: 'bg-[#E0E5EC] text-[#c07b28] ring-1 ring-[rgba(192,123,40,0.35)]',
  DELIVERED:        'bg-[#E0E5EC] text-[#2d8a6e] ring-1 ring-[rgba(56,178,172,0.4)]',
  FAILED:           'bg-[#E0E5EC] text-[#b94040] ring-1 ring-[rgba(185,64,64,0.35)]',
  RESCHEDULED:      'bg-[#E0E5EC] text-[#b86a2e] ring-1 ring-[rgba(184,106,46,0.35)]',
  CANCELLED:        'bg-[#E0E5EC] text-[#7a8494] ring-1 ring-[rgba(122,132,148,0.3)]',
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  CREATED:          'bg-[#8c97b0]',
  ASSIGNED:         'bg-[#4f6ac0]',
  PICKED_UP:        'bg-[#6C63FF]',
  IN_TRANSIT:       'bg-[#7c5cbf]',
  OUT_FOR_DELIVERY: 'bg-[#c07b28]',
  DELIVERED:        'bg-[#38B2AC]',
  FAILED:           'bg-[#b94040]',
  RESCHEDULED:      'bg-[#b86a2e]',
  CANCELLED:        'bg-[#9ca3af]',
};

export const AGENT_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-[#E0E5EC] text-[#2d8a6e] ring-1 ring-[rgba(56,178,172,0.4)]',
  BUSY:      'bg-[#E0E5EC] text-[#c07b28] ring-1 ring-[rgba(192,123,40,0.35)]',
  OFFLINE:   'bg-[#E0E5EC] text-[#7a8494] ring-1 ring-[rgba(122,132,148,0.3)]',
};

export const RISK_COLORS = {
  LOW:    { bg: 'bg-[#E0E5EC]', text: 'text-[#38B2AC]', bar: 'bg-[#38B2AC]' },
  MEDIUM: { bg: 'bg-[#E0E5EC]', text: 'text-[#c07b28]', bar: 'bg-[#c07b28]' },
  HIGH:   { bg: 'bg-[#E0E5EC]', text: 'text-[#b94040]', bar: 'bg-[#b94040]' },
};
