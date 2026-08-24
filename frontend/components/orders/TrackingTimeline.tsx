'use client';
import React from 'react';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui';
import type { TrackingEvent, OrderStatus } from '@/types';
import { Package, User, CheckCircle, MapPin, AlertCircle, RotateCcw, XCircle, Truck } from 'lucide-react';

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  CREATED:          <Package size={14} />,
  ASSIGNED:         <User size={14} />,
  PICKED_UP:        <Package size={14} />,
  IN_TRANSIT:       <Truck size={14} />,
  OUT_FOR_DELIVERY: <MapPin size={14} />,
  DELIVERED:        <CheckCircle size={14} />,
  FAILED:           <AlertCircle size={14} />,
  RESCHEDULED:      <RotateCcw size={14} />,
  CANCELLED:        <XCircle size={14} />,
};

const STATUS_ICON_COLORS: Record<OrderStatus, string> = {
  CREATED:          'text-[#8c97b0]',
  ASSIGNED:         'text-[#4f6ac0]',
  PICKED_UP:        'text-[#6C63FF]',
  IN_TRANSIT:       'text-[#7c5cbf]',
  OUT_FOR_DELIVERY: 'text-[#c07b28]',
  DELIVERED:        'text-[#38B2AC]',
  FAILED:           'text-[#b94040]',
  RESCHEDULED:      'text-[#b86a2e]',
  CANCELLED:        'text-[#9ca3af]',
};

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-[#6B7280] text-sm">
        No tracking events recorded yet
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
          const iconColor = STATUS_ICON_COLORS[event.status];

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon + Vertical Track */}
              <div className="flex flex-col items-center">
                {/* Neumorphic Icon Well — inset shadow circle */}
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 bg-[#E0E5EC] ${iconColor} z-10 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.7),inset_-3px_-3px_6px_rgba(255,255,255,0.6)]`}
                >
                  {icon}
                </div>
                {!isLast && (
                  // Inset track line
                  <div className="w-0.5 flex-1 bg-[rgba(163,177,198,0.4)] my-1 min-h-[2rem] shadow-[1px_0_2px_rgba(255,255,255,0.6)]" />
                )}
              </div>

              {/* Event Card Content */}
              <div className="pb-6 flex-1 min-w-0">
                <div className="p-4 rounded-2xl bg-[#E0E5EC] shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.5)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <StatusBadge status={event.status} />
                      {event.description && (
                        <p className="text-sm font-medium text-[#3D4852] mt-1.5">{event.description}</p>
                      )}
                      {event.actor && (
                        <p className="text-xs text-[#6B7280]">
                          by <span className="font-semibold text-[#3D4852]">{event.actor.name}</span> ({event.actor.role})
                        </p>
                      )}
                      {event.location && (
                        <p className="text-xs text-[#6B7280] flex items-center gap-1">
                          <MapPin size={11} className="text-[#6C63FF]" /> {event.location}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-[#6B7280] font-mono whitespace-nowrap flex-shrink-0">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
