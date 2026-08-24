'use client';
// Agent deliveries page — lists all orders for the agent with full details
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, StatusBadge, LoadingState, EmptyState } from '@/components/ui';
import { agentApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';
import { Package } from 'lucide-react';

export default function AgentDeliveriesPage() {
  const { isAgent, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { if (!authLoading && !isAgent) router.push('/login'); }, [authLoading, isAgent, router]);
  useEffect(() => {
    if (!isAgent) return;
    agentApi.orders().then((data: any) => setOrders(data || [])).finally(() => setLoading(false));
  }, [isAgent]);

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;

  if (authLoading || !isAgent) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Deliveries</h1>

        <div className="flex gap-2 flex-wrap mb-6">
          {['', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<Package size={40} />} title="No deliveries found" />
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <Card key={order.id}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-gray-900">{order.tracking_number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{order.pickup_address} → {order.drop_address}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(order.created_at)} · {order.payment_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total_charge)}</p>
                    <p className="text-xs text-gray-400">{order.order_type}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
