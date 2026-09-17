import React from 'react';
import type { SourceCategory } from '../../types';
import { SOURCE_CATEGORY_LABELS } from '../../types';

interface SourceCategoryBadgeProps {
  category: SourceCategory;
  size?: 'sm' | 'md';
}

// CHANGE: no tier coloring here anymore -- SourceType carries the evidentiary
// weight signal now, since category and weight are independent axes and
// coloring category by tier was the duplication this replaced.
export const SourceCategoryBadge: React.FC<SourceCategoryBadgeProps> = ({ category, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  return (
    <span className={`inline-flex items-center rounded border border-zinc-300 bg-zinc-100 text-zinc-700 font-mono font-semibold ${sizeClasses}`}>
      {SOURCE_CATEGORY_LABELS[category]}
    </span>
  );
};
