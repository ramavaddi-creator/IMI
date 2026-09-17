import { useState, useEffect } from 'react';
import type {
  ActiveScreen,
  UserRole,
  InboxItem,
  IntelligenceRecord,
  DecisionItem,
  OutcomeItem,
  SearchQueryResult,
} from './types';
import { formatRecordCode } from './types';
import {
  INITIAL_INBOX_ITEMS,
  INITIAL_INTELLIGENCE_RECORDS,
  INITIAL_DECISIONS,
  INITIAL_OUTCOMES,
  INITIAL_SEARCH_RESULTS,
} from './mockData';
import { Header } from './components/layout/Header';
import { HelpGuide } from './components/common/HelpGuide';
import { HomeTodayScreen } from './components/screens/HomeTodayScreen';
import { InboxScreen } from './components/screens/InboxScreen';
import { RecordWorkspaceScreen } from './components/screens/RecordWorkspaceScreen';
import { DecisionReviewScreen } from './components/screens/DecisionReviewScreen';
import { OutcomeReviewScreen } from './components/screens/OutcomeReviewScreen';
import { AskSystemScreen } from './components/screens/AskSystemScreen';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home_today');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('owner_admin');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const [inboxItems, setInboxItems] = useState<InboxItem[]>(INITIAL_INBOX_ITEMS);
  const [records, setRecords] = useState<IntelligenceRecord[]>(INITIAL_INTELLIGENCE_RECORDS);
  const [activeRecordId, setActiveRecordId] = useState<string>(INITIAL_INTELLIGENCE_RECORDS[0]?.id || '');
  const [decisions, setDecisions] = useState<DecisionItem[]>(INITIAL_DECISIONS);
  const [outcomes] = useState<OutcomeItem[]>(INITIAL_OUTCOMES);
  const [searchResults] = useState<SearchQueryResult[]>(INITIAL_SEARCH_RESULTS);

  // CHANGE: Wave 0 backend wiring. Real persistence for Inbox items via the
  // local D1-backed Worker, replacing the in-memory mock array. Falls back
  // to the existing mock/local-only behavior if the backend is unreachable,
  // so the app never hard-fails just because wrangler dev isn't running.
  const API_BASE = 'http://localhost:8787';

  useEffect(() => {
    fetch(`${API_BASE}/api/inbox`)
      .then((r) => r.json())
      .then((items: InboxItem[]) => setInboxItems(items))
      .catch((err) => {
        console.error('Could not reach the IMI backend, staying on local mock data.', err);
      });
  }, []);

  const pendingInboxCount = inboxItems.filter((i) => i.status === 'pending').length;
  const underReviewRecordsCount = records.filter((r) => r.status === 'under_review' || r.status === 'draft').length;
  const pendingDecisionsCount = decisions.filter((d) => d.approvalStatus === 'pending').length;
  const actionsAwaitingOutcomesCount = decisions.filter((d) => d.approvalStatus === 'approved').length;
  const lessonsDueCount = outcomes.filter(
    (o) => o.resultingLearning.learningStrength === 'provisional' || o.resultingLearning.learningStrength === 'repeated'
  ).length;

  const handleTriageAction = (itemId: string, action: 'ignore' | 'archive' | 'verify' | 'promote') => {
    const statusMap: Record<'ignore' | 'archive' | 'verify' | 'promote', string> = {
      ignore: 'ignored',
      archive: 'archived',
      verify: 'verified',
      promote: 'promoted',
    };
    fetch(`${API_BASE}/api/inbox/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusMap[action] }),
    }).catch((err) => console.error('Could not persist this triage action to the backend.', err));

    if (action === 'promote') {
      const itemToPromote = inboxItems.find((i) => i.id === itemId);
      if (itemToPromote) {
        // CHANGE: proper INT-0001-style code via the shared helper, not an
        // ad hoc IMI-REC-2026-0XX string built from array length.
        const newRecord: IntelligenceRecord = {
          id: `rec-${Date.now()}`,
          code: formatRecordCode('INT', records.length + 1),
          domain: 'iddav-marketing-intelligence',
          recordType: 'observation',
          title: itemToPromote.summary,
          status: 'under_review',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          author: itemToPromote.submittedBy,
          authorRole: itemToPromote.submitterRole,
          observation: {
            rawStatement: itemToPromote.fullText || itemToPromote.summary,
            verifiedFacts: [
              itemToPromote.summary,
              `Source: ${itemToPromote.sourceReference || 'Direct triage queue entry'}`,
            ],
            dateRecorded: itemToPromote.date,
            origin: itemToPromote.origin,
            evidenceConfidence: itemToPromote.confidence || {
              level: 'Medium',
              reason: 'Promoted from inbox triage queue.',
            },
            retrospective: itemToPromote.retrospective,
          },
          interpretation: {
            coreHypothesis: 'Working operational hypothesis: requires analytical validation.',
            analyticalInference: 'Preliminary inference extracted from triage review. Hypotheses are isolated from empirical facts.',
            interpretationConfidence: {
              level: 'Medium',
              reason: 'Initial intake interpretation pending structured evaluation.',
            },
            retrospective: 'decision_time',
            alternativeInterpretations: [],
          },
          linkedEvidence: [],
          assumptions: [
            {
              id: `as-${Date.now()}`,
              text: 'Assumption that the observed pattern reflects genuine broader guest behaviour.',
              testedStatus: 'untested',
              impactSeverity: 'medium',
            },
          ],
          openQuestions: ['What additional empirical evidence is required before formulating a decision?'],
          learningStrength: 'provisional',
        };

        setRecords([newRecord, ...records]);
        setActiveRecordId(newRecord.id);

        setInboxItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, status: 'promoted' } : it)));
      }
      return;
    }

    setInboxItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        if (action === 'verify') return { ...it, status: 'verified' };
        if (action === 'archive') return { ...it, status: 'archived' };
        if (action === 'ignore') return { ...it, status: 'ignored' };
        return it;
      })
    );
  };

  const handleAddItemToInbox = (newItemData: Omit<InboxItem, 'id' | 'code' | 'domain'>) => {
    fetch(`${API_BASE}/api/inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemData),
    })
      .then((r) => r.json())
      .then((created: InboxItem) => {
        setInboxItems((prev) => [created, ...prev]);
      })
      .catch((err) => {
        console.error('Could not save to the backend, keeping this item local-only for now.', err);
        // CHANGE: INB-0001-style code via the shared helper -- same fallback
        // behavior as before the backend existed, so a stopped Worker never
        // blocks capture entirely.
        const newItem: InboxItem = {
          id: `inbox-${Date.now()}`,
          code: formatRecordCode('INB', inboxItems.length + 1),
          domain: 'iddav-marketing-intelligence',
          ...newItemData,
        };
        setInboxItems((prev) => [newItem, ...prev]);
      });
  };

  const handleApproveDecision = (decisionId: string, approverName: string) => {
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.id !== decisionId) return d;
        return {
          ...d,
          approvalStatus: 'approved',
          approvedBy: approverName,
          approvedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const handleUpdateRecord = (updatedRecord: IntelligenceRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans antialiased flex flex-col selection:bg-zinc-800 selection:text-white">
      <Header
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        currentUserRole={currentUserRole}
        onRoleChange={setCurrentUserRole}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        inboxPendingCount={pendingInboxCount}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {isMobilePreview ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 text-zinc-200 text-xs font-mono">
                <Smartphone className="w-3.5 h-3.5" />
                Mobile Viewport Simulation
              </span>
              <p className="text-[11px] text-zinc-500 font-sans mt-1">
                Testing mobile intake, observation capture, and Class A approval ergonomics.
              </p>
            </div>

            <div className="w-full max-w-sm bg-zinc-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-zinc-700">
              <div className="h-4 flex items-center justify-center mb-2">
                <div className="w-16 h-1 bg-zinc-700 rounded-full" />
              </div>
              <div className="bg-zinc-100 rounded-[1.75rem] overflow-hidden border border-zinc-300 max-h-[750px] overflow-y-auto p-3 space-y-4 text-xs">
                {activeScreen === 'home_today' && (
                  <HomeTodayScreen
                    counts={{
                      newEvidence: pendingInboxCount,
                      openInterpretations: underReviewRecordsCount,
                      decisionsAwaitingAction: pendingDecisionsCount,
                      actionsAwaitingOutcomes: actionsAwaitingOutcomesCount,
                      lessonsDueForReview: lessonsDueCount,
                    }}
                    onNavigate={setActiveScreen}
                    onAddItemToInbox={handleAddItemToInbox}
                    currentUserRole={currentUserRole}
                  />
                )}
                {activeScreen === 'inbox' && (
                  <InboxScreen
                    items={inboxItems}
                    onTriageAction={handleTriageAction}
                    onAddItem={handleAddItemToInbox}
                    onNavigate={setActiveScreen}
                    currentUserRole={currentUserRole}
                  />
                )}
                {activeScreen === 'record_workspace' && (
                  <RecordWorkspaceScreen
                    records={records}
                    activeRecordId={activeRecordId}
                    onSelectRecord={setActiveRecordId}
                    onNavigate={setActiveScreen}
                    currentUserRole={currentUserRole}
                    onUpdateRecord={handleUpdateRecord}
                  />
                )}
                {activeScreen === 'decision_review' && (
                  <DecisionReviewScreen
                    decisions={decisions}
                    onApproveDecision={handleApproveDecision}
                    currentUserRole={currentUserRole}
                    onNavigate={setActiveScreen}
                  />
                )}
                {activeScreen === 'outcome_review' && (
                  <OutcomeReviewScreen outcomes={outcomes} currentUserRole={currentUserRole} onNavigate={setActiveScreen} />
                )}
                {activeScreen === 'ask_system' && (
                  <AskSystemScreen searchResults={searchResults} onNavigate={setActiveScreen} currentUserRole={currentUserRole} />
                )}
              </div>
              <div className="h-4 flex items-center justify-center mt-2">
                <div className="w-24 h-1 bg-zinc-600 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {activeScreen === 'home_today' && (
              <HomeTodayScreen
                counts={{
                  newEvidence: pendingInboxCount,
                  openInterpretations: underReviewRecordsCount,
                  decisionsAwaitingAction: pendingDecisionsCount,
                  actionsAwaitingOutcomes: actionsAwaitingOutcomesCount,
                  lessonsDueForReview: lessonsDueCount,
                }}
                onNavigate={setActiveScreen}
                onAddItemToInbox={handleAddItemToInbox}
                currentUserRole={currentUserRole}
              />
            )}
            {activeScreen === 'inbox' && (
              <InboxScreen
                items={inboxItems}
                onTriageAction={handleTriageAction}
                onAddItem={handleAddItemToInbox}
                onNavigate={setActiveScreen}
                currentUserRole={currentUserRole}
              />
            )}
            {activeScreen === 'record_workspace' && (
              <RecordWorkspaceScreen
                records={records}
                activeRecordId={activeRecordId}
                onSelectRecord={setActiveRecordId}
                onNavigate={setActiveScreen}
                currentUserRole={currentUserRole}
                onUpdateRecord={handleUpdateRecord}
              />
            )}
            {activeScreen === 'decision_review' && (
              <DecisionReviewScreen
                decisions={decisions}
                onApproveDecision={handleApproveDecision}
                currentUserRole={currentUserRole}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 'outcome_review' && (
              <OutcomeReviewScreen outcomes={outcomes} currentUserRole={currentUserRole} onNavigate={setActiveScreen} />
            )}
            {activeScreen === 'ask_system' && (
              <AskSystemScreen searchResults={searchResults} onNavigate={setActiveScreen} currentUserRole={currentUserRole} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-300 bg-zinc-200/60 py-2.5 px-4 text-xs font-mono text-zinc-600 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>IMI Phase 1 Operational Workspace</span>
            <span>•</span>
            <span>Strict Fact vs Interpretation Isolation Enforced</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            Current Session: {currentUserRole === 'owner_admin' ? 'Owner / Admin' : 'Secondary Contributor'}
          </div>
        </div>
      </footer>

      <HelpGuide isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
