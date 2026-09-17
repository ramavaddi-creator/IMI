export type ConfidenceLevel = 'High' | 'Medium' | 'Low' | 'Unknown';

export type RetrospectiveType = 'decision_time' | 'reconstructed_post_hoc';

export type EvidenceOrigin =
  | 'original'
  | 'primary_external'
  | 'secondary_external'
  | 'synthetic'
  | 'anecdotal';

export type LearningStrength =
  | 'provisional'
  | 'repeated'
  | 'established'
  | 'contradicted';

export type ApprovalClass = 'A' | 'B' | 'C';

export type UserRole = 'owner_admin' | 'research_editor' | 'property_contributor' | 'reservations_sales';

export type ItemType = 'observation' | 'evidence' | 'question' | 'outcome';

export type RecordStatus = 'draft' | 'under_review' | 'verified' | 'decision_pending' | 'archived';

// CHANGE: domain isolation. Every record, decision, outcome and inbox item now
// carries its domain explicitly. Phase 1 only ever writes 'iddav-marketing-intelligence',
// but the field exists from day one so the later Sovereign Intelligence cross-domain
// validation (blueprint Rule #8) never requires a schema migration to add it retroactively.
export type Domain = 'iddav-marketing-intelligence';

// CHANGE: FR-INT-001 requires observations, questions, hypotheses, interpretations,
// patterns and warnings to be distinct record types, not every record forced through
// an observation+interpretation template. This is a light-touch Phase 1 implementation:
// the field exists and interpretation becomes optional for record types that don't need
// one yet (a pure open question, an unresolved pattern). Full type-specific rendering
// is a later-phase UI decision -- flagging that explicitly rather than silently deciding it.
export type IntelligenceRecordType =
  | 'observation'   // has both zones filled
  | 'question'      // interpretation may be absent -- the point is the question itself
  | 'hypothesis'    // interpretation-led, observation may be thin
  | 'pattern'       // derived from multiple prior records, not a single observation
  | 'warning';      // a risk flag, may not resolve to a single interpretation

export interface ConfidenceRationale {
  level: ConfidenceLevel;
  reason: string;
}

export interface LinkedEvidenceItem {
  id: string;
  title: string;
  source: string;
  origin: EvidenceOrigin;
  relation: 'supports' | 'contradicts' | 'contextualizes';
  confidence: ConfidenceRationale;
  retrospective: RetrospectiveType;
  excerpt: string;
  date: string;
}

export interface AlternativeInterpretation {
  id: string;
  title: string;
  proponentRole: string;
  rationale: string;
  confidence: ConfidenceRationale;
}

export interface AssumptionItem {
  id: string;
  text: string;
  testedStatus: 'untested' | 'partially_tested' | 'invalidated' | 'confirmed';
  impactSeverity: 'low' | 'medium' | 'critical';
}

export interface IntelligenceRecord {
  id: string;
  code: string; // CHANGE: now generated as INT-0001, INT-0002... (blueprint Section 8)
  domain: Domain; // CHANGE: new field
  recordType: IntelligenceRecordType; // CHANGE: new field, see type comment above
  title: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorRole: UserRole;

  observation: {
    rawStatement: string;
    verifiedFacts: string[];
    dateRecorded: string;
    origin: EvidenceOrigin;
    evidenceConfidence: ConfidenceRationale;
    retrospective: RetrospectiveType;
  };

  // CHANGE: optional. A 'question' or early 'pattern' record type may not have
  // a settled interpretation yet -- forcing one would mean inventing a hypothesis
  // that doesn't exist, which is exactly the kind of ungrounded content PR-02 forbids.
  interpretation?: {
    coreHypothesis: string;
    analyticalInference: string;
    interpretationConfidence: ConfidenceRationale;
    retrospective: RetrospectiveType;
    alternativeInterpretations: AlternativeInterpretation[];
  };

