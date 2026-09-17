import React from 'react';
import type { LearningStrength } from '../../types';

interface LearningProgressionProps {
  strength: LearningStrength;
  className?: string;
  compact?: boolean;
}

export const LearningProgression: React.FC<LearningProgressionProps> = ({ strength, className = '', compact = false }) => {
  const isContradicted = strength === 'contradicted';

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium rounded border ${
          isContradicted
            ? 'bg-rose-50 text-rose-800 border-rose-300'
            : strength === 'established'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : strength === 'repeated'
            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
            : 'bg-zinc-100 text-zinc-700 border-zinc-300'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        <span className="uppercase text-[11px] font-semibold">{strength}</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span className="uppercase tracking-wider">Learning Progression:</span>
        <span className="font-semibold text-zinc-900 capitalize">{strength}</span>
      </div>

      {isContradicted ? (
        <div className="flex items-center gap-2 p-1.5 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs font-mono">
          <span className="font-bold">BRANCH: CONTRADICTED</span>
          <span className="text-[11px] font-sans text-rose-700">Subsequent outcome disproved initial assumption.</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded border border-zinc-200">
          {(['provisional', 'repeated', 'established'] as LearningStrength[]).map((stg, idx) => {
            const activeIndex = strength === 'provisional' ? 0 : strength === 'repeated' ? 1 : 2;
            const isCompleted = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={stg}
                className={`flex flex-col items-center justify-center py-1 px-1.5 rounded text-center transition-colors ${
                  isCurrent
                    ? 'bg-white shadow-xs border border-zinc-300 font-bold text-zinc-950'
                    : isCompleted
                    ? 'text-zinc-700'
                    : 'text-zinc-400'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  0{idx + 1} {stg}
                </span>
                <div
                  className={`h-1 w-full mt-1 rounded-full ${
                    isCurrent ? 'bg-zinc-800' : isCompleted ? 'bg-zinc-400' : 'bg-zinc-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
