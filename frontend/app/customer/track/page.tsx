'use client';
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Button, Input, Card, StatusBadge, LoadingState } from '@/components/ui';
import { TrackingTimeline } from '@/components/orders/TrackingTimeline';
import { DeliveryIntelligenceCard } from '@/components/orders/DeliveryIntelligence';
import { orders as ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';
import { Search, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function CustomerTrackPage() {
  const { isCustomer, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    setOrder(null);
    try {
      const data = await ordersApi.track(query.trim()) as Order;
      setOrder(data);
    } catch {
      setNotFound(true);
    } finally { setSearching(false); }
  };

  if (authLoading) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your tracking number to see real-time delivery status</p>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              placeholder="LMD-20260824-AB12"
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>
          <Button type="submit" loading={searching} size="lg">Track</Button>
        </form>

        {notFound && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="font-semibold text-gray-700">Order Not Found</p>
            <p className="text-sm text-gray-400 mt-1">Check the tracking number and try again</p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Tracking Number</p>
                  <p className="font-mono text-2xl font-bold text-gray-900">{order.tracking_number}</p>
                  <div className="mt-2"><StatusBadge status={order.status} /></div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Order Created</p>
                  <p className="text-sm text-gray-700">{formatDateTime(order.created_at)}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(order.total_charge)}</p>
                  <p className="text-xs text-gray-400">{order.order_type} · {order.payment_type}</p>
                </div>
              </div>
            </Card>

            {/* Intelligence */}
            {(order as any).intelligence && !['DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status) && (
              <DeliveryIntelligenceCard intelligence={(order as any).intelligence} />
            )}

            {/* Route */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Delivery Route</h3>
              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-emerald-50 rounded-xl">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Pickup</p>
                  <p className="text-sm font-medium text-gray-900">{order.pickup_address}</p>
                  <p className="text-xs text-gray-400">{order.pickup_zone?.code}</p>
                </div>
                <div className="flex-1 p-3 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600 font-medium mb-1">Delivery</p>
                  <p className="text-sm font-medium text-gray-900">{order.drop_address}</p>
                  <p className="text-xs text-gray-400">{order.drop_zone?.code}</p>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Live Tracking</h3>
              <TrackingTimeline events={order.tracking_events || []} />
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
