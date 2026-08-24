'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  Package, LayoutDashboard, Users, MapPin, Tag, Bell, Truck,
  LogOut, ChevronLeft, ChevronRight, Map, Activity,
  ClipboardList, PlusCircle, Search,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard',    href: '/admin',               icon: <LayoutDashboard size={18} /> },
  { label: 'Orders',       href: '/admin/orders',        icon: <Package size={18} /> },
  { label: 'Agents',       href: '/admin/agents',        icon: <Users size={18} /> },
  { label: 'Zones',        href: '/admin/zones',         icon: <Map size={18} /> },
  { label: 'Areas',        href: '/admin/areas',         icon: <MapPin size={18} /> },
  { label: 'Rate Cards',   href: '/admin/rates',         icon: <Tag size={18} /> },
  { label: 'Notifications',href: '/admin/notifications', icon: <Bell size={18} /> },
];

const customerNav: NavItem[] = [
  { label: 'Dashboard',       href: '/customer',              icon: <LayoutDashboard size={18} /> },
  { label: 'Create Delivery', href: '/customer/create',       icon: <PlusCircle size={18} /> },
  { label: 'My Orders',       href: '/customer/orders',       icon: <ClipboardList size={18} /> },
  { label: 'Track Order',     href: '/customer/track',        icon: <Search size={18} /> },
  { label: 'Notifications',   href: '/customer/notifications',icon: <Bell size={18} /> },
];

const agentNav: NavItem[] = [
  { label: 'Dashboard',    href: '/agent',               icon: <LayoutDashboard size={18} /> },
  { label: 'My Deliveries',href: '/agent/deliveries',    icon: <Truck size={18} /> },
  { label: 'Notifications',href: '/agent/notifications', icon: <Bell size={18} /> },
];

// Role accent for the logo pill — the only color difference per role
const ROLE_ACCENT: Record<string, { from: string; to: string; label: string }> = {
  admin:    { from: '#6C63FF', to: '#8B84FF', label: 'Admin' },
  agent:    { from: '#c07b28', to: '#d4a055', label: 'Delivery Agent' },
  customer: { from: '#38B2AC', to: '#4fd1c5', label: 'Customer' },
};

export function Sidebar() {
  const { user, logout, isAdmin, isAgent } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems  = isAdmin ? adminNav : isAgent ? agentNav : customerNav;
  const roleKey   = isAdmin ? 'admin' : isAgent ? 'agent' : 'customer';
  const role      = ROLE_ACCENT[roleKey];

  return (
    <aside
      className={cn(
        // The sidebar IS the same surface as the page body (#E0E5EC) —
        // it's separated purely by a vertical extruded ridge shadow.
        'flex flex-col h-full bg-[#E0E5EC] transition-all duration-300 ease-out',
        'shadow-[6px_0px_20px_rgba(163,177,198,0.5)]',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* ── Brand ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-3 py-6 transition-all duration-300',
          collapsed ? 'px-4 justify-center' : 'px-5'
        )}
      >
        {/* Logo pill — extruded small */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-2xl text-white flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${role.from}, ${role.to})`,
            boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)',
          }}
        >
          <Truck size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p
              className="text-sm font-bold text-[#3D4852] leading-tight"
              style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
            >
              LastMile
            </p>
            <p className="text-xs text-[#6B7280] font-medium">Delivery Tracker</p>
          </div>
        )}
      </div>

      {/* ── Divider ridge (inset strip) ──────────────────────────────── */}
      <div className="mx-4 h-px shadow-[0_1px_3px_rgba(163,177,198,0.6),0_-1px_2px_rgba(255,255,255,0.7)]" />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isRoot = item.href === '/admin' || item.href === '/customer' || item.href === '/agent';
          const active = isRoot
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium',
                'transition-all duration-300 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]',
                collapsed && 'justify-center px-2',
                active
                  ? [
                    // Active: inset — pressed into the surface
                    'text-[#6C63FF]',
                    'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.5)]',
                    'bg-[#E0E5EC]',
                  ].join(' ')
                  : [
                    // Inactive: flat, gains small extruded shadow on hover
                    'text-[#6B7280]',
                    'hover:text-[#3D4852]',
                    'hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.5)]',
                    'hover:bg-[#E0E5EC]',
                  ].join(' ')
              )}
            >
              <span className={cn('flex-shrink-0', active ? 'text-[#6C63FF]' : 'text-[#6B7280]')}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {/* Active dot indicator in collapsed mode */}
              {collapsed && active && (
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#6C63FF]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ridge ───────────────────────────────────────────── */}
      <div className="mx-4 h-px shadow-[0_1px_3px_rgba(163,177,198,0.6),0_-1px_2px_rgba(255,255,255,0.7)]" />

      {/* ── User + Collapse ─────────────────────────────────────────── */}
      <div className="p-3 space-y-2">
        {!collapsed ? (
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-3 rounded-2xl',
              'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.5),inset_-5px_-5px_10px_rgba(255,255,255,0.5)]',
              'bg-[#E0E5EC]',
            )}
          >
            {/* Avatar — extruded pill */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${role.from}, ${role.to})`,
                boxShadow: '3px 3px 6px rgba(163,177,198,0.6), -3px -3px 6px rgba(255,255,255,0.5)',
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#3D4852] truncate">{user?.name}</p>
              <p className="text-[10px] text-[#6B7280] font-medium">{role.label}</p>
            </div>
            <button
              onClick={logout}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-xl',
                'text-[#6B7280] bg-[#E0E5EC]',
                'shadow-[3px_3px_6px_rgba(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)]',
                'hover:text-[#b94040] hover:-translate-y-0.5 transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]',
              )}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className={cn(
              'w-full flex justify-center items-center h-10 rounded-2xl',
              'text-[#6B7280] bg-[#E0E5EC]',
              'shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]',
              'hover:text-[#b94040] hover:-translate-y-0.5 transition-all duration-300',
            )}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center py-2 rounded-2xl',
            'text-[#6B7280] bg-[#E0E5EC] text-xs',
            'shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.5)]',
            'hover:text-[#6C63FF] hover:-translate-y-0.5 transition-all duration-300',
            'active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && (
            <span className="ml-1.5 font-medium text-[10px] uppercase tracking-wider">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}

// ── DashboardLayout ────────────────────────────────────────────────────────
// The layout wrapper: bg-[#E0E5EC] on both sidebar and main — one continuous surface.
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#E0E5EC] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#E0E5EC]">
        {children}
      </main>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div>
        <h1
          className="text-2xl font-bold text-[#3D4852] leading-tight"
          style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#6B7280] mt-1 font-medium">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
