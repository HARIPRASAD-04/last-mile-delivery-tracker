'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, Button, Input, Select, Modal, LoadingState, EmptyState, toast } from '@/components/ui';
import { admin as adminApi } from '@/lib/api';
import type { Area, Zone } from '@/types';
import { MapPin, Plus, Edit } from 'lucide-react';

export default function AdminAreasPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterZone, setFilterZone] = useState('');
  const [modal, setModal] = useState<'create' | Area | null>(null);
  const [form, setForm] = useState({ name: '', postal_code: '', zone_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/login'); }, [authLoading, isAdmin, router]);

  const load = async () => {
    setLoading(true);
    try {
      const [areasData, zonesData] = await Promise.all([
        adminApi.areas(filterZone ? parseInt(filterZone) : undefined) as Promise<Area[]>,
        adminApi.zones() as Promise<Zone[]>,
      ]);
      setAreas(areasData);
      setZones(zonesData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, filterZone]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'create') {
        await adminApi.createArea({ ...form, zone_id: parseInt(form.zone_id) });
        toast('Area created!');
      } else if (modal && typeof modal === 'object') {
        await adminApi.updateArea(modal.id, { name: form.name, postal_code: form.postal_code, zone_id: parseInt(form.zone_id) });
        toast('Area updated!');
      }
      setModal(null);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (authLoading || !isAdmin) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Area Management</h1>
          <Button onClick={() => { setForm({ name: '', postal_code: '', zone_id: zones[0]?.id?.toString() || '' }); setModal('create'); }} icon={<Plus size={14} />}>
            Add Area
          </Button>
        </div>

        <div className="mb-6 flex gap-3 flex-wrap">
          <button onClick={() => setFilterZone('')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!filterZone ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>All Zones</button>
          {zones.map(z => (
            <button key={z.id} onClick={() => setFilterZone(z.id.toString())} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterZone === z.id.toString() ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {z.code}
            </button>
          ))}
        </div>

        {loading ? <LoadingState /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {areas.map(area => (
              <Card key={area.id} className="relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{area.name}</h3>
                      {area.postal_code && <p className="text-xs text-gray-400">{area.postal_code}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setForm({ name: area.name, postal_code: area.postal_code || '', zone_id: area.zone_id.toString() }); setModal(area); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 rounded transition-all"
                  >
                    <Edit size={14} />
                  </button>
                </div>
                {area.zone && (
                  <div className="mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                    {area.zone.code}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create Area' : 'Edit Area'}>
        <div className="space-y-4">
          <Input label="Area Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mumbai Central" required />
          <Input label="Postal Code" value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} placeholder="e.g. 400001" />
          <Select
            label="Zone"
            options={zones.map(z => ({ value: z.id, label: `${z.name} (${z.code})` }))}
            value={form.zone_id}
            onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))}
            required
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
