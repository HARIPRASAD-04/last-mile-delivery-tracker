'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, Button, Input, Modal, LoadingState, EmptyState, toast } from '@/components/ui';
import { admin as adminApi } from '@/lib/api';
import type { Zone } from '@/types';
import { Map, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';

export default function AdminZonesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | Zone | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/login'); }, [authLoading, isAdmin, router]);

  const load = async () => {
    setLoading(true);
    try { setZones(await adminApi.zones() as Zone[]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const openCreate = () => { setForm({ name: '', code: '', description: '', is_active: true }); setModal('create'); };
  const openEdit = (z: Zone) => { setForm({ name: z.name, code: z.code, description: z.description || '', is_active: z.is_active }); setModal(z); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'create') {
        await adminApi.createZone(form);
        toast('Zone created!');
      } else if (modal && typeof modal === 'object') {
        await adminApi.updateZone(modal.id, { name: form.name, description: form.description, is_active: form.is_active });
        toast('Zone updated!');
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
          <h1 className="text-2xl font-bold text-gray-900">Zone Management</h1>
          <Button onClick={openCreate} icon={<Plus size={14} />}>Add Zone</Button>
        </div>

        {loading ? <LoadingState /> : zones.length === 0 ? (
          <EmptyState icon={<Map size={48} />} title="No zones" action={<Button onClick={openCreate}>Create Zone</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.map(zone => (
              <Card key={zone.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Map size={16} className="text-indigo-600" />
                    </div>
                    <span className="font-mono text-sm font-bold text-indigo-600">{zone.code}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {zone.is_active ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                    <button onClick={() => openEdit(zone)} className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors">
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{zone.name}</h3>
                {zone.description && <p className="text-xs text-gray-500 mt-1">{zone.description}</p>}
                <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${zone.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {zone.is_active ? 'Active' : 'Inactive'}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create Zone' : 'Edit Zone'}>
        <div className="space-y-4">
          <Input label="Zone Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Zone Alpha" required />
          {modal === 'create' && (
            <Input label="Zone Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. ZONE-A" required />
          )}
          <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
