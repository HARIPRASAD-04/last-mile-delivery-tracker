'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, Button, Modal, Input, Select, LoadingState, Badge, toast } from '@/components/ui';
import { admin as adminApi } from '@/lib/api';
import type { Agent, Zone } from '@/types';
import { Users, Plus, Edit, Truck, MapPin, Activity } from 'lucide-react';

export default function AdminAgentsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAvail, setFilterAvail] = useState('');

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/login');
  }, [authLoading, isAdmin, router]);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterAvail) params.availability = filterAvail;
      const [agentsData, zonesData] = await Promise.all([
        adminApi.agents(params) as Promise<Agent[]>,
        adminApi.zones() as Promise<Zone[]>,
      ]);
      setAgents(agentsData);
      setZones(zonesData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, filterAvail]);

  const AVAIL_COLORS: Record<string, string> = {
    AVAILABLE: 'success',
    BUSY: 'warning',
    OFFLINE: 'default',
  };

  if (authLoading || !isAdmin) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Agents</h1>
            <p className="text-sm text-gray-500 mt-0.5">{agents.length} agents total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          {['', 'AVAILABLE', 'BUSY', 'OFFLINE'].map(s => (
            <button
              key={s}
              onClick={() => setFilterAvail(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterAvail === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? <LoadingState /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <Card key={agent.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                      {agent.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{agent.user?.name}</p>
                      <p className="text-xs text-gray-400">{agent.user?.email}</p>
                    </div>
                  </div>
                  <Badge variant={AVAIL_COLORS[agent.availability_status] as any}>
                    {agent.availability_status}
                  </Badge>
                </div>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Truck size={12} />
                    <span>{agent.vehicle_type}</span>
                  </div>
                  {agent.current_zone && (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} />
                      <span>{agent.current_zone.name} ({agent.current_zone.code})</span>
                    </div>
                  )}
                  {agent.current_latitude && (
                    <div className="flex items-center gap-2">
                      <Activity size={12} />
                      <span>{agent.current_latitude.toFixed(4)}, {agent.current_longitude?.toFixed(4)}</span>
                    </div>
                  )}
                  {agent.phone && <p>{agent.phone}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
