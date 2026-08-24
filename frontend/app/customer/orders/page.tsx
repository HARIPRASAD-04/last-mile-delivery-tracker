'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, StatusBadge, LoadingState, EmptyState, Button } from '@/components/ui';
import { orders as ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CustomerOrdersPage() {
  const { isCustomer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { if (!authLoading && !isCustomer) router.push('/login'); }, [authLoading, isCustomer, router]);
  useEffect(() => {
    if (!isCustomer) return;
    ordersApi.list().then((data: any) => setAllOrders(data || [])).finally(() => setLoading(false));
  }, [isCustomer]);

  const filtered = filter ? allOrders.filter(o => o.status === filter) : allOrders;

  if (authLoading || !isCustomer) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <Link href="/customer/create"><Button icon={<Plus size={14} />}>New Delivery</Button></Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {['', 'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<Package size={40} />} title="No orders" description={filter ? `No ${filter} orders` : 'Create your first delivery'}
            action={!filter ? <Link href="/customer/create"><Button>Create Delivery</Button></Link> : undefined} />
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <Link key={order.id} href={`/customer/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-bold text-gray-900">{order.tracking_number}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.pickup_address} → {order.drop_address}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.order_type} · {order.payment_type} · {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-gray-900">{formatCurrency(order.total_charge)}</p>
                      {order.assigned_agent && (
                        <p className="text-xs text-gray-400">Agent: {order.assigned_agent.user?.name}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
