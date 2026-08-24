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

const STATUS_PIE_COLORS = {
  CREATED: '#64748b', ASSIGNED: '#3b82f6', PICKED_UP: '#6366f1',
  IN_TRANSIT: '#8b5cf6', OUT_FOR_DELIVERY: '#f59e0b', DELIVERED: '#10b981',
  FAILED: '#ef4444', RESCHEDULED: '#f97316', CANCELLED: '#9ca3af',
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
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
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
                <h3 className="text-base font-semibold text-gray-900 mb-4">Orders by Status</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data</div>}
              </Card>

              {/* Orders by Zone */}
              <Card>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Orders by Zone</h3>
                {zoneChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={zoneChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="zone" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data</div>}
              </Card>
            </div>

            {/* Recent Orders */}
            <Card padding={false}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Recent Orders</h3>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>View All</Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-medium text-gray-500 bg-gray-50">
                      <th className="px-6 py-3 text-left">Tracking #</th>
                      <th className="px-6 py-3 text-left">Customer</th>
                      <th className="px-6 py-3 text-left">Route</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Charge</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="text-sm font-mono font-medium text-indigo-600 hover:text-indigo-700">
                            {order.tracking_number}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{(order as any).customer?.name || 'N/A'}</td>
                        <td className="px-6 py-3 text-xs text-gray-500">
                          {order.pickup_zone?.code} → {order.drop_zone?.code}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.order_type === 'B2B' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.order_type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.total_charge)}</td>
                        <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-6 py-3 text-xs text-gray-400">{formatDateTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">No orders yet</div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