  linkedEvidence: LinkedEvidenceItem[];
  assumptions: AssumptionItem[];
  openQuestions: string[];
  learningStrength: LearningStrength;

  // CHANGE: carries forward a verification flag from the Phase 0 manifest so a record
  // that was marked "needs verification" or "mapped, not confirmed" doesn't silently
  // lose that caveat when it enters the real system.
  verificationFlag?: string;
  sourceCategory?: SourceCategory;
  sourceType?: SourceType;
}

// CHANGE: field-captured or AI-generated media attached to an inbox item, so a
// safari photo/video and an AI-generated illustration are never visually or
// structurally indistinguishable -- DEC-0001 requires the distinction stay explicit.
export type MediaOrigin = 'field_capture' | 'ai_generated';

export interface MediaAttachment {
  id: string;
  name: string;
  kind: 'image' | 'video' | 'document';
  url: string;
  origin: MediaOrigin;
}

// CHANGE: the full 16-category Source Registry for Iddav Intelligence
// Marketing. sourceCategory says WHICH DOMAIN evidence came from.
export type SourceCategory =
  | 'A_wildlife_tiger_india'
  | 'B_global_biodiversity'
  | 'C_scientific_research'
  | 'D_wildlife_health'
  | 'E_satellite_landscape'
  | 'F_weather_water'
  | 'G_tadoba_destination'
  | 'H_tourism_market'
  | 'I_competitor_pricing'
  | 'J_search_intent'
  | 'K_iddav_channels'
  | 'L_iddav_evidence'
  | 'M_enquiry_revenue'
  | 'N_guest_experience'
  | 'O_news_signals'
  | 'P_social_conversation';

export const SOURCE_CATEGORY_LABELS: Record<SourceCategory, string> = {
  A_wildlife_tiger_india: 'A. Wildlife, Tiger & Conservation — India',
  B_global_biodiversity: 'B. Global Biodiversity & Species',
  C_scientific_research: 'C. Scientific Research',
  D_wildlife_health: 'D. Wildlife Health / Disease / One Health',
  E_satellite_landscape: 'E. Satellite, Forest, Fire & Landscape',
  F_weather_water: 'F. Weather, Rainfall & Water',
  G_tadoba_destination: 'G. Tadoba & Destination Intelligence',
  H_tourism_market: 'H. Tourism & Travel Market',
  I_competitor_pricing: 'I. Competitor & Pricing Intelligence',
  J_search_intent: 'J. Search & Consumer Intent',
  K_iddav_channels: 'K. Iddav-Owned Marketing Channels',
  L_iddav_evidence: 'L. Iddav Content & Original Evidence',
  M_enquiry_revenue: 'M. Enquiry → Booking → Revenue',
  N_guest_experience: 'N. Guest Experience Intelligence',
  O_news_signals: 'O. News & Emerging Signals',
  P_social_conversation: 'P. Social / Public Conversation',
};

// CHANGE: orthogonal to SourceCategory, not derived from it. Category says
// WHICH DOMAIN evidence came from; SourceType says HOW MUCH EVIDENTIARY WEIGHT
// it carries. Several categories (A, B, D, E, F, G, J, N) genuinely mix
// multiple source types depending on the specific source within them -- e.g.
// Category A holds both NTCA records (Official) and WII peer-reviewed papers
// (Scientific) -- so this cannot be collapsed into category alone.
export type SourceType =
  | 'PRIMARY_EVIDENCE'
  | 'OFFICIAL'
  | 'SCIENTIFIC'
  | 'MARKET'
  | 'MEDIA'
  | 'SOCIAL'
  | 'FIRST_PARTY_COMMERCIAL'
  | 'FIRST_PARTY_AUDIENCE';

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  PRIMARY_EVIDENCE: 'Primary Evidence',
  OFFICIAL: 'Official',
  SCIENTIFIC: 'Scientific',
  MARKET: 'Market',
  MEDIA: 'Media',
  SOCIAL: 'Social',
  FIRST_PARTY_COMMERCIAL: 'First-Party Commercial',
  FIRST_PARTY_AUDIENCE: 'First-Party Audience',
};

