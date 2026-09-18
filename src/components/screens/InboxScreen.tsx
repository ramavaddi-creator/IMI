import React, { useState } from 'react';
import type { InboxItem, ItemType, EvidenceOrigin, ConfidenceLevel, RetrospectiveType, UserRole, ActiveScreen, MediaAttachment, SourceCategory, SourceType } from '../../types';
import { SOURCE_CATEGORY_LABELS, SOURCE_TYPE_LABELS, EVIDENCE_WEIGHT_LABELS, COMMERCIAL_RELEVANCE_LABELS, defaultEvidenceWeight } from '../../types';
import type { EvidenceWeight, CommercialRelevance } from '../../types';
import { MediaAttachmentPicker } from '../common/MediaAttachmentPicker';
import { SourceCategoryBadge } from '../common/SourceCategoryBadge';
import { SourceTypeBadge } from '../common/SourceTypeBadge';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { RetrospectiveMarker } from '../common/RetrospectiveMarker';
import { EvidenceBadge } from '../common/EvidenceBadge';
import { MissingConfidenceBanner } from '../common/MissingConfidenceBanner';
import { Plus, Check, Archive, Trash2, ArrowUpRight, Filter, Smartphone, AlertCircle, X, FileText } from 'lucide-react';

// CHANGE: transparent, rule-based priority score -- explicitly NOT AI. Every
// point is a visible, fixed rule so the ranking can be audited and disagreed
// with, rather than a black-box "AI recommends" claim IMI has no backend to back.
function computePriorityScore(item: InboxItem): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const highImpactCategories = ['L_iddav_evidence', 'M_enquiry_revenue', 'N_guest_experience', 'K_iddav_channels'];
  if (item.sourceCategory && highImpactCategories.includes(item.sourceCategory)) {
    score += 30;
    reasons.push('+30 first-party business-impact source category');
  }

  const typeScores: Record<string, number> = {
    PRIMARY_EVIDENCE: 25,
    FIRST_PARTY_COMMERCIAL: 25,
    FIRST_PARTY_AUDIENCE: 15,
    MARKET: 12,
    OFFICIAL: 10,
    SCIENTIFIC: 8,
    MEDIA: 5,
    SOCIAL: 3,
  };
  if (item.sourceType && typeScores[item.sourceType]) {
    score += typeScores[item.sourceType];
    reasons.push(`+${typeScores[item.sourceType]} evidentiary weight (${item.sourceType})`);
  }

  if (item.attachments && item.attachments.some((a) => a.kind === 'image' || a.kind === 'video')) {
    score += 20;
    reasons.push('+20 has a photo or video attached (postable)');
  }

  if (item.confidence?.level === 'High') {
    score += 15;
    reasons.push('+15 high confidence');
  } else if (item.confidence?.level === 'Medium') {
    score += 5;
    reasons.push('+5 medium confidence');
  }

  if (item.type === 'outcome') {
    score += 10;
    reasons.push('+10 outcome type (proof point)');
  }

  return { score, reasons };
}

