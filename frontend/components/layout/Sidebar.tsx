'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  Package, LayoutDashboard, Users, MapPin, Tag, Bell, Truck, 
  Settings, LogOut, ChevronLeft, ChevronRight, Map, Activity,
  ClipboardList, PlusCircle, Search, User
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Orders', href: '/admin/orders', icon: <Package size={18} /> },
  { label: 'Agents', href: '/admin/agents', icon: <Users size={18} /> },
  { label: 'Zones', href: '/admin/zones', icon: <Map size={18} /> },
  { label: 'Areas', href: '/admin/areas', icon: <MapPin size={18} /> },
  { label: 'Rate Cards', href: '/admin/rates', icon: <Tag size={18} /> },
  { label: 'Notifications', href: '/admin/notifications', icon: <Bell size={18} /> },
];

const customerNav: NavItem[] = [
  { label: 'Dashboard', href: '/customer', icon: <LayoutDashboard size={18} /> },
  { label: 'Create Delivery', href: '/customer/create', icon: <PlusCircle size={18} /> },
  { label: 'My Orders', href: '/customer/orders', icon: <ClipboardList size={18} /> },
  { label: 'Track Order', href: '/customer/track', icon: <Search size={18} /> },
  { label: 'Notifications', href: '/customer/notifications', icon: <Bell size={18} /> },
];

const agentNav: NavItem[] = [
  { label: 'Dashboard', href: '/agent', icon: <LayoutDashboard size={18} /> },
  { label: 'My Deliveries', href: '/agent/deliveries', icon: <Truck size={18} /> },
  { label: 'Notifications', href: '/agent/notifications', icon: <Bell size={18} /> },
];

export function Sidebar() {
  const { user, logout, isAdmin, isAgent, isCustomer } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = isAdmin ? adminNav : isAgent ? agentNav : customerNav;
  const roleLabel = isAdmin ? 'Admin' : isAgent ? 'Delivery Agent' : 'Customer';
  const roleColor = isAdmin ? 'from-indigo-600 to-violet-600' : isAgent ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500';

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-100', collapsed && 'justify-center px-2')}>
        <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br', roleColor, 'text-white flex-shrink-0')}>
          <Truck size={18} />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-gray-900">LastMile</p>
            <p className="text-xs text-gray-400">Delivery Tracker</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && item.href !== '/customer' && item.href !== '/agent' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={active ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br text-white text-xs font-bold flex-shrink-0', roleColor)}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{roleLabel}</p>
            </div>
            <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="w-full flex justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
            <LogOut size={18} />
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center mt-2 p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
