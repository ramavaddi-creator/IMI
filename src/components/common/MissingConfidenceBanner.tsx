import React from 'react';
import { ShieldX } from 'lucide-react';

interface MissingConfidenceBannerProps {
  missingCount: number;
  message?: string;
  onFixClick?: () => void;
  className?: string;
}

export const MissingConfidenceBanner: React.FC<MissingConfidenceBannerProps> = ({ missingCount, message, onFixClick, className = '' }) => {
  if (missingCount <= 0) return null;

  return (
    <div
      role="region"
      aria-label="Intelligence Governance Warning"
      className={`border-l-4 border-l-amber-600 border border-amber-300 bg-amber-50/90 p-3 rounded text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <ShieldX className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
        <div>
          <span className="font-mono font-bold uppercase tracking-wider text-amber-900">
            Governance Rule Violation: Missing Required Confidence or Rationale ({missingCount})
          </span>
          <p className="text-xs text-amber-800 mt-0.5 font-sans leading-relaxed">
            {message ||
              'One or more active items contain ungrounded assertions or empty rationale fields. IMI protocol requires every observation, interpretation, and outcome to explicitly document confidence and its supporting reason.'}
          </p>
        </div>
      </div>
      {onFixClick && (
        <button
          onClick={onFixClick}
          className="self-start sm:self-center shrink-0 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider rounded bg-amber-800 text-white hover:bg-amber-900 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          Review & Complete
        </button>
      )}
    </div>
  );
};
