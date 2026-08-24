'use client';
import React from 'react';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui';
import type { TrackingEvent, OrderStatus } from '@/types';
import { Package, User, CheckCircle, MapPin, AlertCircle, RotateCcw, XCircle, Truck } from 'lucide-react';

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  CREATED: <Package size={14} />,
  ASSIGNED: <User size={14} />,
  PICKED_UP: <Package size={14} />,
  IN_TRANSIT: <Truck size={14} />,
  OUT_FOR_DELIVERY: <MapPin size={14} />,
  DELIVERED: <CheckCircle size={14} />,
  FAILED: <AlertCircle size={14} />,
  RESCHEDULED: <RotateCcw size={14} />,
  CANCELLED: <XCircle size={14} />,
};

const STATUS_BG: Record<OrderStatus, string> = {
  CREATED: 'bg-slate-100 text-slate-600',
  ASSIGNED: 'bg-blue-100 text-blue-600',
  PICKED_UP: 'bg-indigo-100 text-indigo-600',
  IN_TRANSIT: 'bg-violet-100 text-violet-600',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-600',
  DELIVERED: 'bg-emerald-100 text-emerald-600',
  FAILED: 'bg-red-100 text-red-600',
  RESCHEDULED: 'bg-orange-100 text-orange-600',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

const STATUS_LINE: Record<OrderStatus, string> = {
  CREATED: 'border-slate-300',
  ASSIGNED: 'border-blue-400',
  PICKED_UP: 'border-indigo-400',
  IN_TRANSIT: 'border-violet-400',
  OUT_FOR_DELIVERY: 'border-amber-400',
  DELIVERED: 'border-emerald-400',
  FAILED: 'border-red-400',
  RESCHEDULED: 'border-orange-400',
  CANCELLED: 'border-gray-300',
};

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No tracking events yet
      </div>
    );
  }

  const sorted = [...events].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative">
      <div className="space-y-0">
        {sorted.map((event, idx) => {
          const isLast = idx === sorted.length - 1;
          const icon = STATUS_ICONS[event.status];
          const bg = STATUS_BG[event.status];
          const line = STATUS_LINE[event.status];

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon + Line */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${bg} z-10`}>
                  {icon}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 border-l-2 border-dashed mt-1 mb-1 ${line} min-h-[2rem]`} />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <StatusBadge status={event.status} />
                    {event.description && (
                      <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                    )}
                    {event.actor && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        by {event.actor.name} ({event.actor.role})
                      </p>
                    )}
                    {event.location && (
                      <p className="mt-0.5 text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={10} /> {event.location}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
