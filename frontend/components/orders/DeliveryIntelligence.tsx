'use client';
import React from 'react';
import { cn, RISK_COLORS, formatTime } from '@/lib/utils';
import type { DeliveryIntelligence } from '@/types';
import { Shield, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DeliveryIntelligenceCardProps {
  intelligence: DeliveryIntelligence;
  compact?: boolean;
}

export function DeliveryIntelligenceCard({ intelligence, compact = false }: DeliveryIntelligenceCardProps) {
  const { risk_category, risk_score, confidence, eta_from, eta_to, risk_factors, positive_factors } = intelligence;
  const colors = RISK_COLORS[risk_category];

  const RiskIcon = risk_category === 'LOW' ? CheckCircle : risk_category === 'MEDIUM' ? AlertTriangle : AlertTriangle;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', colors.bg, 'border-opacity-20')}>
        <RiskIcon size={18} className={colors.text} />
        <div>
          <p className="text-xs font-medium text-gray-600">Delivery Confidence</p>
          <p className={cn('text-sm font-bold', colors.text)}>{confidence}% — {risk_category} RISK</p>
        </div>
        {eta_from && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">ETA</p>
            <p className="text-sm font-semibold text-gray-800">{formatTime(eta_from)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={cn('px-6 py-4 flex items-center gap-3', colors.bg)}>
        <Shield size={22} className={colors.text} />
        <div>
          <h3 className="font-semibold text-gray-900">Smart Delivery Intelligence</h3>
          <p className="text-xs text-gray-500">Powered by logistics heuristics</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={cn('px-3 py-1 rounded-full text-xs font-bold', colors.bg, colors.text, 'border border-current border-opacity-30')}>
            {risk_category} RISK
          </span>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Confidence bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Delivery Confidence</span>
            <span className={cn('text-lg font-bold', colors.text)}>{confidence}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', colors.bar)}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">0%</span>
            <span className="text-xs text-gray-400">100%</span>
          </div>
        </div>

        {/* ETA */}
        {eta_from && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Clock size={20} className="text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Estimated Delivery Window</p>
              <p className="text-base font-semibold text-gray-900">
                {formatTime(eta_from)} – {formatTime(eta_to)}
              </p>
            </div>
          </div>
        )}

        {/* Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positive_factors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <CheckCircle size={12} className="text-emerald-500" />
                Positive Factors
              </p>
              <ul className="space-y-1.5">
                {positive_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {risk_factors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500" />
                Risk Factors
              </p>
              <ul className="space-y-1.5">
                {risk_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
