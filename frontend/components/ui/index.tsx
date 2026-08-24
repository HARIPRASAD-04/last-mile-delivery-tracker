import React from 'react';
import { cn } from '@/lib/utils';

// ─── Design Token References ──────────────────────────────────────────────
// All shadows use rgba values as defined in globals.css CSS custom properties.
// Never use hex shadows or bg-white — the neumorphic surface is always #E0E5EC.

// ── Button ────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-2xl',
    'transition-all duration-300 ease-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E0E5EC]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
    'gap-2 select-none',
  ].join(' ');

  const variants = {
    // Primary: Accent background (#6C63FF). Inset on active to feel physically pressed.
    primary: [
      'bg-[#6C63FF] text-white',
      'shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]',
      'hover:-translate-y-0.5 hover:bg-[#7b73ff]',
      'hover:shadow-[8px_8px_14px_rgba(163,177,198,0.7),-8px_-8px_14px_rgba(255,255,255,0.6)]',
      'active:translate-y-0.5 active:bg-[#5a52e0]',
      'active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.15),inset_-2px_-2px_6px_rgba(255,255,255,0.1)]',
    ].join(' '),

    // Secondary: Matches the page surface — molded from the same material.
    secondary: [
      'bg-[#E0E5EC] text-[#3D4852]',
      'shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]',
      'hover:-translate-y-0.5 hover:text-[#6C63FF]',
      'hover:shadow-[12px_12px_20px_rgba(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)]',
      'active:translate-y-0.5',
      'active:shadow-[inset_6px_6px_10px_rgba(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]',
    ].join(' '),

    // Danger: Accent-red toned extruded button
    danger: [
      'bg-[#E0E5EC] text-[#b94040]',
      'shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]',
      'hover:-translate-y-0.5 hover:bg-[#b94040] hover:text-white',
      'hover:shadow-[12px_12px_20px_rgba(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)]',
      'active:translate-y-0.5',
      'active:shadow-[inset_6px_6px_10px_rgba(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]',
    ].join(' '),

    // Ghost: Flat in resting state, gains depth on hover
    ghost: [
      'bg-transparent text-[#6B7280]',
      'hover:bg-[#E0E5EC] hover:text-[#3D4852]',
      'hover:shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]',
      'active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]',
    ].join(' '),

    // Outline: Accent ring without fill
    outline: [
      'bg-[#E0E5EC] text-[#6C63FF] ring-1 ring-[rgba(108,99,255,0.4)]',
      'shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]',
      'hover:-translate-y-0.5 hover:bg-[#6C63FF] hover:text-white hover:ring-0',
      'hover:shadow-[8px_8px_14px_rgba(163,177,198,0.7),-8px_-8px_14px_rgba(255,255,255,0.6)]',
      'active:translate-y-0.5',
      'active:shadow-[inset_6px_6px_10px_rgba(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]',
    ].join(' '),
  };

  const sizes = {
    sm: 'text-xs px-4 py-2 min-h-[36px]',
    md: 'text-sm px-5 py-2.5 min-h-[44px]',
    lg: 'text-base px-7 py-3.5 min-h-[52px]',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        // Neumorphic spinner — concentric ring instead of a solid border
        <span
          className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-neu-spin opacity-80"
          aria-hidden="true"
        />
      ) : icon}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#3D4852]"
          style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            'block w-full rounded-2xl bg-[#E0E5EC] text-[#3D4852] text-sm',
            'px-4 py-3 min-h-[48px]',
            'placeholder:text-[#A0AEC0]',
            // Default: inset shadow (pressed into the surface)
            'shadow-[inset_6px_6px_10px_rgba(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]',
            // Focus: deeper inset + accent ring
            'focus:outline-none focus:shadow-[inset_10px_10px_20px_rgba(163,177,198,0.7),inset_-10px_-10px_20px_rgba(255,255,255,0.6)]',
            'focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#E0E5EC]',
            'transition-shadow duration-300 ease-out',
            // Border-like error state via ring
            error && 'ring-2 ring-[rgba(185,64,64,0.5)] focus:ring-[rgba(185,64,64,0.7)]',
            Boolean(icon) && 'pl-11',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[#b94040] flex items-center gap-1.5 mt-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#b94040]" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#3D4852]"
          style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'block w-full rounded-2xl bg-[#E0E5EC] text-[#3D4852] text-sm',
          'px-4 py-3 min-h-[48px]',
          'shadow-[inset_6px_6px_10px_rgba(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]',
          'focus:outline-none focus:shadow-[inset_10px_10px_20px_rgba(163,177,198,0.7),inset_-10px_-10px_20px_rgba(255,255,255,0.6)]',
          'focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#E0E5EC]',
          'transition-shadow duration-300 ease-out appearance-none cursor-pointer',
          error && 'ring-2 ring-[rgba(185,64,64,0.5)]',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-[#b94040] flex items-center gap-1.5 mt-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#b94040]" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#3D4852]"
          style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'block w-full rounded-2xl bg-[#E0E5EC] text-[#3D4852] text-sm',
          'px-4 py-3',
          'placeholder:text-[#A0AEC0] resize-none',
          'shadow-[inset_6px_6px_10px_rgba(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]',
          'focus:outline-none focus:shadow-[inset_10px_10px_20px_rgba(163,177,198,0.7),inset_-10px_-10px_20px_rgba(255,255,255,0.6)]',
          'focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#E0E5EC]',
          'transition-shadow duration-300 ease-out',
          error && 'ring-2 ring-[rgba(185,64,64,0.5)]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-[#b94040] flex items-center gap-1.5 mt-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#b94040]" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
// The card IS the surface — bg-[#E0E5EC] must always match the body background.
// This creates the "molded from the same material" neumorphic illusion.
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  /** Hoverable cards lift on hover — good for clickable cards */
  hoverable?: boolean;
}

export function Card({ children, className, padding = true, hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#E0E5EC] rounded-[32px]',
        'shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]',
        padding && 'p-6',
        hoverable && [
          'cursor-pointer transition-all duration-300 ease-out',
          'hover:-translate-y-0.5',
          'hover:shadow-[12px_12px_20px_rgba(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)]',
        ],
        className
      )}
    >
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────
// Demonstrates nested neumorphic depth: Card (extruded) → icon well (inset deep) → icon (distinct).
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'red' | 'violet' | 'blue';
  subtitle?: string;
}

