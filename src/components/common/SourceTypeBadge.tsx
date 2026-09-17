import React from 'react';
import type { SourceType } from '../../types';
import { SOURCE_TYPE_LABELS } from '../../types';

interface SourceTypeBadgeProps {
  sourceType: SourceType;
  size?: 'sm' | 'md';
}

// CHANGE: color encodes evidentiary weight directly -- a tiger photograph you
// took, an NTCA record, a peer-reviewed paper, and an Instagram comment should
// never look like they carry the same trust level at a glance.
const TYPE_STYLES: Record<SourceType, string> = {
  PRIMARY_EVIDENCE: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  FIRST_PARTY_COMMERCIAL: 'bg-indigo-50 text-indigo-800 border-indigo-300',
  FIRST_PARTY_AUDIENCE: 'bg-teal-50 text-teal-800 border-teal-300',
  OFFICIAL: 'bg-blue-50 text-blue-800 border-blue-300',
  SCIENTIFIC: 'bg-violet-50 text-violet-800 border-violet-300',
  MARKET: 'bg-amber-50 text-amber-800 border-amber-300',
  MEDIA: 'bg-orange-50 text-orange-800 border-orange-300',
  SOCIAL: 'bg-zinc-100 text-zinc-600 border-zinc-300',
};

export const SourceTypeBadge: React.FC<SourceTypeBadgeProps> = ({ sourceType, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  return (
    <span className={`inline-flex items-center rounded border font-mono font-semibold ${sizeClasses} ${TYPE_STYLES[sourceType]}`}>
      {SOURCE_TYPE_LABELS[sourceType]}
    </span>
  );
};
