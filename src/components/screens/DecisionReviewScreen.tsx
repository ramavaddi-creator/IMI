import React, { useState } from 'react';
import type { DecisionItem, DecisionOptionId, ApprovalClass, ConfidenceLevel, UserRole, ActiveScreen } from '../../types';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { RetrospectiveMarker } from '../common/RetrospectiveMarker';
import { ApprovalClassBadge } from '../common/ApprovalClassBadge';
import { MissingConfidenceBanner } from '../common/MissingConfidenceBanner';
import { AlertTriangle, Lock, CheckCircle2, Ban, EyeOff, Clock, Search, MessageSquare, Send, Plus, X } from 'lucide-react';
import { AiAssistPanel } from '../common/AiAssistPanel';

interface DecisionReviewScreenProps {
  decisions: DecisionItem[];
  onApproveDecision: (decisionId: string, approverName: string) => void;
  // CHANGE: new -- creates a real DecisionItem, since no UI for this existed
  // before (only possible via a direct backend call until now).
  onCreateDecision: (decision: Omit<DecisionItem, 'id' | 'code' | 'domain' | 'approvalStatus' | 'approvedBy' | 'approvedAt' | 'schemaFitNote'>) => void;
  currentUserRole: UserRole;
  onNavigate: (screen: ActiveScreen) => void;
  aiProviders: { claude: boolean; chatgpt: boolean };
  onAiAssist: (text: string, provider: 'claude' | 'chatgpt') => Promise<string>;
}

