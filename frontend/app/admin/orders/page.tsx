'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout, PageHeader } from '@/components/layout/Sidebar';
import { Card, StatusBadge, Button, Select, Input, Modal, LoadingState, EmptyState, toast } from '@/components/ui';
import { admin as adminApi, orders as ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order, Agent, Zone } from '@/types';
import { Package, Search, Filter, RefreshCw, Eye, UserCheck, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['', 'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED', 'CANCELLED'];
const ORDER_TYPES = ['', 'B2B', 'B2C'];
const PAYMENT_TYPES = ['', 'PREPAID', 'COD'];

export default function AdminOrdersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', order_type: '', payment_type: '', search: '' });
  const [page, setPage] = useState(0);
  const limit = 20;

  // Manual assign modal
  const [assignModal, setAssignModal] = useState<Order | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/login');
  }, [authLoading, isAdmin, router]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { skip: String(page * limit), limit: String(limit) };
      if (filters.status) params.status = filters.status;
      if (filters.order_type) params.order_type = filters.order_type;
      if (filters.payment_type) params.payment_type = filters.payment_type;
      if (filters.search) params.search = filters.search;

      const [ordersRes, agentsRes, zonesRes] = await Promise.all([
        adminApi.orders(params) as Promise<any>,
        adminApi.agents({ availability: 'AVAILABLE' }) as Promise<Agent[]>,
        adminApi.zones() as Promise<Zone[]>,
      ]);
      setOrders(ordersRes.orders || []);
      setTotal(ordersRes.total || 0);
      setAgents(agentsRes || []);
      setZones(zonesRes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [isAdmin, filters, page]);

  useEffect(() => { load(); }, [load]);

  const handleAutoAssign = async (orderId: number) => {
    try {
      await ordersApi.autoAssign(orderId);
      toast('Agent auto-assigned successfully!');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const handleManualAssign = async () => {
    if (!assignModal || !selectedAgent) return;
    setAssigning(true);
    try {
      await ordersApi.assign(assignModal.id, parseInt(selectedAgent));
      toast('Agent assigned successfully!');
      setAssignModal(null);
      setSelectedAgent('');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setAssigning(false); }
  };

  if (authLoading || !isAdmin) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} orders total</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={load} loading={loading} variant="secondary" size="sm" icon={<RefreshCw size={14} />}>Refresh</Button>
            <Link href="/admin/orders/create">
              <Button size="sm" icon={<Package size={14} />}>Create Order</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search tracking #..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <Select
              options={STATUSES.map(s => ({ value: s, label: s || 'All Statuses' }))}
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            />
            <Select
              options={ORDER_TYPES.map(s => ({ value: s, label: s || 'All Types' }))}
              value={filters.order_type}
              onChange={e => setFilters(f => ({ ...f, order_type: e.target.value }))}
            />
            <Select
              options={PAYMENT_TYPES.map(s => ({ value: s, label: s || 'All Payments' }))}
              value={filters.payment_type}
              onChange={e => setFilters(f => ({ ...f, payment_type: e.target.value }))}
            />
            <Button onClick={() => setFilters({ status: '', order_type: '', payment_type: '', search: '' })} variant="ghost" size="sm">
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Table */}
        <Card padding={false}>
          {loading ? <LoadingState /> : orders.length === 0 ? (
            <EmptyState icon={<Package size={48} />} title="No orders found" description="Try adjusting your filters" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left">Tracking #</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Route</th>
                      <th className="px-4 py-3 text-left">Agent</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Payment</th>
                      <th className="px-4 py-3 text-left">Charge</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Created</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-medium text-indigo-600 hover:text-indigo-700">
                            {order.tracking_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{(order as any).customer?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          <span className="font-medium">{order.pickup_zone?.code}</span>
                          <span className="mx-1 text-gray-300">→</span>
                          <span className="font-medium">{order.drop_zone?.code}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {(order as any).assigned_agent?.user?.name || <span className="text-gray-300">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.order_type === 'B2B' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.order_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.payment_type === 'COD' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {order.payment_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.total_charge)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(order.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/orders/${order.id}`}>
                              <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                                <Eye size={14} />
                              </button>
                            </Link>
                            {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                              <>
                                <button
                                  onClick={() => { setAssignModal(order); setSelectedAgent(''); }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Manual Assign"
                                >
                                  <UserCheck size={14} />
                                </button>
                                <button
                                  onClick={() => handleAutoAssign(order.id)}
                                  className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                  title="Auto Assign"
                                >
                                  <Zap size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} icon={<ChevronLeft size={14} />}>Prev</Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total}>Next <ChevronRight size={14} /></Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Manual Assign Modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Agent">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Assigning agent to order <strong className="font-mono">{assignModal?.tracking_number}</strong>
          </p>
          <Select
            label="Select Available Agent"
            options={agents.map(a => ({
              value: a.id,
              label: `${a.user?.name || 'Agent'} — ${a.current_zone?.code || 'No Zone'} — ${a.vehicle_type}`
            }))}
            placeholder="Choose an agent..."
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button onClick={handleManualAssign} loading={assigning} disabled={!selectedAgent}>Assign Agent</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
