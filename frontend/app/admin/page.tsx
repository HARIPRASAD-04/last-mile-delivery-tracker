'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout, PageHeader } from '@/components/layout/Sidebar';
import { StatCard, Card, StatusBadge, LoadingState, Button } from '@/components/ui';
import { admin as adminApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { AdminDashboard, Order } from '@/types';
import {
  Package, Users, TrendingUp, AlertCircle, Truck, DollarSign,
  RefreshCw, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import Link from 'next/link';

// Neumorphic-toned semantic colors for charts — violet accent + muted semantics
const STATUS_PIE_COLORS = {
  CREATED:          '#8c97b0',
  ASSIGNED:         '#4f6ac0',
  PICKED_UP:        '#6C63FF',
  IN_TRANSIT:       '#7c5cbf',
  OUT_FOR_DELIVERY: '#c07b28',
  DELIVERED:        '#38B2AC',
  FAILED:           '#b94040',
  RESCHEDULED:      '#b86a2e',
  CANCELLED:        '#9ca3af',
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/login');
  }, [authLoading, isAdmin, router]);

  const load = async () => {
    setLoading(true);
    try {
      const [dash, ordersRes] = await Promise.all([
        adminApi.dashboard() as Promise<AdminDashboard>,
        adminApi.orders({ limit: '5' }) as Promise<any>,
      ]);
      setDashboard(dash);
      setRecentOrders(ordersRes.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (authLoading || !isAdmin) return <LoadingState />;

  const statusChartData = dashboard
    ? Object.entries(dashboard.orders_by_status).map(([status, count]) => ({ status, count }))
    : [];

  const zoneChartData = dashboard
    ? Object.entries(dashboard.orders_by_zone).map(([zone, count]) => ({ zone, count }))
    : [];

  const pieData = statusChartData.map(d => ({
    name: d.status,
    value: d.count,
    color: STATUS_PIE_COLORS[d.status as keyof typeof STATUS_PIE_COLORS] || '#94a3b8',
  }));

  return (
    <DashboardLayout>
      <div className="p-8 md:p-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1
              className="text-2xl font-bold text-[#3D4852]"
              style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
            >
              Admin Dashboard
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <Button onClick={load} loading={loading} variant="secondary" size="sm" icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        </div>

        {loading ? <LoadingState /> : dashboard && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <StatCard title="Total Orders" value={dashboard.total_orders} icon={<Package size={20} />} color="indigo" />
              <StatCard title="Active" value={dashboard.active_deliveries} icon={<Truck size={20} />} color="blue" subtitle="In progress" />
              <StatCard title="Delivered Today" value={dashboard.delivered_today} icon={<TrendingUp size={20} />} color="emerald" />
              <StatCard title="Failed" value={dashboard.failed_deliveries} icon={<AlertCircle size={20} />} color="red" />
              <StatCard title="Agents Available" value={dashboard.available_agents} icon={<Users size={20} />} color="violet" />
              <StatCard title="Revenue" value={formatCurrency(dashboard.total_revenue)} icon={<DollarSign size={20} />} color="amber" subtitle="Delivered orders" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Orders by Status */}
              <Card>
                <h3
                  className="text-base font-bold text-[#3D4852] mb-5"
                  style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
                >
                  Orders by Status
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#E0E5EC',
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '9px 9px 16px rgba(163,177,198,0.6),-9px -9px 16px rgba(255,255,255,0.5)',
                          color: '#3D4852',
                          fontSize: 12,
                        }}
                        formatter={(v, n) => [v, n]}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: '#6B7280', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-60 flex items-center justify-center text-[#6B7280] text-sm">No data</div>}
              </Card>

              {/* Orders by Zone */}
              <Card>
                <h3
                  className="text-base font-bold text-[#3D4852] mb-5"
                  style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
                >
                  Orders by Zone
                </h3>
                {zoneChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={zoneChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,177,198,0.4)" />
                      <XAxis dataKey="zone" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Tooltip
                        contentStyle={{
                          background: '#E0E5EC',
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '9px 9px 16px rgba(163,177,198,0.6),-9px -9px 16px rgba(255,255,255,0.5)',
                          color: '#3D4852',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="#6C63FF" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-60 flex items-center justify-center text-[#6B7280] text-sm">No data</div>}
              </Card>
            </div>

            {/* Recent Orders */}
            <Card padding={false}>
              <div className="flex items-center justify-between px-6 py-5">
                <h3
                  className="text-base font-bold text-[#3D4852]"
                  style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
                >
                  Recent Orders
                </h3>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>View All</Button>
                </Link>
              </div>
              {/* Inset divider ridge */}
              <div className="mx-6 h-px shadow-[0_1px_3px_rgba(163,177,198,0.5),0_-1px_2px_rgba(255,255,255,0.7)]" />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      <th className="px-6 py-3 text-left">Tracking #</th>
                      <th className="px-6 py-3 text-left">Customer</th>
                      <th className="px-6 py-3 text-left">Route</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Charge</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr
                        key={order.id}
                        className="border-t border-[rgba(163,177,198,0.2)] hover:bg-[rgba(255,255,255,0.3)] transition-colors duration-200"
                      >
                        <td className="px-6 py-3.5">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-sm font-mono font-semibold text-[#6C63FF] hover:text-[#8B84FF] transition-colors"
                          >
                            {order.tracking_number}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-[#3D4852]">{(order as any).customer?.name || 'N/A'}</td>
                        <td className="px-6 py-3.5 text-xs text-[#6B7280] font-medium">
                          {order.pickup_zone?.code} → {order.drop_zone?.code}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] ${
                            order.order_type === 'B2B'
                              ? 'text-[#7c5cbf] bg-[#E0E5EC] ring-1 ring-[rgba(124,92,191,0.3)]'
                              : 'text-[#4f6ac0] bg-[#E0E5EC] ring-1 ring-[rgba(79,106,192,0.3)]'
                          }`}>
                            {order.order_type}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-[#3D4852]">{formatCurrency(order.total_charge)}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={order.status} /></td>
                        <td className="px-6 py-3.5 text-xs text-[#6B7280]">{formatDateTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentOrders.length === 0 && (
                  <div className="text-center py-12 text-[#6B7280] text-sm">No orders yet</div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