interface InboxScreenProps {
  items: InboxItem[];
  onTriageAction: (itemId: string, action: 'ignore' | 'archive' | 'verify' | 'dispute' | 'promote') => void;
  onAddItem: (item: Omit<InboxItem, 'id' | 'code' | 'domain'>) => void;
  onNavigate: (screen: ActiveScreen) => void;
  currentUserRole: UserRole;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({ items, onTriageAction, onAddItem, onNavigate, currentUserRole }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'verified' | 'promoted'>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<InboxItem | null>(null);

  const [newItemType, setNewItemType] = useState<ItemType>('observation');
  const [newSummary, setNewSummary] = useState('');
  const [newFullText, setNewFullText] = useState('');
  const [newOrigin, setNewOrigin] = useState<EvidenceOrigin>('original');
  const [newConfidenceLevel, setNewConfidenceLevel] = useState<ConfidenceLevel>('High');
  const [newConfidenceReason, setNewConfidenceReason] = useState('');
  const [newRetrospective] = useState<RetrospectiveType>('decision_time');
  const [formError, setFormError] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [newSourceCategory, setNewSourceCategory] = useState<SourceCategory | ''>('');
  const [newSourceType, setNewSourceType] = useState<SourceType | ''>('');
  const [newEvidenceWeight, setNewEvidenceWeight] = useState<string>('');
  const [newCommercialRelevance, setNewCommercialRelevance] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState('');
  const [sortByPriority, setSortByPriority] = useState(false);

  const itemsWithMissingConfidence = items.filter(
    (i) => !i.confidence || !i.confidence.level || !i.confidence.reason || i.confidence.reason.trim() === ''
  );

  const filteredItems = items
    .filter((item) => {
      // CHANGE: 'verified' now reads verificationStatus, since status no
      // longer carries that meaning after the workflow/verification split.
      if (selectedFilter === 'verified') {
        if (item.verificationStatus !== 'verified') return false;
      } else if (selectedFilter !== 'all' && item.status !== selectedFilter) {
        return false;
      }
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => (sortByPriority ? computePriorityScore(b).score - computePriorityScore(a).score : 0));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) {
      setFormError('Summary line is required.');
      return;
    }
    if (!newConfidenceReason.trim()) {
      setFormError('Mandatory rule: every confidence level must include a stated reason.');
      return;
    }

    onAddItem({
      type: newItemType,
      date: new Date().toISOString().split('T')[0],
      summary: newSummary.trim(),
      origin: newOrigin,
      submittedBy:
        currentUserRole === 'owner_admin' ? 'Founder / Admin' : currentUserRole === 'research_editor' ? 'Research Editor' : 'Field Contributor',
      submitterRole: currentUserRole,
      confidence: { level: newConfidenceLevel, reason: newConfidenceReason.trim() },
      retrospective: newRetrospective,
      status: 'pending',
      fullText: newFullText.trim() || newSummary.trim(),
      sourceReference: 'Direct Mobile / Desk Submission',
      attachments,
      ...(newSourceCategory ? { sourceCategory: newSourceCategory } : {}),
      ...(newSourceType ? { sourceType: newSourceType } : {}),
      ...(newEvidenceWeight ? { evidenceWeight: newEvidenceWeight as EvidenceWeight } : {}),
      ...(newCommercialRelevance ? { commercialRelevance: newCommercialRelevance as CommercialRelevance } : {}),
    });

    setNewSummary('');
    setNewFullText('');
    setNewConfidenceReason('');
    setFormError('');
    setAttachments([]);
    setNewSourceCategory('');
    setNewSourceType('');
    setNewEvidenceWeight('');
    setNewCommercialRelevance('');
    setIsQuickCaptureOpen(false);
  };

