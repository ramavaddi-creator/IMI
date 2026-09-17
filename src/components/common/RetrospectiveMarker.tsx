import React from 'react';
import type { RetrospectiveType } from '../../types';
import { History, CheckCircle2 } from 'lucide-react';

interface RetrospectiveMarkerProps {
  type: RetrospectiveType;
  className?: string;
  showDetails?: boolean;
}

export const RetrospectiveMarker: React.FC<RetrospectiveMarkerProps> = ({ type, className = '', showDetails = false }) => {
  if (type === 'decision_time') {
    return (
      <span
        title="Recorded concurrently at decision time"
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium rounded border border-zinc-300 bg-zinc-50 text-zinc-700 ${className}`}
      >
        <CheckCircle2 className="w-3 h-3 text-zinc-500 shrink-0" />
        <span>[Decision-time]</span>
        {showDetails && <span className="text-[10px] text-zinc-500 font-sans">(Concurrent entry)</span>}
      </span>
    );
  }

  return (
    <span
      title="Reconstructed post-hoc after event execution (neutral audit record)"
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium rounded border border-zinc-300/80 bg-zinc-100 text-zinc-700 ${className}`}
    >
      <History className="w-3 h-3 text-zinc-500 shrink-0" />
      <span>[Reconstructed post-hoc]</span>
      {showDetails && <span className="text-[10px] text-zinc-500 font-sans">(Retrospective record)</span>}
    </span>
  );
};
