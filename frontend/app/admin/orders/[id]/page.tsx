'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, StatusBadge, Button, Modal, Select, LoadingState, toast } from '@/components/ui';
import { TrackingTimeline } from '@/components/orders/TrackingTimeline';
import { DeliveryIntelligenceCard } from '@/components/orders/DeliveryIntelligence';
import { orders as ordersApi, admin as adminApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order, Agent } from '@/types';
import { ArrowLeft, UserCheck, Zap, Edit, Package, MapPin, Weight, CreditCard } from 'lucide-react';
import Link from 'next/link';

const STATUSES_ALLOWED = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED', 'CANCELLED'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignModal, setAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusDesc, setStatusDesc] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/login');
  }, [authLoading, isAdmin, router]);

  const load = async () => {
    setLoading(true);
    try {
      const [orderData, agentsData] = await Promise.all([
        ordersApi.get(Number(id)) as Promise<Order>,
        adminApi.agents({ availability: 'AVAILABLE' }) as Promise<Agent[]>,
      ]);
      setOrder(orderData);
      setAgents(agentsData);
    } catch { router.push('/admin/orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin && id) load(); }, [isAdmin, id]);

  const handleAutoAssign = async () => {
    try {
      await ordersApi.autoAssign(Number(id));
      toast('Agent auto-assigned!');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const handleManualAssign = async () => {
    if (!selectedAgent) return;
    setAssigning(true);
    try {
      await ordersApi.assign(Number(id), parseInt(selectedAgent));
      toast('Agent assigned!');
      setAssignModal(false);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setAssigning(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await ordersApi.updateStatus(Number(id), { status: newStatus, description: statusDesc || undefined });
      toast('Status updated!');
      setStatusModal(false);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setUpdatingStatus(false); }
  };

  if (authLoading || !isAdmin || loading) return <DashboardLayout><LoadingState /></DashboardLayout>;
  if (!order) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>Back</Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{order.tracking_number}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Created {formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex gap-2">
            {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setAssignModal(true)} icon={<UserCheck size={14} />}>
                  Assign Agent
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAutoAssign} icon={<Zap size={14} />}>
                  Auto Assign
                </Button>
                <Button size="sm" onClick={() => { setNewStatus(order.status); setStatusModal(true); }} icon={<Edit size={14} />}>
                  Update Status
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package size={16} /> Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Order Type</p>
                  <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${order.order_type === 'B2B' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.order_type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment</p>
                  <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${order.payment_type === 'COD' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {order.payment_type}
                  </span>
                </div>
              </div>
            </Card>

            {/* Pickup & Drop */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={16} /> Pickup & Delivery</h3>
              <div className="space-y-4">
                <div className="flex gap-4 p-3 bg-emerald-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Pickup</p>
                    <p className="text-sm text-gray-800 font-medium">{order.pickup_address}</p>
                    <p className="text-xs text-gray-500">{order.pickup_zone?.name} ({order.pickup_zone?.code})</p>
                  </div>
                </div>
                <div className="flex gap-4 p-3 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-700">Delivery</p>
                    <p className="text-sm text-gray-800 font-medium">{order.drop_address}</p>
                    <p className="text-xs text-gray-500">{order.drop_zone?.name} ({order.drop_zone?.code})</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Package & Pricing */}
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Weight size={16} /> Package</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Dimensions</span><span className="font-medium">{order.length}×{order.width}×{order.height} cm</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Actual</span><span className="font-medium">{order.actual_weight} kg</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Volumetric</span><span className="font-medium">{order.volumetric_weight} kg</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-700 font-medium">Chargeable</span><span className="font-bold text-indigo-600">{order.chargeable_weight} kg</span></div>
                </div>
              </Card>
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={16} /> Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Base Charge</span><span className="font-medium">{formatCurrency(order.base_charge)}</span></div>
                  {order.cod_surcharge > 0 && <div className="flex justify-between"><span className="text-gray-500">COD Surcharge</span><span className="font-medium">{formatCurrency(order.cod_surcharge)}</span></div>}
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-700 font-medium">Total</span><span className="font-bold text-emerald-600 text-base">{formatCurrency(order.total_charge)}</span></div>
                </div>
              </Card>
            </div>

            {/* Tracking Timeline */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Tracking History</h3>
              <TrackingTimeline events={order.tracking_events || []} />
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Smart Intelligence */}
            {(order as any).intelligence && (
              <DeliveryIntelligenceCard intelligence={(order as any).intelligence} />
            )}

            {/* Customer */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{(order as any).customer?.name}</p>
                <p className="text-gray-500">{(order as any).customer?.email}</p>
                {(order as any).customer?.phone && <p className="text-gray-500">{(order as any).customer?.phone}</p>}
              </div>
            </Card>

            {/* Agent */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Assigned Agent</h3>
              {order.assigned_agent ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">{order.assigned_agent.user?.name}</p>
                  <p className="text-gray-500">{order.assigned_agent.user?.email}</p>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.assigned_agent.availability_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                      order.assigned_agent.availability_status === 'BUSY' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}>{order.assigned_agent.availability_status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{order.assigned_agent.vehicle_type}</span>
                  </div>
                </div>
              ) : <p className="text-sm text-gray-400">No agent assigned</p>}
            </Card>

            {/* Failure info */}
            {order.failure_reason && (
              <Card>
                <h3 className="font-semibold text-red-700 mb-2">Failure Reason</h3>
                <p className="text-sm text-red-600">{order.failure_reason}</p>
                {order.reschedule_date && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Rescheduled to</p>
                    <p className="text-sm font-medium text-gray-800">{formatDateTime(order.reschedule_date)}</p>
                    {order.reschedule_note && <p className="text-xs text-gray-500 mt-1">{order.reschedule_note}</p>}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Manual Agent Assignment">
        <div className="space-y-4">
          <Select
            label="Available Agents"
            options={agents.map(a => ({
              value: a.id,
              label: `${a.user?.name} — ${a.current_zone?.code || 'No Zone'} — ${a.vehicle_type}`
            }))}
            placeholder="Select agent..."
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button onClick={handleManualAssign} loading={assigning} disabled={!selectedAgent}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Override Status (Admin)">
        <div className="space-y-4">
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            ⚠ Admin status override creates an immutable tracking event.
          </p>
          <Select
            label="New Status"
            options={STATUSES_ALLOWED.map(s => ({ value: s, label: s }))}
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              rows={2}
              value={statusDesc}
              onChange={e => setStatusDesc(e.target.value)}
              placeholder="Reason for status override..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} loading={updatingStatus}>Update Status</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
