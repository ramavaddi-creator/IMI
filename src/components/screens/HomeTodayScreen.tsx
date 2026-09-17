import React, { useState, useEffect } from 'react';
import type { ItemType, ConfidenceLevel, EvidenceOrigin, RetrospectiveType, InboxItem, UserRole, ActiveScreen, MediaAttachment, SourceCategory, SourceType } from '../../types';
import { SOURCE_CATEGORY_LABELS, SOURCE_TYPE_LABELS } from '../../types';
import { MediaAttachmentPicker } from '../common/MediaAttachmentPicker';
import { SourceCategoryBadge } from '../common/SourceCategoryBadge';
import { SourceTypeBadge } from '../common/SourceTypeBadge';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { RetrospectiveMarker } from '../common/RetrospectiveMarker';
import { ArrowRight, Sparkles, Layers, TrendingUp, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

// CHANGE: neither Google (needs a paid, secured API key) nor most consumer
// websites (block cross-origin requests by default) can be pulled
// automatically from a browser with no backend. This is a reminder tracker,
// not a live feed -- it remembers when you last checked, via localStorage,
// which is the first thing in IMI that survives a page refresh.
const RECURRING_CHECK_KEY = 'imi_recurring_checks_v1';

type RecurringCheckState = {
  iddavwildstayUrl: string;
  googleProfileUrl: string;
  intervalDays: { website: number; google: number };
  lastChecked: { website: string | null; google: string | null };
};

function loadRecurringChecks(): RecurringCheckState {
  try {
    const raw = localStorage.getItem(RECURRING_CHECK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // localStorage unavailable or corrupted -- fall through to defaults
  }
  return {
    iddavwildstayUrl: 'https://iddavwildstay.com',
    googleProfileUrl: '',
    intervalDays: { website: 14, google: 28 },
    lastChecked: { website: null, google: null },
  };
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// CHANGE: eBird and NASA FIRMS both have real, free public APIs, but unlike
// GBIF/OpenAlex/Crossref they require a personal API key (free signup, not
// payment) -- stored locally, never sent anywhere but the API itself.
const API_KEYS_STORAGE = 'imi_api_keys_v1';

function loadApiKeys(): { ebird: string; firms: string } {
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to defaults
  }
  return { ebird: '', firms: '' };
}

interface HomeTodayScreenProps {
  counts: {
    newEvidence: number;
    openInterpretations: number;
    decisionsAwaitingAction: number;
    actionsAwaitingOutcomes: number;
    lessonsDueForReview: number;
  };
  onNavigate: (screen: ActiveScreen) => void;
  onAddItemToInbox: (item: Omit<InboxItem, 'id' | 'code' | 'domain'>) => void;
  currentUserRole: UserRole;
}

export const HomeTodayScreen: React.FC<HomeTodayScreenProps> = ({ counts, onNavigate, onAddItemToInbox, currentUserRole }) => {
  const [inputText, setInputText] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<{
    type: ItemType;
    confidenceLevel: ConfidenceLevel;
    confidenceReason: string;
    suggestedOrigin: EvidenceOrigin;
    extractedFacts: string[];
    potentialInterpretation: string;
  } | null>(null);

  const [editableType, setEditableType] = useState<ItemType>('observation');
  const [statedReason, setStatedReason] = useState('');
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel>('High');
  const [evidenceOrigin, setEvidenceOrigin] = useState<EvidenceOrigin>('original');
  const [retrospectiveType] = useState<RetrospectiveType>('decision_time');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [sourceCategory, setSourceCategory] = useState<SourceCategory | ''>('');
  const [sourceType, setSourceType] = useState<SourceType | ''>('');
  const [pullQuery, setPullQuery] = useState('Panthera tigris Tadoba');
  const [pullResults, setPullResults] = useState<{ id: string; summary: string; fullText: string; sourceUrl: string; dateStr: string; category: SourceCategory; sourceType: SourceType }[]>([]);
  const [pullLoading, setPullLoading] = useState<'' | 'gbif' | 'openalex' | 'crossref' | 'ebird' | 'firms' | 'inaturalist' | 'semanticscholar' | 'feed'>('');
  const [pullError, setPullError] = useState('');
  const [apiKeys, setApiKeys] = useState(() => loadApiKeys());

  const saveApiKeys = (next: { ebird: string; firms: string }) => {
    setApiKeys(next);
    try {
      localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(next));
    } catch {
      // best effort only
    }
  };

  // CHANGE: converted from five separate "click to pull" buttons into a
  // single auto-refreshing feed, per explicit direction. Five sources need
  // no key at all; eBird and NASA FIRMS need a personal key, so they're only
  // included once a key is actually saved. Everything else in the registry
  // stays manual by nature -- nothing here runs while the tab is closed.
  const fetchGbif = async (query: string) => {
    const res = await fetch(`https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(query)}&limit=6`);
    if (!res.ok) throw new Error(`GBIF returned ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: `gbif-${r.key}`,
      summary: `${r.scientificName || query} occurrence recorded ${r.eventDate ? String(r.eventDate).slice(0, 10) : 'date unknown'}${r.locality ? ' near ' + r.locality : r.country ? ' in ' + r.country : ''}.`,
      fullText: `GBIF occurrence record. Species: ${r.scientificName || 'unknown'}. Country: ${r.country || 'unknown'}. Locality: ${r.locality || 'not specified'}. Recorded by: ${r.recordedBy || 'unknown'}. Basis of record: ${r.basisOfRecord || 'unknown'}.`,
      sourceUrl: `https://www.gbif.org/occurrence/${r.key}`,
      dateStr: r.eventDate ? String(r.eventDate).slice(0, 10) : '',
      category: 'B_global_biodiversity' as SourceCategory,
      sourceType: 'SCIENTIFIC' as SourceType,
    }));
  };

  const fetchOpenAlex = async (query: string) => {
    const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=6`);
    if (!res.ok) throw new Error(`OpenAlex returned ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((w: any) => ({
      id: `openalex-${w.id}`,
      summary: w.title || 'Untitled research work',
      fullText: `${w.title || 'Untitled'} (${w.publication_year || 'year unknown'}). Authors: ${(w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean).join(', ') || 'unknown'}. Cited by: ${w.cited_by_count ?? 'unknown'}.`,
      sourceUrl: w.doi || w.id,
      dateStr: w.publication_year ? String(w.publication_year) : '',
      category: 'C_scientific_research' as SourceCategory,
      sourceType: 'SCIENTIFIC' as SourceType,
    }));
  };

  const fetchCrossref = async (query: string) => {
    const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=6`);
    if (!res.ok) throw new Error(`Crossref returned ${res.status}`);
    const data = await res.json();
    const items = data.message?.items || [];
    return items.map((w: any) => ({
      id: `crossref-${w.DOI}`,
      summary: (w.title && w.title[0]) || 'Untitled research work',
      fullText: `${(w.title && w.title[0]) || 'Untitled'}. Authors: ${(w.author || []).map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).join(', ') || 'unknown'}. Journal: ${(w['container-title'] && w['container-title'][0]) || 'unknown'}.`,
      sourceUrl: `https://doi.org/${w.DOI}`,
      dateStr: w.published?.['date-parts']?.[0]?.join('-') || '',
      category: 'C_scientific_research' as SourceCategory,
      sourceType: 'SCIENTIFIC' as SourceType,
    }));
  };

  // CHANGE: new -- confirmed keyless, open-CORS read-only API (verified 17 Sep 2026).
  const fetchInaturalist = async (query: string) => {
    const res = await fetch(`https://api.inaturalist.org/v1/observations?q=${encodeURIComponent(query)}&per_page=6&order=desc&order_by=observed_on`);
    if (!res.ok) throw new Error(`iNaturalist returned ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((o: any) => ({
      id: `inat-${o.id}`,
      summary: `${o.taxon?.preferred_common_name || o.taxon?.name || o.species_guess || 'Unidentified species'} observed ${o.observed_on || 'date unknown'}${o.place_guess ? ' near ' + o.place_guess : ''}.`,
      fullText: `iNaturalist observation. Species: ${o.taxon?.name || o.species_guess || 'unidentified'}. Common name: ${o.taxon?.preferred_common_name || 'unknown'}. Place: ${o.place_guess || 'unspecified'}. Quality grade: ${o.quality_grade || 'unknown'}.`,
      sourceUrl: o.uri || `https://www.inaturalist.org/observations/${o.id}`,
      dateStr: o.observed_on || '',
      category: 'B_global_biodiversity' as SourceCategory,
      sourceType: 'SCIENTIFIC' as SourceType,
    }));
  };

  // CHANGE: new -- confirmed keyless access, though on a more heavily
  // rate-limited shared pool than GBIF/OpenAlex/Crossref (verified 17 Sep 2026).
  const fetchSemanticScholar = async (query: string) => {
    const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=6&fields=title,year,authors,externalIds,citationCount`);
    if (!res.ok) throw new Error(`Semantic Scholar returned ${res.status}`);
    const data = await res.json();
    return (data.data || []).map((w: any) => ({
      id: `semscholar-${w.paperId}`,
      summary: w.title || 'Untitled research work',
      fullText: `${w.title || 'Untitled'} (${w.year || 'year unknown'}). Authors: ${(w.authors || []).map((a: any) => a.name).join(', ') || 'unknown'}. Cited by: ${w.citationCount ?? 'unknown'}.`,
      sourceUrl: w.externalIds?.DOI ? `https://doi.org/${w.externalIds.DOI}` : `https://www.semanticscholar.org/paper/${w.paperId}`,
      dateStr: w.year ? String(w.year) : '',
      category: 'C_scientific_research' as SourceCategory,
      sourceType: 'SCIENTIFIC' as SourceType,
    }));
  };

  const fetchEbird = async () => {
    const res = await fetch('https://api.ebird.org/v2/data/obs/geo/recent?lat=20.2167&lng=79.3667&dist=50', {
      headers: { 'X-eBirdApiToken': apiKeys.ebird.trim() },
    });
    if (!res.ok) throw new Error(`eBird returned ${res.status}`);
    const data = await res.json();
    return (data || []).slice(0, 6).map((o: any) => ({
      id: `ebird-${o.subId}-${o.speciesCode}`,
      summary: `${o.comName} observed ${o.obsDt} near ${o.locName || 'the Tadoba area'}${o.howMany ? ` (count: ${o.howMany})` : ''}.`,
      fullText: `eBird observation. Species: ${o.comName} (${o.sciName}). Location: ${o.locName || 'unnamed'}. Date: ${o.obsDt}. Count: ${o.howMany ?? 'not counted'}.`,
      sourceUrl: `https://ebird.org/species/${o.speciesCode}`,
      dateStr: o.obsDt || '',
      category: 'B_global_biodiversity' as SourceCategory,
      sourceType: 'SCIENTIFIC' as SourceType,
    }));
  };

  const fetchFirms = async () => {
    const bbox = '79.0,19.8,79.7,20.6';
    const res = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKeys.firms.trim()}/VIIRS_SNPP_NRT/${bbox}/1`);
    if (!res.ok) throw new Error(`NASA FIRMS returned ${res.status}`);
    const csvText = await res.text();
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const header = lines[0].split(',');
    const latIdx = header.indexOf('latitude');
    const lonIdx = header.indexOf('longitude');
    const dateIdx = header.indexOf('acq_date');
    const confIdx = header.indexOf('confidence');
    return lines.slice(1, 7).map((line, i) => {
      const cols = line.split(',');
      return {
        id: `firms-${i}-${cols[dateIdx]}`,
        summary: `Fire hotspot detected near Tadoba (${cols[latIdx]}, ${cols[lonIdx]}) on ${cols[dateIdx]}, confidence ${cols[confIdx] || 'unknown'}.`,
        fullText: `NASA FIRMS VIIRS fire detection. Coordinates: ${cols[latIdx]}, ${cols[lonIdx]}. Date: ${cols[dateIdx]}. Confidence: ${cols[confIdx] || 'unknown'}.`,
        sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/map/',
        dateStr: cols[dateIdx] || '',
        category: 'E_satellite_landscape' as SourceCategory,
        sourceType: 'OFFICIAL' as SourceType,
      };
    });
  };

  // CHANGE: single combined feed refresh. Runs on mount, when a Suggested
  // Topic is picked, on Enter in the search box, or via the manual Refresh
  // button -- never on a schedule, since nothing here can run while the tab
  // is closed. Each source's own error is isolated so one failing source
  // never blanks the rest of the feed.
  const refreshFeed = async (query: string) => {
    setPullLoading('feed');
    setPullError('');
    const errors: string[] = [];
    const tasks: Promise<any[]>[] = [
      fetchGbif(query).catch((e: any) => { errors.push(`GBIF: ${e.message}`); return []; }),
      fetchOpenAlex(query).catch((e: any) => { errors.push(`OpenAlex: ${e.message}`); return []; }),
      fetchCrossref(query).catch((e: any) => { errors.push(`Crossref: ${e.message}`); return []; }),
      fetchInaturalist(query).catch((e: any) => { errors.push(`iNaturalist: ${e.message}`); return []; }),
      fetchSemanticScholar(query).catch((e: any) => { errors.push(`Semantic Scholar: ${e.message}`); return []; }),
    ];
    if (apiKeys.ebird.trim()) tasks.push(fetchEbird().catch((e: any) => { errors.push(`eBird: ${e.message}`); return []; }));
    if (apiKeys.firms.trim()) tasks.push(fetchFirms().catch((e: any) => { errors.push(`NASA FIRMS: ${e.message}`); return []; }));

    const allResults = await Promise.all(tasks);
    const combined = allResults.flat();
    combined.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
    setPullResults(combined);
    if (errors.length > 0) setPullError(errors.join(' \u2014 '));
    setPullLoading('');
  };

  const addPulledToInbox = (candidate: { id: string; summary: string; fullText: string; sourceUrl: string; category: SourceCategory; sourceType: SourceType }) => {
    onAddItemToInbox({
      type: 'evidence',
      date: new Date().toISOString().split('T')[0],
      summary: candidate.summary,
      origin: 'secondary_external',
      submittedBy: currentUserRole === 'owner_admin' ? 'Founder / Admin' : 'Field Contributor',
      submitterRole: currentUserRole,
      confidence: { level: 'Medium', reason: 'Retrieved directly from a live API pull; relevance to Iddav WildStay not yet verified by a person.' },
      retrospective: 'decision_time',
      status: 'pending',
      fullText: candidate.fullText,
      sourceReference: candidate.sourceUrl,
      sourceCategory: candidate.category,
      sourceType: candidate.sourceType,
    });
    setPullResults((prev) => prev.filter((c) => c.id !== candidate.id));
  };

  useEffect(() => {
    refreshFeed(pullQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [recurringChecks, setRecurringChecks] = useState<RecurringCheckState>(() => loadRecurringChecks());

  const saveRecurringChecks = (next: RecurringCheckState) => {
    setRecurringChecks(next);
    try {
      localStorage.setItem(RECURRING_CHECK_KEY, JSON.stringify(next));
    } catch {
      // best effort only
    }
  };

  const markChecked = (key: 'website' | 'google') => {
    saveRecurringChecks({ ...recurringChecks, lastChecked: { ...recurringChecks.lastChecked, [key]: new Date().toISOString() } });
  };

  const setCheckIntervalDays = (key: 'website' | 'google', days: number) => {
    saveRecurringChecks({ ...recurringChecks, intervalDays: { ...recurringChecks.intervalDays, [key]: days } });
  };

  const setGoogleProfileUrl = (url: string) => {
    saveRecurringChecks({ ...recurringChecks, googleProfileUrl: url });
  };

  const handleClassify = (text: string) => {
    if (!text || text.trim().length < 5) {
      setClassificationResult(null);
      return;
    }

    setIsClassifying(true);
    setTimeout(() => {
      const lower = text.toLowerCase();
      let detectedType: ItemType = 'observation';
      let confLevel: ConfidenceLevel = 'High';
      let confReason = 'Direct contemporaneous report from user entry.';
      let origin: EvidenceOrigin = 'original';
      const facts: string[] = [];
      let interp = '';

      if (lower.includes('?') || lower.startsWith('why') || lower.startsWith('should we')) {
        detectedType = 'question';
        confLevel = 'Medium';
        confReason = 'Inquiry generated from early operational pattern.';
      } else if (lower.includes('resulted in') || lower.includes('outcome') || lower.includes('led to') || lower.includes('%')) {
        detectedType = 'outcome';
        confLevel = 'High';
        confReason = 'Metrics and performance observations identified.';
        origin = 'primary_external';
      } else if (lower.includes('report') || lower.includes('competitor') || lower.includes('article')) {
        detectedType = 'evidence';
        confLevel = 'Medium';
        confReason = 'Requires verification against primary source repository.';
        origin = 'secondary_external';
      } else {
        facts.push(text);
        if (lower.includes('because') || lower.includes('seems like') || lower.includes('probably')) {
          interp = 'Extracted implicit hypothesis from user wording.';
        }
      }

      setClassificationResult({
        type: detectedType,
        confidenceLevel: confLevel,
        confidenceReason: confReason,
        suggestedOrigin: origin,
        extractedFacts: facts.length > 0 ? facts : [text],
        potentialInterpretation: interp || 'Separated from facts: no ungrounded interpretation appended.',
      });

      setEditableType(detectedType);
      setSelectedConfidence(confLevel);
      setStatedReason(confReason);
      setEvidenceOrigin(origin);
      setIsClassifying(false);
    }, 280);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.length > 8) {
      handleClassify(val);
    } else {
      setClassificationResult(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onAddItemToInbox({
      type: editableType,
      date: new Date().toISOString().split('T')[0],
      summary: inputText.length > 120 ? inputText.slice(0, 117) + '...' : inputText,
      origin: evidenceOrigin,
      submittedBy: currentUserRole === 'owner_admin' ? 'Founder / Admin' : 'Field Contributor',
      submitterRole: currentUserRole,
      confidence: { level: selectedConfidence, reason: statedReason || 'Standard direct capture intake.' },
      retrospective: retrospectiveType,
      status: 'pending',
      fullText: inputText,
      sourceReference: 'Home Screen Live Intake',
      attachments,
      ...(sourceCategory ? { sourceCategory } : {}),
      ...(sourceType ? { sourceType } : {}),
    });

    setInputText('');
    setClassificationResult(null);
    setAttachments([]);
    setSourceCategory('');
    setSourceType('');
    setSubmissionSuccess(true);
    setTimeout(() => setSubmissionSuccess(false), 3500);
  };

  const samplePrompts = [
    { label: 'Observation test', text: 'Three guests arriving today stated the access road detour added twenty minutes.' },
    { label: 'Question test', text: 'Should we pause weekend photography ads given the monsoon extension?' },
    { label: 'Outcome test', text: 'Following the WhatsApp escort briefings, 100% of arriving guests rated arrival 5/5.' },
    { label: 'Evidence test', text: 'Forest department published a draft circular restricting nocturnal permits after 19:00.' },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="today-counts-heading">
        <div className="flex items-center justify-between mb-2">
          <h2 id="today-counts-heading" className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Today's Operational Ledger & Pending Triage
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => onNavigate('inbox')}
            className="text-left p-3 rounded border border-zinc-200 bg-white hover:border-zinc-400 transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-600">New Evidence</span>
              <Layers className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </div>
            <div className="text-2xl font-mono font-bold text-zinc-900">{counts.newEvidence}</div>
            <div className="text-[10px] text-zinc-500 font-sans mt-1">Awaiting Inbox triage</div>
          </button>

          <button
            onClick={() => onNavigate('record_workspace')}
            className="text-left p-3 rounded border border-zinc-200 bg-white hover:border-zinc-400 transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-600">Open Interpretations</span>
              <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </div>
            <div className="text-2xl font-mono font-bold text-zinc-900">{counts.openInterpretations}</div>
            <div className="text-[10px] text-zinc-500 font-sans mt-1">Under workspace audit</div>
          </button>

          <button
            onClick={() => onNavigate('decision_review')}
            className="text-left p-3 rounded border border-zinc-200 bg-white hover:border-zinc-400 transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-600">Decisions Awaiting Action</span>
              <Clock className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </div>
            <div className="text-2xl font-mono font-bold text-zinc-900">{counts.decisionsAwaitingAction}</div>
            <div className="text-[10px] text-zinc-500 font-sans mt-1">Requires class sign-off</div>
          </button>

          <button
            onClick={() => onNavigate('outcome_review')}
            className="text-left p-3 rounded border border-zinc-200 bg-white hover:border-zinc-400 transition-all shadow-xs flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-600">Actions Awaiting Outcomes</span>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </div>
            <div className="text-2xl font-mono font-bold text-zinc-900">{counts.actionsAwaitingOutcomes}</div>
            <div className="text-[10px] text-zinc-500 font-sans mt-1">In field execution</div>
          </button>

          <button
            onClick={() => onNavigate('ask_system')}
            className="text-left p-3 rounded border border-zinc-200 bg-white hover:border-zinc-400 transition-all shadow-xs flex flex-col justify-between group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-600">Lessons for Review</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </div>
            <div className="text-2xl font-mono font-bold text-zinc-900">{counts.lessonsDueForReview}</div>
            <div className="text-[10px] text-zinc-500 font-sans mt-1">Progression updates</div>
          </button>
        </div>
      </section>

      <section className="bg-white border border-zinc-300 rounded p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-zinc-900 font-sans">Operational Intake & Fast Capture</h1>
            <p className="text-xs text-zinc-600 font-sans">Enter any observation, evidence item, question, or outcome.</p>
          </div>
          <RetrospectiveMarker type="decision_time" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Test Templates:</span>
          {samplePrompts.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setInputText(p.text);
                handleClassify(p.text);
              }}
              className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded font-mono text-[11px] border border-zinc-300 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="border border-zinc-300 bg-zinc-50 rounded p-3.5 space-y-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-mono uppercase text-zinc-600 block">Live Intelligence Feed (auto-refreshing, real APIs \u2014 no AI involved)</span>
            <span className="text-[10px] font-mono text-zinc-500">
              {5 + (apiKeys.ebird.trim() ? 1 : 0) + (apiKeys.firms.trim() ? 1 : 0)} sources connected
            </span>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
              Suggested Topics (what Iddav WildStay stands for)
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setPullQuery(val);
                  refreshFeed(val);
                }
                e.target.value = '';
              }}
              className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900 mb-2"
            >
              <option value="">Pick a suggested topic, or type your own below…</option>
              <option value="Panthera tigris Tadoba Andhari">Tiger ecology — Tadoba Andhari (core species + reserve)</option>
              <option value="human-wildlife coexistence India">Human-wildlife coexistence (conservation framing, not conflict)</option>
              <option value="tiger corridor connectivity central India">Tiger corridor connectivity — central India</option>
              <option value="camera trap tiger monitoring Maharashtra">Camera trap tiger monitoring — Maharashtra</option>
              <option value="conservation hospitality ecotourism India">Conservation hospitality & ecotourism — India</option>
              <option value="buffer zone tiger reserve management">Buffer zone tiger reserve management</option>
            </select>
          </div>
          <input
            type="text"
            value={pullQuery}
            onChange={(e) => setPullQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') refreshFeed(pullQuery); }}
            placeholder="Search term, then press Enter \u2014 e.g. Panthera tigris Tadoba"
            className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900"
          />
          <button
            type="button"
            onClick={() => refreshFeed(pullQuery)}
            disabled={pullLoading !== ''}
            className="px-3 py-1.5 text-xs font-mono font-bold uppercase rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pullLoading === 'feed' ? 'Refreshing Feed...' : 'Refresh Feed'}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={apiKeys.ebird}
              onChange={(e) => saveApiKeys({ ...apiKeys, ebird: e.target.value })}
              placeholder="eBird API key (free — ebird.org/api/keygen)"
              className="w-full p-1.5 text-[10px] font-mono border border-zinc-300 rounded bg-zinc-50 text-zinc-700"
            />
            <input
              type="text"
              value={apiKeys.firms}
              onChange={(e) => saveApiKeys({ ...apiKeys, firms: e.target.value })}
              placeholder="NASA FIRMS MAP_KEY (free — firms.modaps.eosdis.nasa.gov)"
              className="w-full p-1.5 text-[10px] font-mono border border-zinc-300 rounded bg-zinc-50 text-zinc-700"
            />
          </div>

          {pullError && (
            <div className="p-2 bg-amber-50 border border-amber-300 rounded text-amber-900 text-[11px] font-mono">{pullError}</div>
          )}
          {pullResults.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {pullResults.map((c) => (
                <div key={c.id} className="p-2.5 bg-white border border-zinc-200 rounded flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-900 font-sans leading-snug">{c.summary}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{c.dateStr} · {SOURCE_CATEGORY_LABELS[c.category]}</p>
                  </div>
                  <button type="button" onClick={() => addPulledToInbox(c)} className="shrink-0 px-2 py-1 text-[10px] font-mono font-bold uppercase rounded bg-zinc-900 text-white hover:bg-zinc-800">
                    Add to Inbox
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-zinc-300 bg-zinc-50 rounded p-3.5 space-y-3 mb-4">
          <span className="text-[11px] font-mono uppercase text-zinc-600 block">Recurring Source Checks (manual, reminder-based)</span>
          <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
            Google's review data needs a paid, secured API key; most websites block automatic cross-origin pulls. This just remembers when you last checked and reminds you when it's due — saved in this browser only.
          </p>

          <div className="p-2.5 bg-white border border-zinc-200 rounded flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-zinc-900 font-sans block">iddavwildstay.com</span>
              <span className="text-[10px] font-mono text-zinc-500">
                {recurringChecks.lastChecked.website ? `Last checked ${daysSince(recurringChecks.lastChecked.website)}d ago` : 'Never checked'}
                {' · '}
                {daysSince(recurringChecks.lastChecked.website) >= recurringChecks.intervalDays.website ? (
                  <span className="text-amber-700 font-bold">Due now</span>
                ) : (
                  `due in ${recurringChecks.intervalDays.website - daysSince(recurringChecks.lastChecked.website)}d`
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={recurringChecks.intervalDays.website}
                onChange={(e) => setCheckIntervalDays('website', Number(e.target.value))}
                className="text-[10px] font-mono border border-zinc-300 rounded px-1.5 py-1 bg-white"
              >
                <option value={14}>Every 14 days</option>
                <option value={28}>Every 28 days</option>
              </select>
              <a href={recurringChecks.iddavwildstayUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[10px] font-mono border border-zinc-300 rounded hover:bg-zinc-100">
                Check Now
              </a>
              <button type="button" onClick={() => markChecked('website')} className="px-2 py-1 text-[10px] font-mono font-bold uppercase rounded bg-zinc-900 text-white hover:bg-zinc-800">
                Mark Checked
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-white border border-zinc-200 rounded space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-zinc-900 font-sans block">Google Business Profile / Reviews</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {recurringChecks.lastChecked.google ? `Last checked ${daysSince(recurringChecks.lastChecked.google)}d ago` : 'Never checked'}
                  {' · '}
                  {daysSince(recurringChecks.lastChecked.google) >= recurringChecks.intervalDays.google ? (
                    <span className="text-amber-700 font-bold">Due now</span>
                  ) : (
                    `due in ${recurringChecks.intervalDays.google - daysSince(recurringChecks.lastChecked.google)}d`
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={recurringChecks.intervalDays.google}
                  onChange={(e) => setCheckIntervalDays('google', Number(e.target.value))}
                  className="text-[10px] font-mono border border-zinc-300 rounded px-1.5 py-1 bg-white"
                >
                  <option value={14}>Every 14 days</option>
                  <option value={28}>Every 28 days</option>
                </select>
                <a
                  href={recurringChecks.googleProfileUrl || 'https://www.google.com/search?q=Iddav+Wildstay+Tadoba+reviews'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-[10px] font-mono border border-zinc-300 rounded hover:bg-zinc-100"
                >
                  Check Now
                </a>
                <button type="button" onClick={() => markChecked('google')} className="px-2 py-1 text-[10px] font-mono font-bold uppercase rounded bg-zinc-900 text-white hover:bg-zinc-800">
                  Mark Checked
                </button>
              </div>
            </div>
            <input
              type="text"
              value={recurringChecks.googleProfileUrl}
              onChange={(e) => setGoogleProfileUrl(e.target.value)}
              placeholder="Paste your Business Profile management link once to save it here"
              className="w-full p-1.5 text-[10px] font-mono border border-zinc-300 rounded bg-zinc-50 text-zinc-700"
            />
          </div>

          <p className="text-[10px] text-zinc-500 font-mono">
            Found something worth logging? Use the intake box below — tag it Source Category K (Iddav-Owned Channels) or N (Guest Experience).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="primary-intake-input" className="sr-only">
              What happened, or what are you thinking about?
            </label>
            <textarea
              id="primary-intake-input"
              rows={4}
              value={inputText}
              onChange={handleInputChange}
              placeholder="What happened, or what are you thinking about?"
              className="w-full p-3.5 text-sm sm:text-base border border-zinc-300 rounded focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 bg-white text-zinc-900 font-sans placeholder:text-zinc-400 leading-relaxed resize-y"
              required
            />
            {isClassifying && (
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 text-zinc-600 text-[11px] font-mono border border-zinc-300">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Classifying...</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1.5">
                Source Category (optional — which layer this came from)
              </label>
              <select
                value={sourceCategory}
                onChange={(e) => setSourceCategory(e.target.value as SourceCategory | '')}
                className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900"
              >
                <option value="">Unspecified</option>
                {Object.entries(SOURCE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {sourceCategory && <div className="mt-1.5"><SourceCategoryBadge category={sourceCategory} size="sm" /></div>}
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1.5">
                Evidentiary Weight (optional — how much to trust this, independent of domain)
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType | '')}
                className="w-full p-2 text-xs font-mono border border-zinc-300 rounded bg-white text-zinc-900"
              >
                <option value="">Unspecified</option>
                {Object.entries(SOURCE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {sourceType && <div className="mt-1.5"><SourceTypeBadge sourceType={sourceType} size="sm" /></div>}
            </div>
          </div>

          <MediaAttachmentPicker attachments={attachments} onChange={setAttachments} />

          {classificationResult && (
            <div className="border border-zinc-300 bg-zinc-50 rounded p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">System Classification:</span>
                  <select
                    value={editableType}
                    onChange={(e) => setEditableType(e.target.value as ItemType)}
                    className="px-2 py-1 text-xs font-mono font-bold uppercase rounded border border-zinc-300 bg-white text-zinc-900 focus:ring-1 focus:ring-zinc-800 cursor-pointer"
                  >
                    <option value="observation">Observation</option>
                    <option value="evidence">Evidence</option>
                    <option value="question">Question</option>
                    <option value="outcome">Outcome</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-white border-l-4 border-l-emerald-600 border border-zinc-200 rounded">
                  <span className="text-[11px] font-mono font-bold uppercase text-emerald-900 tracking-wider block mb-1.5">
                    Factual Zone (Observation / Event)
                  </span>
                  <p className="text-xs text-zinc-800 leading-relaxed font-sans">{classificationResult.extractedFacts[0] || inputText}</p>
                </div>
                <div className="p-3 bg-zinc-100 border-l-4 border-l-indigo-600 border border-zinc-200 rounded">
                  <span className="text-[11px] font-mono font-bold uppercase text-indigo-950 tracking-wider block mb-1.5">
                    Interpretation Zone (Hypothesis)
                  </span>
                  <p className="text-xs text-zinc-800 leading-relaxed font-sans">{classificationResult.potentialInterpretation}</p>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="confidence-level-select" className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                    Confidence Level *
                  </label>
                  <select
                    id="confidence-level-select"
                    value={selectedConfidence}
                    onChange={(e) => setSelectedConfidence(e.target.value as ConfidenceLevel)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-zinc-300 bg-white text-zinc-900"
                  >
                    <option value="High">High Confidence</option>
                    <option value="Medium">Medium Confidence</option>
                    <option value="Low">Low Confidence</option>
                    <option value="Unknown">Unknown (Indeterminate)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="stated-reason-input" className="block text-[11px] font-mono uppercase text-zinc-600 mb-1">
                    Stated Reason (Mandatory Rationale) *
                  </label>
                  <input
                    id="stated-reason-input"
                    type="text"
                    value={statedReason}
                    onChange={(e) => setStatedReason(e.target.value)}
                    placeholder="Why this confidence?"
                    className={`w-full px-2.5 py-1.5 text-xs font-sans rounded border ${
                      !statedReason.trim() ? 'border-amber-500 bg-amber-50/50' : 'border-zinc-300 bg-white'
                    } text-zinc-900`}
                    required
                  />
                  {!statedReason.trim() && (
                    <span className="text-[10px] font-mono text-amber-700 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Confidence cannot stand alone without a stated reason.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <ConfidenceTag confidence={{ level: selectedConfidence, reason: statedReason }} size="sm" />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('');
                      setClassificationResult(null);
                      setAttachments([]);
                    }}
                    className="px-3 py-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded hover:bg-zinc-100"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={!statedReason.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold uppercase rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Send to Inbox & Triage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {submissionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Item recorded and dispatched to Inbox triage queue.
              </span>
              <button type="button" onClick={() => onNavigate('inbox')} className="underline font-bold hover:text-emerald-950">
                View in Inbox →
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
};
