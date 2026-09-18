import React, { useState } from 'react';
import type { IntelligenceRecord, AlternativeInterpretation, UserRole, ActiveScreen } from '../../types';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { RetrospectiveMarker } from '../common/RetrospectiveMarker';
import { EvidenceBadge } from '../common/EvidenceBadge';
import { LearningProgression } from '../common/LearningProgression';
import { MissingConfidenceBanner } from '../common/MissingConfidenceBanner';
import { GitFork, Link2, HelpCircle, AlertOctagon, ArrowRight, Plus, CheckCircle2, ChevronDown } from 'lucide-react';

interface RecordWorkspaceScreenProps {
  records: IntelligenceRecord[];
  activeRecordId: string;
  onSelectRecord: (recordId: string) => void;
  onNavigate: (screen: ActiveScreen) => void;
  currentUserRole: UserRole;
  onUpdateRecord: (updated: IntelligenceRecord) => void;
}

export const RecordWorkspaceScreen: React.FC<RecordWorkspaceScreenProps> = ({
  records,
  activeRecordId,
  onSelectRecord,
  onNavigate,
  currentUserRole,
  onUpdateRecord,
}) => {
  const currentRecord = records.find((r) => r.id === activeRecordId) || records[0];

  const [showAddAltModal, setShowAddAltModal] = useState(false);
  const [newAltTitle, setNewAltTitle] = useState('');
  const [newAltRationale, setNewAltRationale] = useState('');
  const [newAltConfidenceReason, setNewAltConfidenceReason] = useState('');

  if (!currentRecord) {
    return <div className="p-8 text-center text-zinc-500 font-mono text-sm">No Intelligence records exist yet.</div>;
  }

  // CHANGE: interpretation is now optional (FR-INT-001 -- a 'question' or
  // early 'pattern' record type may not have a settled interpretation).
  // Guard every read of it instead of assuming it always exists.
  const hasInterpretation = !!currentRecord.interpretation;

  const isObservationConfidenceMissing =
    !currentRecord.observation.evidenceConfidence?.reason || currentRecord.observation.evidenceConfidence.reason.trim() === '';

  const isInterpretationConfidenceMissing =
    hasInterpretation &&
    (!currentRecord.interpretation!.interpretationConfidence?.reason || currentRecord.interpretation!.interpretationConfidence.reason.trim() === '');

  const totalMissing = (isObservationConfidenceMissing ? 1 : 0) + (isInterpretationConfidenceMissing ? 1 : 0);

  const handleAddAlternativeInterpretation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAltTitle.trim() || !newAltConfidenceReason.trim() || !hasInterpretation) return;

    const newAlt: AlternativeInterpretation = {
      id: `alt-${Date.now()}`,
      title: newAltTitle.trim(),
      proponentRole: currentUserRole === 'owner_admin' ? 'Founder / Admin' : 'Research Contributor',
      rationale: newAltRationale.trim() || 'Alternative operational hypothesis for scrutiny.',
      confidence: { level: 'Medium', reason: newAltConfidenceReason.trim() },
    };

    const updated: IntelligenceRecord = {
      ...currentRecord,
      interpretation: {
        ...currentRecord.interpretation!,
        alternativeInterpretations: [...currentRecord.interpretation!.alternativeInterpretations, newAlt],
      },
    };

    onUpdateRecord(updated);
    setNewAltTitle('');
    setNewAltRationale('');
    setNewAltConfidenceReason('');
    setShowAddAltModal(false);
  };

  return (
    <div className="space-y-5">
      <MissingConfidenceBanner
        missingCount={totalMissing}
        message="This Intelligence record has ungrounded confidence tags. Every zone that is present requires a verified stated reason."
      />

      <div className="bg-white border border-zinc-300 rounded p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">{currentRecord.code}</span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold uppercase rounded bg-zinc-800 text-white">
                Status: {currentRecord.status.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-zinc-200 text-zinc-700 border border-zinc-300">
                {currentRecord.recordType}
              </span>
              {currentRecord.verificationStatus && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${
                    currentRecord.verificationStatus === 'verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : currentRecord.verificationStatus === 'disputed'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                  }`}
                >
                  {currentRecord.verificationStatus}
                </span>
              )}
              <RetrospectiveMarker type={currentRecord.observation.retrospective} showDetails />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-zinc-950 font-sans leading-snug">{currentRecord.title}</h1>
            {currentRecord.verificationFlag && (
              <p className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1 mt-1 inline-block">
                {currentRecord.verificationFlag}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="record-selector-dropdown" className="text-xs font-mono text-zinc-500 uppercase">
              Select Record:
            </label>
            <div className="relative">
              <select
                id="record-selector-dropdown"
                value={currentRecord.id}
                onChange={(e) => onSelectRecord(e.target.value)}
                className="text-xs font-mono px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-zinc-900 focus:ring-1 focus:ring-zinc-800 pr-7 cursor-pointer"
              >
                {records.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.code} - {rec.title.slice(0, 38)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-2.5 pointer-events-none" />
            </div>
            <button
              onClick={() => onUpdateRecord({ ...currentRecord, verificationStatus: 'verified' })}
              disabled={currentRecord.verificationStatus === 'verified'}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-medium rounded border transition-colors ${
                currentRecord.verificationStatus === 'verified'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 opacity-80 cursor-default'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{currentRecord.verificationStatus === 'verified' ? 'Verified' : 'Verify Fact'}</span>
            </button>
            <button
              onClick={() => onUpdateRecord({ ...currentRecord, verificationStatus: 'disputed' })}
              disabled={currentRecord.verificationStatus === 'disputed'}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-medium rounded border transition-colors ${
                currentRecord.verificationStatus === 'disputed'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 opacity-80 cursor-default'
                  : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{currentRecord.verificationStatus === 'disputed' ? 'Disputed' : 'Mark Disputed'}</span>
            </button>
            <button
              onClick={() => onNavigate('decision_review')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs ml-1"
            >
              <span>Review Decisions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-600">
          <div className="flex items-center gap-3">
            <span>
              Author: <strong className="text-zinc-900">{currentRecord.author}</strong>
            </span>
            <span>•</span>
            <span>Recorded: {currentRecord.createdAt}</span>
          </div>
          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            <LearningProgression strength={currentRecord.learningStrength} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded border-2 border-emerald-700 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-950">
                  Zone 1: Verified Observation (Empirical Facts Only)
                </h2>
              </div>
              <EvidenceBadge origin={currentRecord.observation.origin} />
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-semibold block mb-1">Raw Statement:</span>
              <p className="text-sm font-medium text-emerald-950 font-sans leading-relaxed">"{currentRecord.observation.rawStatement}"</p>
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-600 font-bold block mb-2">Verified Data Points:</span>
              <ul className="space-y-1.5">
                {currentRecord.observation.verifiedFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-sans text-zinc-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200 bg-emerald-50/40 p-2.5 rounded">
            <span className="text-[11px] font-mono uppercase text-emerald-900 font-bold block mb-1">Evidence Confidence & Grounds:</span>
            <ConfidenceTag confidence={currentRecord.observation.evidenceConfidence} size="sm" />
          </div>
        </section>

        {hasInterpretation ? (
          <section className="rounded border-2 border-indigo-700 bg-indigo-50/30 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-950">Zone 2: Interpretation (Analytical Inference)</h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold uppercase">
                  Hypothesis — Not Fact
                </span>
              </div>

              <div className="p-3 bg-white border border-indigo-200 rounded">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-800 font-semibold block mb-1">Core Working Hypothesis:</span>
                <p className="text-sm font-medium text-indigo-950 font-sans leading-relaxed">{currentRecord.interpretation!.coreHypothesis}</p>
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-600 font-bold block mb-1">Analytical Inference:</span>
                <p className="text-xs font-sans text-zinc-800 leading-relaxed bg-white/80 p-2.5 border border-zinc-200 rounded">
                  {currentRecord.interpretation!.analyticalInference}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-200 bg-indigo-50/50 p-2.5 rounded">
              <span className="text-[11px] font-mono uppercase text-indigo-950 font-bold block mb-1">Interpretation Confidence & Reason:</span>
              <ConfidenceTag confidence={currentRecord.interpretation!.interpretationConfidence} size="sm" />
            </div>
          </section>
        ) : (
          <section className="rounded border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-2">
            <HelpCircle className="w-5 h-5 text-zinc-400" />
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">No interpretation recorded</p>
            <p className="text-[11px] text-zinc-500 font-sans max-w-xs">
              This is a "{currentRecord.recordType}" record. Not every record type requires a settled interpretation -- inventing one here would
              violate PR-02 (fact is not interpretation).
            </p>
          </section>
        )}
      </div>

      {hasInterpretation && (
        <section className="bg-white border border-zinc-300 rounded p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">Alternative Interpretations</h3>
            </div>
            <button
              onClick={() => setShowAddAltModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold text-zinc-700 hover:text-zinc-950 border border-zinc-300 rounded hover:bg-zinc-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Counter-Hypothesis</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentRecord.interpretation!.alternativeInterpretations.map((alt) => (
              <div key={alt.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-900">{alt.title}</span>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">{alt.proponentRole}</span>
                </div>
                <p className="text-xs text-zinc-700 font-sans leading-relaxed">{alt.rationale}</p>
                <div className="pt-1 border-t border-zinc-200">
                  <ConfidenceTag confidence={alt.confidence} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {currentRecord.linkedEvidence.length > 0 && (
        <section className="bg-white border border-zinc-300 rounded p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">Linked Evidence & Relational Alignment</h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">{currentRecord.linkedEvidence.length} Linked Artifacts</span>
          </div>

          <div className="space-y-3">
            {currentRecord.linkedEvidence.map((ev) => {
              const relConfig = {
                supports: { label: 'SUPPORTS', classes: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                contradicts: { label: 'CONTRADICTS', classes: 'bg-rose-50 text-rose-800 border-rose-300' },
                contextualizes: { label: 'CONTEXTUALIZES', classes: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
              }[ev.relation];

              return (
                <div key={ev.id} className="p-3.5 border border-zinc-200 rounded bg-zinc-50/50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${relConfig.classes}`}>{relConfig.label}</span>
                      <span className="font-mono text-xs font-bold text-zinc-900">{ev.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                      <EvidenceBadge origin={ev.origin} />
                      <RetrospectiveMarker type={ev.retrospective} />
                      <span>{ev.date}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-800 font-sans italic bg-white p-2 border border-zinc-200 rounded">"{ev.excerpt}"</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-mono text-zinc-600">Source: {ev.source}</span>
                    <ConfidenceTag confidence={ev.confidence} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentRecord.assumptions.length > 0 && (
          <section className="bg-white border border-zinc-300 rounded p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <AlertOctagon className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">Assumptions Under Audit</h3>
            </div>
            <div className="space-y-2">
              {currentRecord.assumptions.map((assump) => {
                const statusBadge = {
                  untested: 'bg-zinc-100 text-zinc-700 border-zinc-300',
                  partially_tested: 'bg-amber-50 text-amber-800 border-amber-300',
                  invalidated: 'bg-rose-50 text-rose-800 border-rose-300',
                  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                }[assump.testedStatus];

                return (
                  <div key={assump.id} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${statusBadge}`}>
                        {assump.testedStatus.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Impact: {assump.impactSeverity}</span>
                    </div>
                    <p className="text-xs text-zinc-800 font-sans leading-relaxed">{assump.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {currentRecord.openQuestions.length > 0 && (
          <section className="bg-white border border-zinc-300 rounded p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <HelpCircle className="w-4 h-4 text-zinc-700" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">Open Questions Awaiting Resolution</h3>
            </div>
            <div className="space-y-2">
              {currentRecord.openQuestions.map((q, i) => (
                <div key={i} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded text-xs font-sans text-zinc-800 flex items-start gap-2">
                  <span className="font-mono text-zinc-400 font-bold">0{i + 1}</span>
                  <p className="leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('ask_system')}
                className="w-full text-center py-1.5 px-3 border border-zinc-300 hover:bg-zinc-100 rounded text-xs font-mono text-zinc-700 transition-colors"
              >
                Search Past Precedents for These Questions →
              </button>
            </div>
          </section>
        )}
      </div>

      {showAddAltModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="border-b border-zinc-200 pb-2">
              <h3 className="font-mono text-xs font-bold uppercase text-zinc-900">Add Alternative Counter-Hypothesis</h3>
              <p className="text-xs text-zinc-500 font-sans">Challenge the core interpretation to prevent premature convergence.</p>
            </div>

            <form onSubmit={handleAddAlternativeInterpretation} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Title *</label>
                <input
                  type="text"
                  value={newAltTitle}
                  onChange={(e) => setNewAltTitle(e.target.value)}
                  className="w-full p-2 text-xs font-sans border border-zinc-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Rationale</label>
                <textarea
                  rows={3}
                  value={newAltRationale}
                  onChange={(e) => setNewAltRationale(e.target.value)}
                  className="w-full p-2 text-xs font-sans border border-zinc-300 rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">Mandatory Stated Reason for Confidence *</label>
                <input
                  type="text"
                  value={newAltConfidenceReason}
                  onChange={(e) => setNewAltConfidenceReason(e.target.value)}
                  className="w-full p-2 text-xs font-sans border border-zinc-300 rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button type="button" onClick={() => setShowAddAltModal(false)} className="px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded text-zinc-700">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs font-mono font-bold uppercase rounded bg-zinc-900 text-white">
                  Add Counter-Hypothesis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
