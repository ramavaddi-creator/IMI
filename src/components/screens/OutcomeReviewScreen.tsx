import React, { useState } from 'react';
import type { OutcomeItem, UserRole, ActiveScreen } from '../../types';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { RetrospectiveMarker } from '../common/RetrospectiveMarker';
import { LearningProgression } from '../common/LearningProgression';
import { MissingConfidenceBanner } from '../common/MissingConfidenceBanner';
import { ArrowRight, CheckCircle2, AlertOctagon, FileSpreadsheet, Sparkles, ChevronRight } from 'lucide-react';

interface OutcomeReviewScreenProps {
  outcomes: OutcomeItem[];
  currentUserRole: UserRole;
  onNavigate: (screen: ActiveScreen) => void;
}

export const OutcomeReviewScreen: React.FC<OutcomeReviewScreenProps> = ({ outcomes, onNavigate }) => {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(outcomes[0]?.id || '');
  const activeOutcome = outcomes.find((o) => o.id === selectedOutcomeId) || outcomes[0];

  if (!activeOutcome) {
    return <div className="p-8 text-center text-zinc-500 font-mono text-sm">No outcomes recorded yet.</div>;
  }

  const isConfidenceMissing = !activeOutcome.attributionConfidence?.reason || activeOutcome.attributionConfidence.reason.trim() === '';

  return (
    <div className="space-y-5">
      {isConfidenceMissing && (
        <MissingConfidenceBanner
          missingCount={1}
          message="This outcome review is missing an explicit attribution justification reason. Even when attribution is 'Unknown', the reason it cannot be isolated must be provided."
        />
      )}

      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100 border border-zinc-300 rounded">
        {outcomes.map((out) => (
          <button
            key={out.id}
            onClick={() => setSelectedOutcomeId(out.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              out.id === activeOutcome.id ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>{out.code}</span>
            <span className="text-zinc-400">→</span>
            <span>{out.decisionCode}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-zinc-300 rounded shadow-xs p-4 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-zinc-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">{activeOutcome.code}</span>
              <span className="text-xs font-mono text-zinc-600">
                Linked Decision: <strong className="text-zinc-900">{activeOutcome.decisionCode}</strong>
              </span>
              <RetrospectiveMarker type={activeOutcome.retrospective} showDetails />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans">Post-Execution Outcome & Attribution Audit</h1>
            <div className="text-xs font-mono text-zinc-500">
              Evaluated on {activeOutcome.dateEvaluated} by <strong className="text-zinc-800">{activeOutcome.evaluator}</strong>
            </div>
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            <LearningProgression strength={activeOutcome.resultingLearning.learningStrength} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded border border-zinc-300 bg-zinc-50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-zinc-700">
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
              <span>Prior Action Executed</span>
            </div>
            <p className="text-xs sm:text-sm font-sans text-zinc-900 leading-relaxed">{activeOutcome.actionTaken}</p>
          </div>
          <div className="p-4 rounded border-2 border-zinc-900 bg-white space-y-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-zinc-950">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900" />
              <span>What Actually Happened</span>
            </div>
            <p className="text-xs sm:text-sm font-sans text-zinc-900 leading-relaxed font-medium">{activeOutcome.actualOutcome}</p>
          </div>
        </div>

        {activeOutcome.quantitativeResults.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-zinc-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">Quantitative Metrics</h2>
            </div>
            <div className="border border-zinc-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-zinc-100 font-mono text-[11px] text-zinc-600 border-b border-zinc-200">
                  <tr>
                    <th className="p-2.5">Metric</th>
                    <th className="p-2.5">Expected</th>
                    <th className="p-2.5">Actual</th>
                    <th className="p-2.5">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white font-mono">
                  {activeOutcome.quantitativeResults.map((m, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-medium text-zinc-900 font-sans">{m.metric}</td>
                      <td className="p-2.5 text-zinc-600">{m.expected}</td>
                      <td className="p-2.5 font-bold text-zinc-950">{m.actual}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${m.variance.startsWith('+') ? 'bg-emerald-50 text-emerald-800' : 'bg-zinc-100 text-zinc-800'}`}>
                          {m.variance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeOutcome.qualitativeResults.length > 0 && (
          <section className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 block">Qualitative Observations</span>
            <div className="space-y-2">
              {activeOutcome.qualitativeResults.map((q, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded text-xs font-sans text-zinc-800 flex items-start gap-2">
                  <span className="font-mono text-zinc-400 font-bold">•</span>
                  <p className="leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="p-4 bg-zinc-50 border border-zinc-300 rounded space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">Attribution Confidence & Causal Rigor</span>
              <p className="text-[11px] text-zinc-600 font-sans">"Unknown" is an honest, normal, scientifically valid attribution state in IMI.</p>
            </div>
            {activeOutcome.attributionConfidence.level === 'Unknown' && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-zinc-200 text-zinc-800 border border-zinc-300">
                EXPECTED INDETERMINATE STATE
              </span>
            )}
          </div>
          <ConfidenceTag confidence={activeOutcome.attributionConfidence} />
        </section>

        {activeOutcome.unexpectedEffects.length > 0 && (
          <section className="bg-amber-50/40 border border-amber-200 rounded p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-950">
              <AlertOctagon className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider">Unexpected Effects</h3>
            </div>
            <div className="space-y-1.5">
              {activeOutcome.unexpectedEffects.map((effect, idx) => (
                <div key={idx} className="p-2.5 bg-white border border-amber-200 rounded text-xs font-sans text-zinc-900">
                  {effect}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-zinc-900 text-white rounded p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Synthesized Institutional Learning</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Progression: {activeOutcome.resultingLearning.learningStrength.toUpperCase()}</span>
          </div>
          <p className="text-sm font-sans font-normal text-zinc-100 leading-relaxed">"{activeOutcome.resultingLearning.summary}"</p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onNavigate('ask_system')}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors"
            >
              <span>Query System Memory for Related Learnings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