  // CHANGE: no reliable prefill-and-submit URL exists for either ChatGPT or
  // Claude, so the honest, always-working version copies the full item to the
  // clipboard and opens a fresh tab -- one paste, not a flaky URL trick.
  const sendToAssistant = (item: InboxItem, target: 'chatgpt' | 'claude') => {
    const blob = [
      `IMI Item ${item.code} (${item.type})`,
      `Summary: ${item.summary}`,
      item.fullText && item.fullText !== item.summary ? `Details: ${item.fullText}` : '',
      item.sourceCategory ? `Source Category: ${SOURCE_CATEGORY_LABELS[item.sourceCategory]}` : '',
      item.sourceType ? `Evidentiary Weight: ${SOURCE_TYPE_LABELS[item.sourceType]}` : '',
      item.confidence ? `Confidence: ${item.confidence.level} — ${item.confidence.reason}` : '',
      item.sourceReference ? `Source Reference: ${item.sourceReference}` : '',
      '',
      'Please draft an Iddav WildStay poster headline and caption from this.',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(blob).then(() => {
      setCopyStatus(`Copied ${item.code} — paste into the new tab (⌘V).`);
      setTimeout(() => setCopyStatus(''), 4000);
    }).catch(() => {
      setCopyStatus('Could not copy automatically — open Inspect Source and copy manually.');
    });

    window.open(target === 'chatgpt' ? 'https://chatgpt.com/' : 'https://claude.ai/new', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      <MissingConfidenceBanner
        missingCount={itemsWithMissingConfidence.length}
        message={`${itemsWithMissingConfidence.length} item(s) in this inbox triage queue have missing or blank confidence rationale reasons. Protocol requires completing this before promoting to record.`}
        onFixClick={() => {
          const target = itemsWithMissingConfidence[0];
          if (target) setInspectingItem(target);
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-zinc-900 font-sans">Inbox & Triage Queue</h1>
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-zinc-100 text-zinc-700 border border-zinc-300">
              {filteredItems.length} items
            </span>
          </div>
          <p className="text-xs text-zinc-600 font-sans">Review, verify, and promote observations and evidence into Intelligence records.</p>
        </div>

        <button
          onClick={() => setIsQuickCaptureOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Capture Observation / Evidence</span>
        </button>
      </div>

      {copyStatus && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono">{copyStatus}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-zinc-500 mr-1" />
          <span className="text-zinc-500 uppercase text-[11px]">Status:</span>
          {(['pending', 'verified', 'promoted', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedFilter(st)}
              className={`px-2.5 py-1 rounded transition-colors uppercase text-[11px] ${
                selectedFilter === st ? 'bg-zinc-900 text-white font-bold' : 'bg-white text-zinc-600 border border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="type-filter-select" className="text-zinc-500 uppercase text-[11px]">
            Type:
          </label>
          <select
            id="type-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-800"
          >
            <option value="all">All Types</option>
            <option value="observation">Observation</option>
            <option value="evidence">Evidence</option>
            <option value="question">Question</option>
            <option value="outcome">Outcome</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setSortByPriority((s) => !s)}
          className={`px-2.5 py-1 rounded transition-colors uppercase text-[11px] border ${
            sortByPriority ? 'bg-zinc-900 text-white font-bold border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-100'
          }`}
          title="Rule-based score, not AI — see breakdown on each item"
        >
          Sort: {sortByPriority ? 'Priority' : 'Default'}
        </button>
      </div>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-300 rounded bg-white">
            <p className="text-sm font-mono text-zinc-500">No items match the selected filter criteria.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const hasMissingReason = !item.confidence || !item.confidence.reason || item.confidence.reason.trim() === '';

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded border transition-all bg-white shadow-xs ${
                  hasMissingReason ? 'border-amber-400 ring-1 ring-amber-300' : item.verificationStatus === 'verified' ? 'border-emerald-300' : 'border-zinc-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-zinc-900">{item.code}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {item.type}
                    </span>
                    <EvidenceBadge origin={item.origin} />
                    <RetrospectiveMarker type={item.retrospective} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span className="text-zinc-600 font-sans">{item.submittedBy}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-zinc-900 font-sans leading-snug">{item.summary}</p>
                  {item.fullText && item.fullText !== item.summary && (
                    <p className="text-xs text-zinc-600 font-sans mt-1 line-clamp-2">{item.fullText}</p>
                  )}
                </div>

                {item.attachments && item.attachments.length > 0 && (
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    {item.attachments.map((att) => (
                      <div key={att.id} className="relative w-14 h-14 rounded overflow-hidden border border-zinc-300 shrink-0 bg-zinc-50">
                        {att.kind === 'image' && <img src={att.url} alt={att.name} className="w-full h-full object-cover" />}
                        {att.kind === 'video' && <video src={att.url} className="w-full h-full object-cover" muted />}
                        {att.kind === 'document' && (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1">
                            <FileText className="w-5 h-5 text-zinc-500" />
                            <span className="text-[7px] font-mono text-zinc-500 text-center leading-tight line-clamp-2 px-0.5">
                              {att.name}
                            </span>
                          </div>
                        )}
                        {att.origin === 'ai_generated' && (
                          <span className="absolute bottom-0 left-0 right-0 bg-amber-600 text-white text-[8px] font-mono font-bold text-center leading-tight">
                            AI
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(item.sourceCategory || item.sourceType || item.evidenceWeight || item.commercialRelevance) && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {item.sourceCategory && <SourceCategoryBadge category={item.sourceCategory} size="sm" />}
                    {item.sourceType && <SourceTypeBadge sourceType={item.sourceType} size="sm" />}
                    {item.evidenceWeight && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                        Weight: {EVIDENCE_WEIGHT_LABELS[item.evidenceWeight]}
                      </span>
                    )}
                    {item.commercialRelevance && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Relevance: {COMMERCIAL_RELEVANCE_LABELS[item.commercialRelevance]}
                      </span>
                    )}
                  </div>
                )}

                {(() => {
                  const { score, reasons } = computePriorityScore(item);
                  return (
                    <div className="mb-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded border border-violet-300 bg-violet-50 text-violet-800"
                        title={`Rule-based, not AI:\n${reasons.join('\n') || 'No scoring rules matched'}`}
                      >
                        Priority {score} (rule-based)
                      </span>
                    </div>
                  );
                })()}

                <div className="mb-3 bg-zinc-50 p-2.5 rounded border border-zinc-200">
                  <ConfidenceTag confidence={item.confidence} size="sm" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setInspectingItem(item)}
                      className="px-2.5 py-1 text-xs font-mono text-zinc-700 hover:text-zinc-950 border border-zinc-300 rounded hover:bg-zinc-100"
                    >
                      Inspect Source
                    </button>
                    <button
                      onClick={() => sendToAssistant(item, 'chatgpt')}
                      className="px-2.5 py-1 text-xs font-mono text-zinc-700 hover:text-zinc-950 border border-zinc-300 rounded hover:bg-zinc-100"
                      title="Copies this item's full context, then opens ChatGPT in a new tab"
                    >
                      Send to ChatGPT
                    </button>
                    <button
                      onClick={() => sendToAssistant(item, 'claude')}
                      className="px-2.5 py-1 text-xs font-mono text-zinc-700 hover:text-zinc-950 border border-zinc-300 rounded hover:bg-zinc-100"
                      title="Copies this item's full context, then opens Claude in a new tab"
                    >
                      Send to Claude
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => onTriageAction(item.id, 'ignore')}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-100 border border-transparent hover:border-zinc-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ignore</span>
                    </button>
                    <button
                      onClick={() => onTriageAction(item.id, 'archive')}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-100 border border-transparent hover:border-zinc-300"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                    <button
                      onClick={() => onTriageAction(item.id, 'verify')}
                      disabled={item.verificationStatus === 'verified'}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors ${
                        item.verificationStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 opacity-80 cursor-default'
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{item.verificationStatus === 'verified' ? 'Verified' : 'Verify Fact'}</span>
                    </button>
                    <button
                      onClick={() => onTriageAction(item.id, 'dispute')}
                      disabled={item.verificationStatus === 'disputed'}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors ${
                        item.verificationStatus === 'disputed'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 opacity-80 cursor-default'
                          : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                      }`}
                      title="Contradicted by other evidence -- different from simply unverified"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{item.verificationStatus === 'disputed' ? 'Disputed' : 'Mark Disputed'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onTriageAction(item.id, 'promote');
                        onNavigate('record_workspace');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      <span>Promote to Record</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isQuickCaptureOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-zinc-600" />
                <h3 className="text-sm font-bold font-mono uppercase text-zinc-900">Quick Capture (Field & Desk)</h3>
              </div>
              <button onClick={() => setIsQuickCaptureOpen(false)} className="p-1 rounded text-zinc-400 hover:text-zinc-700" aria-label="Close capture modal">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="capture-item-type" className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                    Type *
                  </label>
                  <select
                    id="capture-item-type"
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as ItemType)}
                    className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                  >
                    <option value="observation">Observation</option>
                    <option value="evidence">Evidence</option>
                    <option value="question">Question</option>
                    <option value="outcome">Outcome</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="capture-origin-select" className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                    Origin *
                  </label>
                  <select
                    id="capture-origin-select"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value as EvidenceOrigin)}
                    className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                  >
                    <option value="original">Original Internal</option>
                    <option value="primary_external">Primary External</option>
                    <option value="secondary_external">Secondary External</option>
                    <option value="synthetic">Synthetic</option>
                    <option value="anecdotal">Anecdotal</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="capture-summary-input" className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                  One-Line Summary *
                </label>
                <input
                  id="capture-summary-input"
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Concise factual description of what was observed..."
                  className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="capture-details-input" className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                  Supporting Details / Quote / Context
                </label>
                <textarea
                  id="capture-details-input"
                  rows={3}
                  value={newFullText}
                  onChange={(e) => setNewFullText(e.target.value)}
                  placeholder="Exact quote, guest statement, or observation ledger entry..."
                  className="w-full p-2 text-xs font-sans border border-zinc-300 rounded text-zinc-900"
                />
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-300 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-zinc-700">Mandatory Governance: Confidence Grounding</span>
                  <span className="text-[10px] font-mono text-zinc-500">No bare tags permitted</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <select
                      value={newConfidenceLevel}
                      onChange={(e) => setNewConfidenceLevel(e.target.value as ConfidenceLevel)}
                      className="w-full p-1.5 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={newConfidenceReason}
                      onChange={(e) => setNewConfidenceReason(e.target.value)}
                      placeholder="Stated reason..."
                      className="w-full p-1.5 text-xs font-sans bg-white border border-zinc-300 rounded text-zinc-900"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                  Source Category (optional — which layer this came from)
                </label>
                <select
                  value={newSourceCategory}
                  onChange={(e) => setNewSourceCategory(e.target.value as SourceCategory | '')}
                  className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                >
                  <option value="">Unspecified</option>
                  {Object.entries(SOURCE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {newSourceCategory && <div className="mt-1.5"><SourceCategoryBadge category={newSourceCategory} size="sm" /></div>}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                  Evidentiary Weight (optional — how much to trust this, independent of domain)
                </label>
                <select
                  value={newSourceType}
                  onChange={(e) => {
                    const val = e.target.value as SourceType | '';
                    setNewSourceType(val);
                    setNewEvidenceWeight(defaultEvidenceWeight(val || undefined) || '');
                  }}
                  className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                >
                  <option value="">Unspecified</option>
                  {Object.entries(SOURCE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {newSourceType && <div className="mt-1.5"><SourceTypeBadge sourceType={newSourceType} size="sm" /></div>}
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                  Evidence Weight (how much to trust THIS record specifically)
                </label>
                <select
                  value={newEvidenceWeight}
                  onChange={(e) => setNewEvidenceWeight(e.target.value)}
                  className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                >
                  <option value="">Unspecified</option>
                  {Object.entries(EVIDENCE_WEIGHT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                  Commercial Relevance (how much this matters to a business decision)
                </label>
                <select
                  value={newCommercialRelevance}
                  onChange={(e) => setNewCommercialRelevance(e.target.value)}
                  className="w-full p-2 text-xs font-mono bg-white border border-zinc-300 rounded text-zinc-900"
                >
                  <option value="">Unspecified</option>
                  {Object.entries(COMMERCIAL_RELEVANCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <MediaAttachmentPicker attachments={attachments} onChange={setAttachments} />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsQuickCaptureOpen(false)}
                  className="px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded bg-zinc-900 text-white hover:bg-zinc-800">
                  Save to Triage Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="font-mono text-xs font-bold text-zinc-900">Source Audit: {inspectingItem.code}</span>
              <button onClick={() => setInspectingItem(null)} className="p-1 text-zinc-400 hover:text-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono uppercase text-zinc-500">Origin:</span>
                <EvidenceBadge origin={inspectingItem.origin} />
                <RetrospectiveMarker type={inspectingItem.retrospective} />
              </div>
              <div>
                <span className="font-mono uppercase text-zinc-500 block mb-1">Full Statement:</span>
                <p className="p-2.5 bg-zinc-50 border border-zinc-200 rounded font-sans text-zinc-800 leading-relaxed">{inspectingItem.fullText}</p>
              </div>
              <div>
                <span className="font-mono uppercase text-zinc-500 block mb-1">Source Reference:</span>
                <span className="font-mono text-zinc-700 bg-zinc-100 px-2 py-1 rounded border border-zinc-200 block">
                  {inspectingItem.sourceReference || 'Direct field log'}
                </span>
              </div>
              <div>
                <span className="font-mono uppercase text-zinc-500 block mb-1">Confidence Audit:</span>
                <ConfidenceTag confidence={inspectingItem.confidence} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <button onClick={() => setInspectingItem(null)} className="px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded text-zinc-800 hover:bg-zinc-100">
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
