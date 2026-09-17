import React from 'react';
import type { ApprovalClass } from '../../types';
import { Lock, ShieldAlert, Sliders } from 'lucide-react';

interface ApprovalClassBadgeProps {
  level: ApprovalClass;
  className?: string;
  detailed?: boolean;
}

export const ApprovalClassBadge: React.FC<ApprovalClassBadgeProps> = ({ level, className = '', detailed = false }) => {
  if (level === 'A') {
    return (
      <div
        className={`inline-flex flex-col gap-0.5 border-2 border-zinc-900 bg-zinc-900 text-white px-2.5 py-1 rounded shadow-xs ${className}`}
        title="Class A: High-risk governance decision. Requires Founder / Admin sole confirmation."
      >
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase">
          <Lock className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
          <span>CLASS A (HIGH RISK)</span>
        </div>
        {detailed && (
          <span className="text-[10px] font-sans font-medium text-zinc-300 tracking-tight">
            Founder sole confirmation required • Dual-acknowledgment barrier
          </span>
        )}
      </div>
    );
  }

  if (level === 'B') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 border border-zinc-500 bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded text-xs font-mono font-medium ${className}`}
        title="Class B: Operational marketing policy decision. Research Editor or Founder can approve."
      >
        <ShieldAlert className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
        <span className="font-semibold uppercase">CLASS B (STANDARD)</span>
        {detailed && <span className="text-[10px] text-zinc-500 font-sans ml-1">• Senior review</span>}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 border border-zinc-300 bg-zinc-50 text-zinc-700 px-2 py-0.5 rounded text-xs font-mono ${className}`}
      title="Class C: Routine operational adjustments."
    >
      <Sliders className="w-3 h-3 text-zinc-500 shrink-0" />
      <span className="font-medium uppercase">CLASS C (ROUTINE)</span>
      {detailed && <span className="text-[10px] text-zinc-500 font-sans ml-1">• Desk lead signoff</span>}
    </div>
  );
};
