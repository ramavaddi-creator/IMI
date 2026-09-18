import React, { useState } from 'react';
import type { OutcomeItem, ConfidenceLevel, LearningStrength, UserRole, ActiveScreen } from '../../types';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { RetrospectiveMarker } from '../common/RetrospectiveMarker';
import { LearningProgression } from '../common/LearningProgression';
import { MissingConfidenceBanner } from '../common/MissingConfidenceBanner';
import { ArrowRight, CheckCircle2, AlertOctagon, FileSpreadsheet, Sparkles, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';
import { AiAssistPanel } from '../common/AiAssistPanel';

interface OutcomeReviewScreenProps {
  outcomes: OutcomeItem[];
  // CHANGE: new -- creates a real OutcomeItem, since no UI for this existed
  // before (only possible via a direct backend call until now).
  onCreateOutcome: (outcome: Omit<OutcomeItem, 'id' | 'code' | 'domain'>) => void;
  currentUserRole: UserRole;
  onNavigate: (screen: ActiveScreen) => void;
  aiProviders: { claude: boolean; chatgpt: boolean };
  onAiAssist: (text: string, provider: 'claude' | 'chatgpt') => Promise<string>;
}

export const OutcomeReviewScreen: React.FC<OutcomeReviewScreenProps> = ({ outcomes, onCreateOutcome, onNavigate, aiProviders, onAiAssist }) => {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(outcomes[0]?.id || '');
  const activeOutcome = outcomes.find((o) => o.id === selectedOutcomeId) || outcomes[0];

  // CHANGE: new -- Create Outcome form state.
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDecisionCode, setNewDecisionCode] = useState('');
  const [newActionTaken, setNewActionTaken] = useState('');
  const [newActualOutcome, setNewActualOutcome] = useState('');
  const [newDateEvaluated, setNewDateEvaluated] = useState(new Date().toISOString().split('T')[0]);
  const [newEvaluator, setNewEvaluator] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [newActual, setNewActual] = useState('');
  const [newVariance, setNewVariance] = useState('');
  const [newQualitativeResults, setNewQualitativeResults] = useState('');
  const [newAttributionLevel, setNewAttributionLevel] = useState<ConfidenceLevel>('Medium');
  const [newAttributionReason, setNewAttributionReason] = useState('');
  const [newUnexpectedEffects, setNewUnexpectedEffects] = useState('');
  const [newLearningSummary, setNewLearningSummary] = useState('');
  const [newLearningStrength, setNewLearningStrength] = useState<LearningStrength>('provisional');
  const [createFormError, setCreateFormError] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newDecisionCode.trim() ||
      !newActionTaken.trim() ||
      !newActualOutcome.trim() ||
      !newEvaluator.trim() ||
      !newAttributionReason.trim() ||
      !newLearningSummary.trim()
    ) {
      setCreateFormError('Decision Code, Action Taken, Actual Outcome, Evaluator, Attribution Reason, and Learning Summary are all required.');
      return;
    }

    const quantitativeResults = newMetric.trim()
      ? [
          {
            metric: newMetric.trim(),
            expected: newExpected.trim() || 'Not specified',
            actual: newActual.trim() || 'Not specified',
            variance: newVariance.trim() || 'Not calculated',
          },
        ]
      : [];

    onCreateOutcome({
      decisionCode: newDecisionCode.trim(),
      actionTaken: newActionTaken.trim(),
      actualOutcome: newActualOutcome.trim(),
      dateEvaluated: newDateEvaluated,
      evaluator: newEvaluator.trim(),
      retrospective: 'decision_time',
      quantitativeResults,
      qualitativeResults: newQualitativeResults.split('\n').map((s) => s.trim()).filter(Boolean),
      attributionConfidence: { level: newAttributionLevel, reason: newAttributionReason.trim() },
      unexpectedEffects: newUnexpectedEffects.split('\n').map((s) => s.trim()).filter(Boolean),
      resultingLearning: { summary: newLearningSummary.trim(), learningStrength: newLearningStrength },
    });

    setNewDecisionCode('');
    setNewActionTaken('');
    setNewActualOutcome('');
    setNewDateEvaluated(new Date().toISOString().split('T')[0]);
    setNewEvaluator('');
    setNewMetric('');
    setNewExpected('');
    setNewActual('');
    setNewVariance('');
    setNewQualitativeResults('');
    setNewAttributionLevel('Medium');
    setNewAttributionReason('');
    setNewUnexpectedEffects('');
    setNewLearningSummary('');
    setNewLearningStrength('provisional');
    setCreateFormError('');
    setIsCreateOpen(false);
  };

  const createButton = (
    <button
      type="button"
      onClick={() => setIsCreateOpen(true)}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>Create Outcome</span>
    </button>
  );

  const createModal = isCreateOpen && (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h3 className="text-sm font-bold font-mono uppercase text-zinc-900">Create Outcome</h3>
          <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {createFormError && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{createFormError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Linked Decision Code *</label>
              <input
                type="text"
                value={newDecisionCode}
                onChange={(e) => setNewDecisionCode(e.target.value)}
                placeholder="e.g. DEC-0001"
                className="w-full p-2 text-xs font-mono border border-zinc-300 rounded text-zinc-900"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Date Evaluated *</label>
              <input
                type="date"
                value={newDateEvaluated}
                onChange={(e) => setNewDateEvaluated(e.target.value)}
                className="w-full p-2 text-xs font-mono border border-zinc-300 rounded text-zinc-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Evaluator *</label>
            <input
              type="text"
              value={newEvaluator}
              onChange={(e) => setNewEvaluator(e.target.value)}
              placeholder="e.g. Founder / Admin"
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Prior Action Executed *</label>
            <textarea
              rows={2}
              value={newActionTaken}
              onChange={(e) => setNewActionTaken(e.target.value)}
              placeholder="What was actually done, per the linked decision?"
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">What Actually Happened *</label>
            <textarea
              rows={2}
              value={newActualOutcome}
              onChange={(e) => setNewActualOutcome(e.target.value)}
              placeholder="The real result, whatever it was..."
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
              required
            />
            <AiAssistPanel currentText={newActualOutcome} onAccept={setNewActualOutcome} aiProviders={aiProviders} onAiAssist={onAiAssist} />
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-300 rounded space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase text-zinc-700 block">Quantitative Metric (optional)</span>
            <input
              type="text"
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              placeholder="Metric name, e.g. Weekday enquiries"
              className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900"
            />
            {newMetric.trim() && (
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newExpected}
                  onChange={(e) => setNewExpected(e.target.value)}
                  placeholder="Expected"
                  className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900"
                />
                <input
                  type="text"
                  value={newActual}
                  onChange={(e) => setNewActual(e.target.value)}
                  placeholder="Actual"
                  className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900"
                />
                <input
                  type="text"
                  value={newVariance}
                  onChange={(e) => setNewVariance(e.target.value)}
                  placeholder="Variance, e.g. +31%"
                  className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
              Qualitative Observations (optional, one per line)
            </label>
            <textarea
              rows={2}
              value={newQualitativeResults}
              onChange={(e) => setNewQualitativeResults(e.target.value)}
              placeholder={"e.g. Guests mentioned silence more than luxury\nStaff noted smoother check-in flow"}
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
            />
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-300 rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-zinc-700">Attribution Confidence & Causal Rigor *</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans">"Unknown" is an honest, valid attribution state — explain why it can't be isolated.</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newAttributionLevel}
                onChange={(e) => setNewAttributionLevel(e.target.value as ConfidenceLevel)}
                className="col-span-1 w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Unknown">Unknown</option>
              </select>
              <input
                type="text"
                value={newAttributionReason}
                onChange={(e) => setNewAttributionReason(e.target.value)}
                placeholder="Why this attribution level?"
                className="col-span-2 w-full p-2 text-xs font-sans bg-white border border-zinc-300 rounded text-zinc-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
              Unexpected Effects (optional, one per line)
            </label>
            <textarea
              rows={2}
              value={newUnexpectedEffects}
              onChange={(e) => setNewUnexpectedEffects(e.target.value)}
              placeholder="Anything that happened that wasn't anticipated..."
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
            />
          </div>

          <div className="p-3 bg-zinc-900 rounded space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase text-zinc-200 block">Synthesized Institutional Learning *</span>
            <textarea
              rows={2}
              value={newLearningSummary}
              onChange={(e) => setNewLearningSummary(e.target.value)}
              placeholder="What does this teach us, in one or two sentences?"
              className="w-full p-2 text-xs font-sans border border-zinc-700 rounded bg-zinc-800 text-white placeholder:text-zinc-500"
              required
            />
            <AiAssistPanel currentText={newLearningSummary} onAccept={setNewLearningSummary} aiProviders={aiProviders} onAiAssist={onAiAssist} />
            <select
              value={newLearningStrength}
              onChange={(e) => setNewLearningStrength(e.target.value as LearningStrength)}
              className="w-full p-2 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded text-white"
            >
              <option value="provisional">Provisional (first time seeing this)</option>
              <option value="repeated">Repeated (seen this pattern before)</option>
              <option value="established">Established (confirmed, reliable pattern)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded bg-zinc-900 text-white hover:bg-zinc-800">
              Save Outcome
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!activeOutcome) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 font-sans">Outcome Review</h1>
          {createButton}
        </div>
        <div className="p-8 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-300 rounded bg-white">No outcomes recorded yet.</div>
        {createModal}
      </div>
    );
  }

  const isConfidenceMissing = !activeOutcome.attributionConfidence?.reason || activeOutcome.attributionConfidence.reason.trim() === '';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">{createButton}</div>

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

      {createModal}
    </div>
  );
};
