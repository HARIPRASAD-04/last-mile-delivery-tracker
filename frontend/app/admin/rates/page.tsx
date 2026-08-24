'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, Button, Input, Select, Modal, LoadingState, EmptyState, toast } from '@/components/ui';
import { admin as adminApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { RateCard, Zone } from '@/types';
import { Tag, Plus, Edit, Trash, CheckCircle, XCircle } from 'lucide-react';

export default function AdminRatesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rates, setRates] = useState<RateCard[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState<'create' | RateCard | null>(null);
  const [form, setForm] = useState({ order_type: 'B2C', from_zone_id: '', to_zone_id: '', base_rate: '', rate_per_kg: '', cod_surcharge: '', is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/login'); }, [authLoading, isAdmin, router]);

  const load = async () => {
    setLoading(true);
    try {
      const [ratesData, zonesData] = await Promise.all([
        adminApi.rates(filterType ? { order_type: filterType } : undefined) as Promise<RateCard[]>,
        adminApi.zones() as Promise<Zone[]>,
      ]);
      setRates(ratesData);
      setZones(zonesData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, filterType]);

  const openCreate = () => {
    setForm({ order_type: 'B2C', from_zone_id: zones[0]?.id?.toString() || '', to_zone_id: zones[0]?.id?.toString() || '', base_rate: '', rate_per_kg: '', cod_surcharge: '0', is_active: true });
    setModal('create');
  };

  const openEdit = (r: RateCard) => {
    setForm({ order_type: r.order_type, from_zone_id: r.from_zone_id.toString(), to_zone_id: r.to_zone_id.toString(), base_rate: r.base_rate.toString(), rate_per_kg: r.rate_per_kg.toString(), cod_surcharge: r.cod_surcharge.toString(), is_active: r.is_active });
    setModal(r);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        order_type: form.order_type,
        from_zone_id: parseInt(form.from_zone_id),
        to_zone_id: parseInt(form.to_zone_id),
        base_rate: parseFloat(form.base_rate),
        rate_per_kg: parseFloat(form.rate_per_kg),
        cod_surcharge: parseFloat(form.cod_surcharge),
        is_active: form.is_active,
      };
      if (modal === 'create') {
        await adminApi.createRate(data);
        toast('Rate card created!');
      } else if (modal && typeof modal === 'object') {
        await adminApi.updateRate(modal.id, { base_rate: data.base_rate, rate_per_kg: data.rate_per_kg, cod_surcharge: data.cod_surcharge, is_active: data.is_active });
        toast('Rate card updated!');
      }
      setModal(null);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this rate card?')) return;
    try { await adminApi.deleteRate(id); toast('Rate deactivated'); load(); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  if (authLoading || !isAdmin) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rate Cards</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure delivery pricing</p>
          </div>
          <Button onClick={openCreate} icon={<Plus size={14} />}>Add Rate Card</Button>
        </div>

        <div className="mb-6 flex gap-3">
          {['', 'B2B', 'B2C'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t || 'All Types'}
            </button>
          ))}
        </div>

        {loading ? <LoadingState /> : rates.length === 0 ? (
          <EmptyState icon={<Tag size={48} />} title="No rate cards" action={<Button onClick={openCreate}>Create Rate Card</Button>} />
        ) : (
          <Card padding={false}>
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">From Zone</th>
                  <th className="px-4 py-3 text-left">To Zone</th>
                  <th className="px-4 py-3 text-left">Zone Type</th>
                  <th className="px-4 py-3 text-left">Base Rate</th>
                  <th className="px-4 py-3 text-left">Rate/kg</th>
                  <th className="px-4 py-3 text-left">COD Surcharge</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rates.map(rate => (
                  <tr key={rate.id} className={`hover:bg-gray-50 transition-colors ${!rate.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate.order_type === 'B2B' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                        {rate.order_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate.from_zone?.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate.to_zone?.code}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rate.from_zone_id === rate.to_zone_id ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rate.from_zone_id === rate.to_zone_id ? 'Intra-Zone' : 'Inter-Zone'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(rate.base_rate)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(rate.rate_per_kg)}/kg</td>
                    <td className="px-4 py-3 text-sm">{rate.cod_surcharge > 0 ? formatCurrency(rate.cod_surcharge) : '—'}</td>
                    <td className="px-4 py-3">
                      {rate.is_active ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-400" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(rate)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={14} /></button>
                        {rate.is_active && <button onClick={() => handleDelete(rate.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create Rate Card' : 'Edit Rate Card'} size="md">
        <div className="space-y-4">
          {modal === 'create' && (
            <>
              <Select label="Order Type" options={[{value:'B2C',label:'B2C'},{value:'B2B',label:'B2B'}]} value={form.order_type} onChange={e => setForm(f => ({...f, order_type: e.target.value}))} />
              <Select label="From Zone" options={zones.map(z => ({value:z.id, label:`${z.name} (${z.code})`}))} value={form.from_zone_id} onChange={e => setForm(f => ({...f, from_zone_id: e.target.value}))} />
              <Select label="To Zone" options={zones.map(z => ({value:z.id, label:`${z.name} (${z.code})`}))} value={form.to_zone_id} onChange={e => setForm(f => ({...f, to_zone_id: e.target.value}))} />
            </>
          )}
          <Input label="Base Rate (₹)" type="number" value={form.base_rate} onChange={e => setForm(f => ({...f, base_rate: e.target.value}))} placeholder="e.g. 80" />
          <Input label="Rate per kg (₹)" type="number" value={form.rate_per_kg} onChange={e => setForm(f => ({...f, rate_per_kg: e.target.value}))} placeholder="e.g. 15" />
          <Input label="COD Surcharge (₹)" type="number" value={form.cod_surcharge} onChange={e => setForm(f => ({...f, cod_surcharge: e.target.value}))} placeholder="0 for no COD surcharge" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rc_active" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="rounded" />
            <label htmlFor="rc_active" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Rate Card</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
