'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { StatCard, Card, StatusBadge, Button, LoadingState, EmptyState } from '@/components/ui';
import { orders as ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';
import { Package, Truck, CheckCircle, AlertCircle, Plus, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user, isCustomer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isCustomer) router.push('/login');
  }, [authLoading, isCustomer, router]);

  useEffect(() => {
    if (!isCustomer) return;
    ordersApi.list().then((data: any) => setAllOrders(data || [])).finally(() => setLoading(false));
  }, [isCustomer]);

  const totalOrders = allOrders.length;
  const activeOrders = allOrders.filter(o => ['CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','RESCHEDULED'].includes(o.status)).length;
  const delivered = allOrders.filter(o => o.status === 'DELIVERED').length;
  const failed = allOrders.filter(o => o.status === 'FAILED').length;
  const recentOrders = allOrders.slice(0, 5);

  if (authLoading || !isCustomer) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name} 👋</p>
          </div>
          <div className="flex gap-2">
            <Link href="/customer/track">
              <Button variant="secondary" size="sm" icon={<Search size={14} />}>Track Order</Button>
            </Link>
            <Link href="/customer/create">
              <Button size="sm" icon={<Plus size={14} />}>New Delivery</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Orders" value={totalOrders} icon={<Package size={20} />} color="indigo" />
          <StatCard title="Active" value={activeOrders} icon={<Truck size={20} />} color="blue" subtitle="In progress" />
          <StatCard title="Delivered" value={delivered} icon={<CheckCircle size={20} />} color="emerald" />
          <StatCard title="Failed" value={failed} icon={<AlertCircle size={20} />} color="red" />
        </div>

        {/* Recent Orders */}
        {loading ? <LoadingState /> : (
          <Card padding={false}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Recent Orders</h3>
              <Link href="/customer/orders">
                <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>View All</Button>
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={<Package size={40} />}
                title="No orders yet"
                description="Create your first delivery order"
                action={<Link href="/customer/create"><Button icon={<Plus size={14} />}>Create Delivery</Button></Link>}
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map(order => (
                  <Link key={order.id} href={`/customer/orders/${order.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Package size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">{order.tracking_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.pickup_zone?.code} → {order.drop_zone?.code} · {formatDateTime(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(order.total_charge)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