export const DecisionReviewScreen: React.FC<DecisionReviewScreenProps> = ({ decisions, onApproveDecision, onCreateDecision, currentUserRole, aiProviders, onAiAssist }) => {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>(decisions[0]?.id || '');
  const activeDecision = decisions.find((d) => d.id === selectedDecisionId) || decisions[0];

  const [showClassAModal, setShowClassAModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [classAError, setClassAError] = useState('');
  const [showStandardModal, setShowStandardModal] = useState(false);

  // CHANGE: new -- Create Decision form state.
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProblemStatement, setNewProblemStatement] = useState('');
  const [newAssociatedRecordCode, setNewAssociatedRecordCode] = useState('');
  const [newApprovalClass, setNewApprovalClass] = useState<ApprovalClass>('B');
  const [newApproverRequired, setNewApproverRequired] = useState('');
  const [newSelectedOption, setNewSelectedOption] = useState<DecisionOptionId>('publish');
  const [newOptionSummary, setNewOptionSummary] = useState('');
  const [newOptionTradeoffs, setNewOptionTradeoffs] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [newConfidenceLevel, setNewConfidenceLevel] = useState<ConfidenceLevel>('High');
  const [newConfidenceReason, setNewConfidenceReason] = useState('');
  const [newExpectedOutcome, setNewExpectedOutcome] = useState('');
  const [newMeasurementCriteria, setNewMeasurementCriteria] = useState('');
  const [newActionsAvoided, setNewActionsAvoided] = useState('');
  const [newRiskDescription, setNewRiskDescription] = useState('');
  const [newRiskSeverity, setNewRiskSeverity] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newRiskMitigation, setNewRiskMitigation] = useState('');
  const [createFormError, setCreateFormError] = useState('');

  const optionMeta: Record<DecisionOptionId, { icon: React.ReactNode; tagLabel: string }> = {
    publish: { icon: <Send className="w-4 h-4 text-emerald-700" />, tagLabel: 'PUBLIC BROADCAST' },
    do_not_publish: { icon: <EyeOff className="w-4 h-4 text-zinc-700" />, tagLabel: 'DELIBERATE NON-PUBLICATION' },
    wait: { icon: <Clock className="w-4 h-4 text-amber-700" />, tagLabel: 'HOLD & MONITOR' },
    investigate: { icon: <Search className="w-4 h-4 text-indigo-700" />, tagLabel: 'DEFER TO AUDIT' },
    communicate_privately: { icon: <MessageSquare className="w-4 h-4 text-sky-700" />, tagLabel: 'DIRECT 1-ON-1 BRIEFING' },
  };

  const handleOpenApproval = () => {
    if (activeDecision.approvalClass === 'A') {
      setShowClassAModal(true);
      setConfirmInput('');
      setAcknowledgedRisks(false);
      setClassAError('');
    } else {
      setShowStandardModal(true);
    }
  };

  const handleExecuteClassAApproval = () => {
    if (currentUserRole !== 'owner_admin') {
      setClassAError('Access Denied: Only Owner/Admin (Founder) holds authority to approve Class A high-risk governance items.');
      return;
    }
    if (confirmInput.trim().toUpperCase() !== 'CONFIRM CLASS A') {
      setClassAError('You must explicitly type "CONFIRM CLASS A" to execute high-risk authorization.');
      return;
    }
    if (!acknowledgedRisks) {
      setClassAError('You must check the box acknowledging high-risk second-order implications.');
      return;
    }
    onApproveDecision(activeDecision.id, 'Founder / Admin (Owner)');
    setShowClassAModal(false);
  };

  const handleExecuteStandardApproval = () => {
    onApproveDecision(activeDecision.id, currentUserRole === 'owner_admin' ? 'Founder / Admin' : 'Research Editor');
    setShowStandardModal(false);
  };

  // CHANGE: new -- builds a single-option optionsConsidered array from the
  // simplified form (one selected option with its own summary/tradeoffs),
  // which is fully valid against the schema even though it doesn't populate
  // every alternative that theoretically could have been considered.
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newTitle.trim() ||
      !newProblemStatement.trim() ||
      !newAssociatedRecordCode.trim() ||
      !newApproverRequired.trim() ||
      !newRationale.trim() ||
      !newConfidenceReason.trim()
    ) {
      setCreateFormError('Title, Problem Statement, Associated Record Code, Approver Required, Rationale, and a Confidence Reason are all required.');
      return;
    }

    const risks = newRiskDescription.trim()
      ? [{ description: newRiskDescription.trim(), severity: newRiskSeverity, mitigation: newRiskMitigation.trim() || 'Not yet specified.' }]
      : [];

    onCreateDecision({
      title: newTitle.trim(),
      problemStatement: newProblemStatement.trim(),
      associatedRecordCode: newAssociatedRecordCode.trim(),
      approvalClass: newApprovalClass,
      approverRequired: newApproverRequired.trim(),
      retrospective: 'decision_time',
      optionsConsidered: [
        {
          id: newSelectedOption,
          title: optionMeta[newSelectedOption].tagLabel,
          summary: newOptionSummary.trim() || 'No additional summary provided.',
          tradeoffs: newOptionTradeoffs.trim() || 'Not explicitly stated.',
        },
      ],
      selectedOption: newSelectedOption,
      rationale: newRationale.trim(),
      confidence: { level: newConfidenceLevel, reason: newConfidenceReason.trim() },
      expectedOutcome: newExpectedOutcome.trim() || undefined,
      measurementCriteria: newMeasurementCriteria.trim() || undefined,
      actionsDeliberatelyAvoided: newActionsAvoided
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      risks,
    });

    setNewTitle('');
    setNewProblemStatement('');
    setNewAssociatedRecordCode('');
    setNewApprovalClass('B');
    setNewApproverRequired('');
    setNewSelectedOption('publish');
    setNewOptionSummary('');
    setNewOptionTradeoffs('');
    setNewRationale('');
    setNewConfidenceLevel('High');
    setNewConfidenceReason('');
    setNewExpectedOutcome('');
    setNewMeasurementCriteria('');
    setNewActionsAvoided('');
    setNewRiskDescription('');
    setNewRiskSeverity('Medium');
    setNewRiskMitigation('');
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
      <span>Create Decision</span>
    </button>
  );

  const createModal = isCreateOpen && (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h3 className="text-sm font-bold font-mono uppercase text-zinc-900">Create Decision</h3>
          <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {createFormError && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono rounded flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{createFormError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Short decision title..."
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Problem Statement & Context *</label>
            <textarea
              rows={2}
              value={newProblemStatement}
              onChange={(e) => setNewProblemStatement(e.target.value)}
              placeholder="What situation is this decision responding to?"
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Associated Record Code *</label>
              <input
                type="text"
                value={newAssociatedRecordCode}
                onChange={(e) => setNewAssociatedRecordCode(e.target.value)}
                placeholder="e.g. INT-0001"
                className="w-full p-2 text-xs font-mono border border-zinc-300 rounded text-zinc-900"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Approval Class *</label>
              <select
                value={newApprovalClass}
                onChange={(e) => setNewApprovalClass(e.target.value as ApprovalClass)}
                className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
              >
                <option value="A">Class A (high-risk, Founder-only)</option>
                <option value="B">Class B (standard sign-off)</option>
                <option value="C">Class C (routine)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Approver Required *</label>
            <input
              type="text"
              value={newApproverRequired}
              onChange={(e) => setNewApproverRequired(e.target.value)}
              placeholder="e.g. Founder / Admin"
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
              required
            />
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-300 rounded space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase text-zinc-700 block">Selected Course of Action</span>
            <select
              value={newSelectedOption}
              onChange={(e) => setNewSelectedOption(e.target.value as DecisionOptionId)}
              className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
            >
              {(Object.keys(optionMeta) as DecisionOptionId[]).map((id) => (
                <option key={id} value={id}>{optionMeta[id].tagLabel}</option>
              ))}
            </select>
            <textarea
              rows={2}
              value={newOptionSummary}
              onChange={(e) => setNewOptionSummary(e.target.value)}
              placeholder="Summary of this option..."
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
            />
            <textarea
              rows={2}
              value={newOptionTradeoffs}
              onChange={(e) => setNewOptionTradeoffs(e.target.value)}
              placeholder="Tradeoffs of this option..."
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Explicit Rationale *</label>
            <textarea
              rows={2}
              value={newRationale}
              onChange={(e) => setNewRationale(e.target.value)}
              placeholder="Why this option, given the evidence?"
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
              required
            />
            <AiAssistPanel currentText={newRationale} onAccept={setNewRationale} aiProviders={aiProviders} onAiAssist={onAiAssist} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Confidence *</label>
              <select
                value={newConfidenceLevel}
                onChange={(e) => setNewConfidenceLevel(e.target.value as ConfidenceLevel)}
                className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Stated Reason *</label>
              <input
                type="text"
                value={newConfidenceReason}
                onChange={(e) => setNewConfidenceReason(e.target.value)}
                placeholder="Why this confidence?"
                className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase text-indigo-900 block">
              Decision Hypothesis (optional — what turns Outcome into a real test)
            </span>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-600 mb-1">Expected Outcome</label>
              <textarea
                rows={2}
                value={newExpectedOutcome}
                onChange={(e) => setNewExpectedOutcome(e.target.value)}
                placeholder="What do you believe will happen?"
                className="w-full p-2 text-xs font-sans border border-zinc-300 rounded bg-white text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-600 mb-1">Measurement Criteria</label>
              <textarea
                rows={2}
                value={newMeasurementCriteria}
                onChange={(e) => setNewMeasurementCriteria(e.target.value)}
                placeholder="How will you know if it worked?"
                className="w-full p-2 text-xs font-sans border border-zinc-300 rounded bg-white text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
              Actions Deliberately Avoided (optional, one per line)
            </label>
            <textarea
              rows={2}
              value={newActionsAvoided}
              onChange={(e) => setNewActionsAvoided(e.target.value)}
              placeholder={"e.g. Did not discount weekend rates\nDid not guarantee sightings in copy"}
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
            />
          </div>

          <div className="p-3 bg-rose-50/40 border border-rose-200 rounded space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase text-rose-900 block">Anticipated Risk (optional)</span>
            <input
              type="text"
              value={newRiskDescription}
              onChange={(e) => setNewRiskDescription(e.target.value)}
              placeholder="Risk description..."
              className="w-full p-2 text-xs font-sans border border-zinc-300 rounded bg-white text-zinc-900"
            />
            {newRiskDescription.trim() && (
              <>
                <select
                  value={newRiskSeverity}
                  onChange={(e) => setNewRiskSeverity(e.target.value as 'High' | 'Medium' | 'Low')}
                  className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                >
                  <option value="High">High severity</option>
                  <option value="Medium">Medium severity</option>
                  <option value="Low">Low severity</option>
                </select>
                <input
                  type="text"
                  value={newRiskMitigation}
                  onChange={(e) => setNewRiskMitigation(e.target.value)}
                  placeholder="Mitigation..."
                  className="w-full p-2 text-xs font-sans border border-zinc-300 rounded bg-white text-zinc-900"
                />
              </>
            )}
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
              Save Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!activeDecision) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 font-sans">Decision Review</h1>
          {createButton}
        </div>
        <div className="p-8 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-300 rounded bg-white">No decisions exist yet.</div>
        {createModal}
      </div>
    );
  }

  const isConfidenceMissing = !activeDecision.confidence?.reason || activeDecision.confidence.reason.trim() === '';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">{createButton}</div>

      {isConfidenceMissing && (
        <MissingConfidenceBanner missingCount={1} message="This decision review record contains an ungrounded confidence evaluation." />
      )}

      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100 border border-zinc-300 rounded">
        {decisions.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDecisionId(d.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              d.id === activeDecision.id ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>{d.code}</span>
            <span className={`px-1 text-[10px] rounded font-bold ${d.approvalClass === 'A' ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-800'}`}>
              Class {d.approvalClass}
            </span>
            {d.approvalStatus === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          </button>
        ))}
      </div>

      <div className="bg-white border border-zinc-300 rounded shadow-xs p-4 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">{activeDecision.code}</span>
              <ApprovalClassBadge level={activeDecision.approvalClass} detailed />
              <RetrospectiveMarker type={activeDecision.retrospective} />
              <span
                className={`px-2 py-0.5 text-xs font-mono font-bold uppercase rounded ${
                  activeDecision.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {activeDecision.approvalStatus}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans">{activeDecision.title}</h1>
            <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
              <span>
                Linked Record: <strong>{activeDecision.associatedRecordCode}</strong>
              </span>
              <span>•</span>
              <span>
                Approver: <strong className="text-zinc-800">{activeDecision.approverRequired}</strong>
              </span>
            </div>
            {activeDecision.schemaFitNote && (
              <p className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1 mt-1 max-w-2xl">
                SCHEMA FIT NOTE: {activeDecision.schemaFitNote}
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1.5">
            {activeDecision.approvalStatus === 'approved' ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-right">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>APPROVED & LOCKED</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-800 mt-0.5">
                  Sign-off by {activeDecision.approvedBy} on {activeDecision.approvedAt}
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenApproval}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all shadow-xs ${
                  activeDecision.approvalClass === 'A' ? 'bg-zinc-950 text-white hover:bg-zinc-800 border-2 border-zinc-950 ring-2 ring-zinc-400/50' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                {activeDecision.approvalClass === 'A' && <Lock className="w-3.5 h-3.5" />}
                <span>{activeDecision.approvalClass === 'A' ? 'Execute Class A High-Risk Sign-off' : 'Execute Approval Sign-off'}</span>
              </button>
            )}
          </div>
        </div>

        <section>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Problem Statement & Context</span>
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded text-sm text-zinc-900 font-sans leading-relaxed">{activeDecision.problemStatement}</div>
        </section>

        {(activeDecision.expectedOutcome || activeDecision.measurementCriteria) && (
          <section className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-900 block">Decision Hypothesis</span>
            {activeDecision.expectedOutcome && (
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Expected Outcome:</span>
                <p className="text-xs font-sans text-zinc-900">{activeDecision.expectedOutcome}</p>
              </div>
            )}
            {activeDecision.measurementCriteria && (
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Measurement Criteria:</span>
                <p className="text-xs font-sans text-zinc-900">{activeDecision.measurementCriteria}</p>
              </div>
            )}
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Options Considered (Equally-Weighted Non-Publish Choices)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDecision.optionsConsidered.map((opt) => {
              const isSelected = opt.id === activeDecision.selectedOption;
              const meta = optionMeta[opt.id] || optionMeta.wait;
              return (
                <div
                  key={opt.id}
                  className={`p-3.5 rounded border transition-all flex flex-col justify-between ${
                    isSelected ? 'border-2 border-zinc-900 bg-white ring-1 ring-zinc-900 shadow-xs' : 'border-zinc-300 bg-zinc-50/70 opacity-90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {meta.icon}
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-700">{meta.tagLabel}</span>
                      </div>
                      {isSelected && <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-zinc-900 text-white rounded">Selected</span>}
                    </div>
                    <h3 className="text-xs font-bold font-sans text-zinc-950">{opt.title}</h3>
                    <p className="text-xs text-zinc-700 font-sans leading-relaxed">{opt.summary}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-200">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Tradeoffs:</span>
                    <p className="text-[11px] font-sans text-zinc-600 leading-snug">{opt.tradeoffs}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="p-4 bg-zinc-100 border-l-4 border-l-zinc-900 border border-zinc-300 rounded space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">Adopted Course of Action</span>
              <div className="text-sm font-bold font-sans text-zinc-950">
                {activeDecision.optionsConsidered.find((o) => o.id === activeDecision.selectedOption)?.title}
              </div>
            </div>
            <ConfidenceTag confidence={activeDecision.confidence} size="sm" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 block mb-1">Explicit Rationale:</span>
            <p className="text-xs text-zinc-900 font-sans leading-relaxed bg-white p-3 border border-zinc-200 rounded">{activeDecision.rationale}</p>
          </div>
        </section>

        {activeDecision.actionsDeliberatelyAvoided.length > 0 && (
          <section className="bg-rose-50/40 border border-rose-200 rounded p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-700" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-950">Actions Deliberately Avoided</h3>
            </div>
            <ul className="space-y-1.5">
              {activeDecision.actionsDeliberatelyAvoided.map((avoided, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs font-mono text-zinc-900 bg-white p-2 rounded border border-rose-200">
                  <span className="text-rose-700 font-bold">✕</span>
                  <span className="leading-snug">{avoided}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeDecision.risks.length > 0 && (
          <section className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 block">Anticipated Risks & Mitigation</span>
            <div className="border border-zinc-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-zinc-100 font-mono text-[11px] text-zinc-600 border-b border-zinc-200">
                  <tr>
                    <th className="p-2.5">Risk</th>
                    <th className="p-2.5 w-24">Severity</th>
                    <th className="p-2.5">Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {activeDecision.risks.map((risk, i) => (
                    <tr key={i}>
                      <td className="p-2.5 text-zinc-800">{risk.description}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${risk.severity === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                          {risk.severity}
                        </span>
                      </td>
                      <td className="p-2.5 text-zinc-700 font-mono text-[11px]">{risk.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {showClassAModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border-4 border-zinc-950 rounded shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 text-zinc-950">
            <div className="flex items-start gap-3 border-b-2 border-zinc-950 pb-3">
              <div className="p-2 bg-zinc-950 text-white rounded">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono text-xs font-black uppercase tracking-widest bg-zinc-950 text-white px-2 py-0.5 rounded">
                  CLASS A SOLEMN GOVERNANCE GATING
                </span>
                <h3 className="text-sm font-bold font-sans text-zinc-900 mt-1">Founder Sole Sign-Off Verification: {activeDecision.code}</h3>
              </div>
            </div>

            {classAError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-mono rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{classAError}</span>
              </div>
            )}

            <div className="space-y-2 text-xs font-sans text-zinc-800 leading-relaxed bg-zinc-100 p-3 rounded border border-zinc-300">
              <p className="font-semibold text-zinc-950">You are authorizing a Class A high-risk operational marketing decision.</p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-700">
                <li>Secondary users cannot sign this record.</li>
                <li>All avoided actions recorded here become binding operational constraints.</li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 p-3 border border-zinc-300 rounded bg-zinc-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={acknowledgedRisks}
                onChange={(e) => setAcknowledgedRisks(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-400 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
              />
              <span className="font-sans text-zinc-900">
                I have reviewed all {activeDecision.risks.length} stated risks and the avoided actions, and verify this conforms to IMI Phase 1 policy.
              </span>
            </label>

            <div>
              <label htmlFor="confirm-class-a-input" className="block text-[11px] font-mono font-bold uppercase text-zinc-900 mb-1">
                Type "CONFIRM CLASS A" to authorize execution:
              </label>
              <input
                id="confirm-class-a-input"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="CONFIRM CLASS A"
                className="w-full p-2.5 text-xs font-mono tracking-widest font-bold border-2 border-zinc-900 rounded bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t-2 border-zinc-950">
              <button type="button" onClick={() => setShowClassAModal(false)} className="px-3 py-2 text-xs font-mono border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100">
                Cancel / Return
              </button>
              <button
                type="button"
                onClick={handleExecuteClassAApproval}
                className="px-5 py-2 text-xs font-mono font-black uppercase tracking-wider rounded bg-zinc-950 text-white hover:bg-zinc-800 shadow-md transition-colors"
              >
                Authorize & Lock Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {showStandardModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="border-b border-zinc-200 pb-2">
              <span className="font-mono text-xs font-bold text-zinc-900 uppercase">Confirm Class {activeDecision.approvalClass} Sign-off</span>
            </div>
            <p className="text-xs text-zinc-700 font-sans leading-relaxed">
              Confirm approval as <strong>{currentUserRole === 'owner_admin' ? 'Founder / Admin' : 'Research Editor'}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <button onClick={() => setShowStandardModal(false)} className="px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded text-zinc-700">
                Cancel
              </button>
              <button onClick={handleExecuteStandardApproval} className="px-4 py-1.5 text-xs font-mono font-bold uppercase rounded bg-zinc-900 text-white">
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {createModal}
    </div>
  );
};