const STAT_ICON_COLORS: Record<string, string> = {
  indigo:  'text-[#6C63FF]',
  emerald: 'text-[#38B2AC]',
  amber:   'text-[#c07b28]',
  red:     'text-[#b94040]',
  violet:  'text-[#7c5cbf]',
  blue:    'text-[#4f6ac0]',
};

export function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card hoverable>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] truncate"
            style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
          >
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#3D4852] tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#6B7280]">{subtitle}</p>
          )}
        </div>
        {/* Icon well — inset deep to feel "drilled" into the card surface */}
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl',
            'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.7),inset_-5px_-5px_10px_rgba(255,255,255,0.6)]',
            'bg-[#E0E5EC]',
            STAT_ICON_COLORS[color]
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────
import { STATUS_COLORS, STATUS_LABELS, STATUS_DOT } from '@/lib/utils';
import type { OrderStatus } from '@/types';

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        // Inset shadow gives the pill a "pressed in" appearance on the surface
        'shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]',
        STATUS_COLORS[status]
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[status])}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
}

const BADGE_VARIANTS: Record<string, string> = {
  default: 'text-[#5a6580] ring-1 ring-[rgba(163,177,198,0.5)]',
  success: 'text-[#2d8a6e] ring-1 ring-[rgba(56,178,172,0.4)]',
  warning: 'text-[#c07b28] ring-1 ring-[rgba(192,123,40,0.35)]',
  danger:  'text-[#b94040] ring-1 ring-[rgba(185,64,64,0.35)]',
  info:    'text-[#4f6ac0] ring-1 ring-[rgba(79,106,192,0.3)]',
  accent:  'text-[#6C63FF] ring-1 ring-[rgba(108,99,255,0.35)]',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        'bg-[#E0E5EC]',
        'shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]',
        BADGE_VARIANTS[variant]
      )}
    >
      {children}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — soft dark overlay, not harsh black */}
      <div
        className="absolute inset-0 bg-[rgba(61,72,82,0.4)] backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal surface — extruded from the neumorphic background */}
      <div
        className={cn(
          'relative bg-[#E0E5EC] rounded-[32px] w-full',
          'shadow-[20px_20px_40px_rgba(163,177,198,0.8),-20px_-20px_40px_rgba(255,255,255,0.7)]',
          MODAL_SIZES[size],
          'max-h-[90vh] overflow-y-auto animate-fade-in'
        )}
      >
        {/* Header with bottom separator via inset shadow strip */}
        <div className="flex items-center justify-between px-8 py-6">
          <h2
            className="text-lg font-bold text-[#3D4852]"
            style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-2xl',
              'bg-[#E0E5EC] text-[#6B7280]',
              'shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]',
              'hover:-translate-y-0.5 hover:text-[#b94040] transition-all duration-300',
              'active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]'
            )}
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Divider — thin inset line */}
        <div className="mx-8 h-px shadow-[0_2px_4px_rgba(163,177,198,0.5),0_-1px_2px_rgba(255,255,255,0.8)]" />
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  );
}

