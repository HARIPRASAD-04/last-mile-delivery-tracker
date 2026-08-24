'use client';
// Shared notifications page for agent role
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, Button, LoadingState, EmptyState } from '@/components/ui';
import { notifications as notifApi } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function AgentNotificationsPage() {
  const { isAgent, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !isAgent) router.push('/login'); }, [authLoading, isAgent, router]);

  const load = () => {
    notifApi.list().then((data: any) => setNotifs(data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);

  const markAllRead = async () => { await notifApi.markAllRead(); load(); };
  const markRead = async (id: number) => {
    await notifApi.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  if (authLoading || !isAgent) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && <Button variant="secondary" size="sm" onClick={markAllRead} icon={<CheckCheck size={14} />}>Mark All Read</Button>}
        </div>
        {loading ? <LoadingState /> : notifs.length === 0 ? (
          <EmptyState icon={<Bell size={40} />} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="space-y-2">
            {notifs.map(n => (
              <button key={n.id} onClick={() => markRead(n.id)} className="w-full text-left">
                <Card className={`transition-all ${!n.is_read ? 'border-amber-200 bg-amber-50/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-amber-500' : 'bg-gray-200'}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
