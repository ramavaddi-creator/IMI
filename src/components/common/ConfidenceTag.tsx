import React from 'react';
import type { ConfidenceRationale, ConfidenceLevel } from '../../types';
import { ShieldCheck, ShieldAlert, Shield, HelpCircle, AlertTriangle } from 'lucide-react';

interface ConfidenceTagProps {
  confidence?: ConfidenceRationale;
  size?: 'sm' | 'md';
  className?: string;
  showMissingWarning?: boolean;
}

export const ConfidenceTag: React.FC<ConfidenceTagProps> = ({ confidence, size = 'md', className = '', showMissingWarning = true }) => {
  const isMissing = !confidence || !confidence.level || !confidence.reason || confidence.reason.trim() === '';

  if (isMissing) {
    if (!showMissingWarning) return null;
    return (
      <div
        role="alert"
        className={`inline-flex items-start gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border border-amber-600/70 bg-amber-50 text-amber-900 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold uppercase tracking-wider">Required: Missing Rationale</span>
          <p className="text-[11px] font-sans text-amber-800 font-normal">
            Every confidence tag must be paired with an explicit stated reason.
          </p>
        </div>
      </div>
    );
  }

  const { level, reason } = confidence;

  const levelConfig: Record<ConfidenceLevel, { label: string; badgeClasses: string; textClasses: string; icon: React.ReactNode }> = {
    High: {
      label: 'High Confidence',
      badgeClasses: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      textClasses: 'text-emerald-950',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />,
    },
    Medium: {
      label: 'Medium Confidence',
      badgeClasses: 'bg-sky-50 border-sky-300 text-sky-900',
      textClasses: 'text-sky-950',
      icon: <Shield className="w-3.5 h-3.5 text-sky-700 shrink-0" />,
    },
    Low: {
      label: 'Low Confidence',
      badgeClasses: 'bg-amber-50 border-amber-300 text-amber-900',
      textClasses: 'text-amber-950',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />,
    },
    Unknown: {
      label: 'Unknown (Expected indeterminate)',
      badgeClasses: 'bg-zinc-100 border-zinc-400 text-zinc-900',
      textClasses: 'text-zinc-800',
      icon: <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />,
    },
  };

  const config = levelConfig[level] || levelConfig.Unknown;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 border font-mono font-medium rounded ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${config.badgeClasses}`}
      >
        {config.icon}
        <span className="font-semibold uppercase tracking-wider">{config.label}</span>
      </div>
      <div className={`text-xs font-normal leading-relaxed pl-1 border-l-2 border-zinc-300 ${config.textClasses}`}>
        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Stated Reason:</span>
        {reason}
      </div>
    </div>
  );
};
