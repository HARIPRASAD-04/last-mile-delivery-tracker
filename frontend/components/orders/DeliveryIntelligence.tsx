'use client';
import React from 'react';
import { cn, RISK_COLORS, formatTime } from '@/lib/utils';
import type { DeliveryIntelligence } from '@/types';
import { BarChart2, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DeliveryIntelligenceCardProps {
  intelligence: DeliveryIntelligence;
  compact?: boolean;
}

export function DeliveryIntelligenceCard({ intelligence, compact = false }: DeliveryIntelligenceCardProps) {
  const { risk_category, risk_score, confidence, eta_from, eta_to, risk_factors, positive_factors } = intelligence;
  const colors = RISK_COLORS[risk_category];

  const RiskIcon = risk_category === 'LOW' ? CheckCircle : AlertTriangle;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#E0E5EC]',
        'shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
      )}>
        <RiskIcon size={18} className={colors.text} />
        <div>
          <p className="text-xs font-semibold text-[#6B7280]">Delivery Confidence</p>
          <p className={cn('text-sm font-bold', colors.text)}>{confidence}% — {risk_category} RISK</p>
        </div>
        {eta_from && (
          <div className="ml-auto text-right">
            <p className="text-xs text-[#6B7280]">ETA</p>
            <p className="text-sm font-semibold text-[#3D4852]">{formatTime(eta_from)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#E0E5EC] rounded-[32px] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 flex items-center gap-3 border-b border-[rgba(163,177,198,0.2)]">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
          <BarChart2 size={20} className={colors.text} />
        </div>
        <div>
          <h3
            className="font-bold text-[#3D4852]"
            style={{ fontFamily: 'var(--font-display, Plus Jakarta Sans), sans-serif' }}
          >
            Smart Delivery Intelligence
          </h3>
          <p className="text-xs text-[#6B7280]">
            Deterministic logistics scoring — reproducible from order attributes
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-bold bg-[#E0E5EC]',
            'shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]',
            colors.text
          )}>
            {risk_category} RISK
          </span>
          <span className="text-xs text-[#6B7280] font-mono bg-[#E0E5EC] px-2.5 py-1 rounded-full shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]">
            Score: {risk_score}/100
          </span>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Confidence bar — inset track */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Delivery Confidence</span>
            <span className={cn('text-lg font-bold tabular-nums', colors.text)}>{confidence}%</span>
          </div>
          {/* Track: inset well */}
          <div className="w-full bg-[#E0E5EC] rounded-full h-3.5 p-0.5 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.7),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]">
            <div
              className={cn('h-full rounded-full transition-all duration-700 shadow-sm', colors.bar)}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#6B7280] font-medium">0% Risk</span>
            <span className="text-[10px] text-[#6B7280] font-medium">100% Confidence</span>
          </div>
        </div>

        {/* ETA — inset well card */}
        {eta_from && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#E0E5EC] shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.5)]">
            <div className="p-2.5 rounded-xl bg-[#E0E5EC] text-[#6C63FF] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.5)]">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Estimated Delivery Window</p>
              <p className="text-base font-bold text-[#3D4852]">
                {formatTime(eta_from)} – {formatTime(eta_to)}
              </p>
            </div>
          </div>
        )}

        {/* Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {positive_factors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#3D4852] uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#38B2AC]" />
                Positive Factors
              </p>
              <ul className="space-y-2">
                {positive_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#3D4852] p-2.5 rounded-xl bg-[#E0E5EC] shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.5)]">
                    <span className="text-[#38B2AC] font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {risk_factors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#3D4852] uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-[#c07b28]" />
                Risk Factors
              </p>
              <ul className="space-y-2">
                {risk_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#3D4852] p-2.5 rounded-xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
                    <span className="text-[#c07b28] font-bold">⚠</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Scoring methodology note */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#E0E5EC] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]">
          <Info size={16} className="text-[#6C63FF] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Score is computed from: prior failures (+30/attempt), zone distance (+10–20),
            agent assignment (+20 if missing), order age (+15 if &gt;24h), COD payment (+5).
            Confidence = 100 − score.
          </p>
        </div>
      </div>
    </div>
  );
}