// ── LoadingState ──────────────────────────────────────────────────────────
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      {/* Nested neumorphic depth rings as loader */}
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Outer ring — extruded */}
        <div className="absolute inset-0 rounded-full shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] bg-[#E0E5EC]" />
        {/* Inner ring — inset well */}
        <div className="absolute inset-2 rounded-full shadow-[inset_4px_4px_8px_rgba(163,177,198,0.7),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] bg-[#E0E5EC]" />
        {/* Spinning accent arc */}
        <div className="absolute inset-2 rounded-full border-2 border-[#E0E5EC] border-t-[#6C63FF] animate-neu-spin" />
      </div>
      <p className="text-sm text-[#6B7280] font-medium">{message}</p>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      {icon && (
        // Icon in an inset deep well — "carved" into the surface
        <div className={cn(
          'flex items-center justify-center w-20 h-20 rounded-[28px]',
          'bg-[#E0E5EC] text-[#6B7280]',
          'shadow-[inset_8px_8px_16px_rgba(163,177,198,0.7),inset_-8px_-8px_16px_rgba(255,255,255,0.6)]',
        )}>
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3
          className="text-lg font-bold text-[#3D4852]"
          style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[#6B7280] max-w-sm leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────
export function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const div = document.createElement('div');
  const colorMap = {
    success: { bg: '#E0E5EC', text: '#2d8a6e', dot: '#38B2AC' },
    error:   { bg: '#E0E5EC', text: '#b94040', dot: '#b94040' },
    info:    { bg: '#E0E5EC', text: '#6C63FF', dot: '#6C63FF' },
  };
  const c = colorMap[type];

  Object.assign(div.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    borderRadius: '20px',
    background: c.bg,
    color: c.text,
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '12px 12px 20px rgba(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)',
    transition: 'all 0.3s ease-out',
    transform: 'translateY(0)',
    opacity: '1',
  });

  // Colored dot indicator
  const dot = document.createElement('span');
  Object.assign(dot.style, {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: c.dot,
    flexShrink: '0',
  });

  const text = document.createElement('span');
  text.textContent = message;

  div.appendChild(dot);
  div.appendChild(text);
  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      if (document.body.contains(div)) document.body.removeChild(div);
    }, 300);
  }, 3000);
}
