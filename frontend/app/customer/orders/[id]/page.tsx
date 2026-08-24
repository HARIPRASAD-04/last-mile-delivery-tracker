'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, StatusBadge, Button, Input, Modal, LoadingState, toast } from '@/components/ui';
import { TrackingTimeline } from '@/components/orders/TrackingTimeline';
import { DeliveryIntelligenceCard } from '@/components/orders/DeliveryIntelligence';
import { orders as ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';
import { ArrowLeft, RotateCcw, Package, MapPin, Weight, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const { isCustomer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Reschedule modal
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => { if (!authLoading && !isCustomer) router.push('/login'); }, [authLoading, isCustomer, router]);

  const load = useCallback(async () => {
    try {
      const data = await ordersApi.get(Number(id)) as Order;
      setOrder(data);
    } catch { router.push('/customer/orders'); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => {
    if (isCustomer && id) {
      load();
      // Auto-refresh for active orders
      const interval = setInterval(load, 30000);
      return () => clearInterval(interval);
    }
  }, [isCustomer, id, load]);

  const handleReschedule = async () => {
    if (!rescheduleDate) { toast('Please pick a date', 'error'); return; }
    setRescheduling(true);
    try {
      await ordersApi.reschedule(Number(id), {
        reschedule_date: new Date(rescheduleDate).toISOString(),
        note: rescheduleNote,
      });
      toast('Order rescheduled!');
      setRescheduleModal(false);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setRescheduling(false); }
  };

  if (authLoading || !isCustomer || loading) return <DashboardLayout><LoadingState /></DashboardLayout>;
  if (!order) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/customer/orders">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>Back</Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{order.tracking_number}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Created {formatDateTime(order.created_at)}</p>
          </div>
          {order.status === 'FAILED' && (
            <Button onClick={() => setRescheduleModal(true)} variant="outline" icon={<RotateCcw size={14} />}>
              Reschedule
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Failure reason */}
            {order.failure_reason && order.status === 'FAILED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-semibold text-red-700 mb-1">Delivery Failed</p>
                <p className="text-sm text-red-600">{order.failure_reason}</p>
                <p className="text-xs text-red-400 mt-2">Click "Reschedule" to request a new delivery</p>
              </div>
            )}

            {/* Route */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={16} /> Delivery Route</h3>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-emerald-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Pickup</p>
                    <p className="text-sm text-gray-800 font-medium">{order.pickup_address}</p>
                    <p className="text-xs text-gray-400">{order.pickup_zone?.name}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-red-600 font-medium">Delivery</p>
                    <p className="text-sm text-gray-800 font-medium">{order.drop_address}</p>
                    <p className="text-xs text-gray-400">{order.drop_zone?.name}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Delivery Timeline</h3>
              <TrackingTimeline events={order.tracking_events || []} />
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Smart Intelligence */}
            {(order as any).intelligence && !['DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status) && (
              <DeliveryIntelligenceCard intelligence={(order as any).intelligence} />
            )}

            {/* Agent */}
            {order.assigned_agent && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Your Delivery Agent</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm">
                    {order.assigned_agent.user?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{order.assigned_agent.user?.name}</p>
                    <p className="text-xs text-gray-400">{order.assigned_agent.vehicle_type}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Package & Pricing */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Package size={16} />Package</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Dimensions</span><span>{order.length}×{order.width}×{order.height} cm</span></div>
                <div className="flex justify-between text-gray-600"><span>Actual Weight</span><span>{order.actual_weight} kg</span></div>
                <div className="flex justify-between text-gray-600"><span>Volumetric</span><span>{order.volumetric_weight} kg</span></div>
                <div className="flex justify-between font-medium border-t pt-1.5 mt-1.5"><span>Chargeable</span><span className="text-indigo-600">{order.chargeable_weight} kg</span></div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={16} />Payment</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Type</span><span className="font-medium">{order.payment_type}</span></div>
                <div className="flex justify-between text-gray-600"><span>Base Charge</span><span>{formatCurrency(order.base_charge)}</span></div>
                {order.cod_surcharge > 0 && <div className="flex justify-between text-gray-600"><span>COD</span><span>{formatCurrency(order.cod_surcharge)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-1.5 mt-1.5"><span>Total</span><span className="text-emerald-600">{formatCurrency(order.total_charge)}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal open={rescheduleModal} onClose={() => setRescheduleModal(false)} title="Reschedule Delivery">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose a new delivery date and we'll assign a new agent.</p>
          <Input
            label="New Delivery Date"
            type="date"
            value={rescheduleDate}
            onChange={e => setRescheduleDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Delivery Note (optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              rows={2}
              value={rescheduleNote}
              onChange={e => setRescheduleNote(e.target.value)}
              placeholder="e.g. Please call before delivery"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRescheduleModal(false)}>Cancel</Button>
            <Button onClick={handleReschedule} loading={rescheduling}>Reschedule</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
