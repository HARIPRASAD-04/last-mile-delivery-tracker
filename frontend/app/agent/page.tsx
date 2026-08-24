'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { StatCard, Card, StatusBadge, Button, Modal, Select, LoadingState, EmptyState, toast } from '@/components/ui';
import { agentApi, orders as ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';
import { Truck, CheckCircle, Clock, AlertCircle, Package, MapPin, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const FAILURE_REASONS = [
  'Customer unavailable',
  'Incorrect address',
  'Customer refused package',
  'Access issue',
  'Other',
];

const AGENT_NEXT_STATUSES: Record<string, string[]> = {
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
};

export default function AgentDashboardPage() {
  const { user, isAgent, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [failModal, setFailModal] = useState<Order | null>(null);
  const [failReason, setFailReason] = useState('');
  const [failing, setFailing] = useState(false);
  const [statusModal, setStatusModal] = useState<{ order: Order; next: string[] } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { if (!authLoading && !isAgent) router.push('/login'); }, [authLoading, isAgent, router]);

  const load = async () => {
    if (!isAgent) return;
    setLoading(true);
    try {
      const [dash, ordersData] = await Promise.all([
        agentApi.dashboard() as Promise<any>,
        agentApi.orders() as Promise<Order[]>,
      ]);
      setDashboard(dash);
      setOrders(ordersData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [isAgent]);

  const toggleAvailability = async () => {
    if (!dashboard) return;
    const current = dashboard.availability_status;
    const next = current === 'AVAILABLE' ? 'OFFLINE' : current === 'OFFLINE' ? 'AVAILABLE' : 'AVAILABLE';
    try {
      const updated = await agentApi.updateAvailability(next) as any;
      setDashboard((d: any) => ({ ...d, availability_status: updated.availability_status }));
      toast(`Status updated to ${next}`);
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const handleStatusUpdate = async () => {
    if (!statusModal || !selectedStatus) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(statusModal.order.id, { status: selectedStatus });
      toast('Status updated!');
      setStatusModal(null);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setUpdating(false); }
  };

  const handleFail = async () => {
    if (!failModal || !failReason) { toast('Please select a reason', 'error'); return; }
    setFailing(true);
    try {
      await ordersApi.fail(failModal.id, { failure_reason: failReason });
      toast('Delivery marked as failed');
      setFailModal(null);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setFailing(false); }
  };

  const activeOrders = orders.filter(o => ['ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');

  if (authLoading || !isAgent) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome, {user?.name}</p>
          </div>

          {dashboard && (
            <button onClick={toggleAvailability} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              dashboard.availability_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
              dashboard.availability_status === 'BUSY' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
              {dashboard.availability_status === 'AVAILABLE' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {dashboard.availability_status}
            </button>
          )}
        </div>

        {/* Stats */}
        {dashboard && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Today's Deliveries" value={dashboard.today_deliveries} icon={<Truck size={20} />} color="indigo" />
            <StatCard title="Completed" value={dashboard.completed} icon={<CheckCircle size={20} />} color="emerald" />
            <StatCard title="Pending" value={dashboard.pending} icon={<Clock size={20} />} color="amber" />
            <StatCard title="Failed" value={dashboard.failed} icon={<AlertCircle size={20} />} color="red" />
          </div>
        )}

        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Deliveries</h2>
          {loading ? <LoadingState /> : activeOrders.length === 0 ? (
            <EmptyState icon={<Package size={40} />} title="No active deliveries" description="You're all caught up!" />
          ) : (
            <div className="space-y-4">
              {activeOrders.map(order => {
                const nextStatuses = AGENT_NEXT_STATUSES[order.status] || [];
                return (
                  <Card key={order.id} className="border-l-4 border-l-indigo-400">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-900">{order.tracking_number}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-emerald-500" />
                            Pickup: {order.pickup_address}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-red-500" />
                            Delivery: {order.drop_address}
                          </div>
                          <div>Customer: {(order as any).customer?.name}</div>
                          <div>Payment: <span className={`font-medium ${order.payment_type === 'COD' ? 'text-amber-600' : 'text-green-600'}`}>{order.payment_type}</span></div>
                          <div>Charge: <span className="font-medium text-gray-900">{formatCurrency(order.total_charge)}</span></div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {nextStatuses.length > 0 && (
                          <Button
                            size="sm"
                            onClick={() => { setStatusModal({ order, next: nextStatuses }); setSelectedStatus(nextStatuses[0]); }}
                            icon={<CheckCircle size={14} />}
                          >
                            Update Status
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => { setFailModal(order); setFailReason(''); }}
                          icon={<AlertTriangle size={14} />}
                        >
                          Failed
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Today</h2>
            <div className="space-y-3">
              {completedOrders.slice(0, 5).map(order => (
                <Card key={order.id} className="opacity-75">
                  <div className="flex items-center gap-4">
                    <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-mono text-sm font-medium text-gray-700">{order.tracking_number}</p>
                      <p className="text-xs text-gray-400">{order.drop_address}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{formatCurrency(order.total_charge)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Update Delivery Status">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Order: <strong className="font-mono">{statusModal?.order.tracking_number}</strong></p>
          <Select
            label="New Status"
            options={(statusModal?.next || []).map(s => ({ value: s, label: s.replace(/_/g, ' ') }))}
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} loading={updating}>Update</Button>
          </div>
        </div>
      </Modal>

      {/* Fail Modal */}
      <Modal open={!!failModal} onClose={() => setFailModal(null)} title="Mark Delivery as Failed">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for the failed delivery attempt.</p>
          <Select
            label="Failure Reason"
            options={FAILURE_REASONS.map(r => ({ value: r, label: r }))}
            value={failReason}
            onChange={e => setFailReason(e.target.value)}
            placeholder="Select reason..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setFailModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleFail} loading={failing}>Mark as Failed</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