export interface InboxItem {
  id: string;
  code: string; // CHANGE: now INB-0001 style
  domain: Domain; // CHANGE: new field
  type: ItemType;
  date: string;
  summary: string;
  origin: EvidenceOrigin;
  submittedBy: string;
  submitterRole: UserRole;
  confidence?: ConfidenceRationale;
  retrospective: RetrospectiveType;
  status: 'pending' | 'verified' | 'promoted' | 'archived' | 'ignored';
  fullText: string;
  sourceReference?: string;
  attachments?: MediaAttachment[];
  sourceCategory?: SourceCategory;
  sourceType?: SourceType;
}

export type DecisionOptionId = 'publish' | 'do_not_publish' | 'wait' | 'investigate' | 'communicate_privately';

export interface DecisionOption {
  id: DecisionOptionId;
  label: string;
  description: string;
  isEquallyWeightedNonPublish: boolean;
}

export interface DecisionItem {
  id: string;
  code: string; // CHANGE: now DEC-0001 style
  domain: Domain; // CHANGE: new field
  title: string;
  problemStatement: string;
  associatedRecordCode: string;
  approvalClass: ApprovalClass;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'deferred';
  approverRequired: string;
  approvedBy?: string;
  approvedAt?: string;
  retrospective: RetrospectiveType;

  optionsConsidered: {
    id: DecisionOptionId;
    title: string;
    summary: string;
    tradeoffs: string;
  }[];

  selectedOption: DecisionOptionId;
  rationale: string;
  confidence: ConfidenceRationale;

  actionsDeliberatelyAvoided: string[];

  risks: {
    description: string;
    severity: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }[];

  // CHANGE: see note in mockData.ts on Cases 3 and 8 -- the fixed five-value
  // DecisionOptionId enum doesn't cleanly cover every real decision shape found in
  // the Phase 0 manifest (e.g. an entity-naming rule, a pricing-disclosure rule).
  // This flag surfaces that mismatch instead of silently force-fitting it.
  schemaFitNote?: string;
}

export interface OutcomeItem {
  id: string;
  code: string; // CHANGE: now OUT-0001 style
  domain: Domain; // CHANGE: new field
  decisionCode: string;
  actionTaken: string;
  actualOutcome: string;
  dateEvaluated: string;
  evaluator: string;
  retrospective: RetrospectiveType;

  quantitativeResults: {
    metric: string;
    expected: string;
    actual: string;
    variance: string;
  }[];

  qualitativeResults: string[];

  attributionConfidence: ConfidenceRationale;

  unexpectedEffects: string[];

  resultingLearning: {
    summary: string;
    learningStrength: LearningStrength;
  };
}

export interface SearchQueryResult {
  id: string;
  code: string;
  domain: Domain; // CHANGE: new field
  type: 'evidence' | 'decision' | 'outcome' | 'learning';
  title: string;
  excerpt: string;
  retrievalReason: string;
  relationshipType: 'similar_to_this' | 'caused_this';
  confidence: ConfidenceRationale;
  retrospective: RetrospectiveType;
  date: string;
}

export type ActiveScreen =
  | 'home_today'
  | 'inbox'
  | 'record_workspace'
  | 'decision_review'
  | 'outcome_review'
  | 'ask_system';

// CHANGE: shared ID formatting helper, matching blueprint Section 8's stated
// convention (EVD-0001, INT-0001, DEC-0001 -- zero-padded, type-prefixed, no
// embedded year). Replaces the ad hoc `IMI-REC-2026-0${records.length + 45}`
// style generation that was in App.tsx.
export function formatRecordCode(prefix: 'INT' | 'DEC' | 'OUT' | 'INB' | 'EVD' | 'LRN', sequence: number): string {
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}
