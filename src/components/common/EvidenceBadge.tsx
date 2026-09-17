import React from 'react';
import type { EvidenceOrigin } from '../../types';

interface EvidenceBadgeProps {
  origin: EvidenceOrigin;
  className?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ origin, className = '' }) => {
  const originMap: Record<EvidenceOrigin, { label: string; short: string; classes: string }> = {
    original: {
      label: 'Original Internal',
      short: 'ORIGINAL',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    primary_external: {
      label: 'Primary External',
      short: 'PRIMARY EXT',
      classes: 'bg-blue-50 text-blue-800 border-blue-300',
    },
    secondary_external: {
      label: 'Secondary External',
      short: 'SECONDARY EXT',
      classes: 'bg-purple-50 text-purple-800 border-purple-300',
    },
    synthetic: {
      label: 'Synthetic / Modeled',
      short: 'SYNTHETIC',
      classes: 'bg-amber-50 text-amber-800 border-amber-300',
    },
    anecdotal: {
      label: 'Anecdotal Observation',
      short: 'ANECDOTAL',
      classes: 'bg-stone-100 text-stone-800 border-stone-300',
    },
  };

  const item = originMap[origin] || originMap.anecdotal;

  return (
    <span
      title={`Origin: ${item.label}`}
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded border ${item.classes} ${className}`}
    >
      {item.short}
    </span>
  );
};
