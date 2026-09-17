import type {
  IntelligenceRecord,
  InboxItem,
  DecisionItem,
  OutcomeItem,
  SearchQueryResult,
} from './types';
import { formatRecordCode } from './types';

// ============================================================================
// SEED DATA SOURCE OF TRUTH
// Every record below is derived from the actual Phase 0 ten-case manifest
// (Iddav_IMI_Phase0_TenCases.xlsx), not invented for this prototype.
// Cases 4, 5, and 9's source titles were flagged in the manifest as
// "mapped, not title-confirmed" -- that caveat is preserved here in
// verificationFlag / schemaFitNote fields rather than silently dropped.
// ============================================================================

export const INITIAL_INBOX_ITEMS: InboxItem[] = [
  {
    id: 'inbox-01',
    code: formatRecordCode('INB', 1),
    domain: 'iddav-marketing-intelligence',
    type: 'observation',
    date: '2026-09-14',
    summary: 'Tiger presence/territory-marking behaviour observed at or near the Sri Antra boundary.',
    origin: 'anecdotal',
    submittedBy: 'Founder / Admin',
    submitterRole: 'owner_admin',
    confidence: {
      level: 'Medium',
      reason: 'General pattern well-attested across brand copy, but no single dated photo/video/field-note record has been linked to this specific case yet.',
    },
    retrospective: 'reconstructed_post_hoc',
    status: 'promoted',
    fullText: 'Scent marking / paw-rake signs observed at or near the property boundary during the operating period. Exact date, individual ID and precise location not yet confirmed.',
    sourceReference: 'Case 1, Phase 0 manifest -- needs source photo/note linked',
  },
  {
    id: 'inbox-02',
    code: formatRecordCode('INB', 2),
    domain: 'iddav-marketing-intelligence',
    type: 'question',
    date: '2026-09-15',
    summary: 'Do the ESG figures asserted in the reuse-first blueprint (50% women employment, 60%+ local procurement) match any real source document?',
    origin: 'secondary_external',
    submittedBy: 'Research Editor',
    submitterRole: 'research_editor',
    confidence: {
      level: 'Low',
      reason: 'Neither figure matches the published ESG score (13.5/17 SDGs, 79%) or the Shared Landscape series figures (80% local hiring, 60% local produce sourcing) found in prior sessions.',
    },
    retrospective: 'decision_time',
    status: 'promoted',
    fullText: 'The reuse-first blueprint names specific ESG percentages as an example Phase 0 case. A check against retrievable source material found no matching figure. This item exists to test whether the system correctly blocks an unverified number from becoming a published claim.',
    sourceReference: 'Case 7, Phase 0 manifest',
  },
  {
    id: 'inbox-03',
    code: formatRecordCode('INB', 3),
    domain: 'iddav-marketing-intelligence',
    type: 'evidence',
    date: '2026-09-10',
    summary: 'Behaviour Intelligence AI "Live Read" launch campaign shipped across four platforms with no linked inquiry/booking attribution found.',
    origin: 'original',
    submittedBy: 'Founder / Admin',
    submitterRole: 'owner_admin',
    confidence: {
      level: 'High',
      reason: 'Full campaign copy and competitive positioning check are documented; what is missing is attribution data, not the content itself.',
    },
    retrospective: 'reconstructed_post_hoc',
    status: 'pending',
    fullText: 'Matching copy shipped across LinkedIn, Instagram, Facebook and WhatsApp for the Behaviour Intelligence AI launch. No content-to-inquiry or content-to-booking link exists in retrievable records for this campaign.',
    sourceReference: 'Case 9, Phase 0 manifest',
  },
];

export const INITIAL_INTELLIGENCE_RECORDS: IntelligenceRecord[] = [
  {
    id: 'rec-001',
    code: formatRecordCode('INT', 1),
    domain: 'iddav-marketing-intelligence',
    recordType: 'observation',
    title: 'Tiger territory-marking near Sri Antra: restrained forest-proximity messaging',
    status: 'under_review',
    createdAt: '2026-09-16 09:00',
    updatedAt: '2026-09-16 09:00',
    author: 'Founder / Admin',
    authorRole: 'owner_admin',
    observation: {
      rawStatement: 'Tiger presence / territory-marking behaviour (scent marking, scratch / paw-rake signs) observed at or near the Sri Antra boundary during the property\'s operating period.',
      verifiedFacts: [
        'Referenced across multiple prior sessions as the basis for restrained forest-proximity brand language.',
        'No single dated photo, video, or field note has yet been linked to this specific case.',
      ],
      dateRecorded: '2026-09-14',
      origin: 'anecdotal',
      evidenceConfidence: {
        level: 'Medium',
        reason: 'The general pattern is well-attested in brand copy, but no original file is linked to this exact case yet -- confidence would rise to High once one is.',
      },
      retrospective: 'reconstructed_post_hoc',
    },
    interpretation: {
      coreHypothesis: 'Sri Antra\'s proximity to genuine wild tiger habitat is real and can be communicated honestly without implying guaranteed guest sightings.',
      analyticalInference: 'Restrained, non-deterministic proximity language ("the forest does not begin far away") is consistent with existing brand doctrine and avoids the guaranteed-sighting claim the platform explicitly blocks.',
      interpretationConfidence: {
        level: 'Medium',
        reason: 'The positioning choice is well-reasoned but untested against a measured guest response.',
      },
      retrospective: 'reconstructed_post_hoc',
      alternativeInterpretations: [
        {
          id: 'alt-int-0001-a',
          title: 'Transient sub-adult, not a resident territory holder',
          proponentRole: 'Research Editor',
          rationale: 'Marking behaviour alone does not confirm a permanent resident; a dispersing sub-adult would make the proximity claim less durable over time.',
          confidence: { level: 'Low', reason: 'Not ruled out with current evidence; no tracking data available.' },
        },
      ],
    },
    linkedEvidence: [],
    assumptions: [
      {
        id: 'assump-int-0001-a',
        text: 'Guests reading restrained proximity language correctly infer authenticity rather than absence of wildlife.',
        testedStatus: 'untested',
        impactSeverity: 'medium',
      },
    ],
    openQuestions: [
      'Locate the original photo, video, or field note this case is based on, and confirm the date and observer, before this record is treated as fully verified.',
    ],
    learningStrength: 'provisional',
    verificationFlag: 'NEEDS VERIFICATION: source evidence file not yet linked (Case 1, Phase 0 manifest).',
  },
  {
    id: 'rec-002',
    code: formatRecordCode('INT', 2),
    domain: 'iddav-marketing-intelligence',
    recordType: 'warning',
    title: 'ESG claim verification test: women\'s employment and local procurement percentages',
    status: 'under_review',
    createdAt: '2026-09-16 09:05',
    updatedAt: '2026-09-16 09:05',
    author: 'Research Editor',
    authorRole: 'research_editor',
    observation: {
      rawStatement: 'The reuse-first blueprint names "50% women employment and more than 60% local procurement" as an example ESG claim for a Phase 0 case.',
      verifiedFacts: [
        'Published ESG score found in prior sessions: 13.5/17 SDGs (79%), flagship SDGs 15 / 8 / 12.',
        '"The Shared Landscape" content series states 80% local staff hiring and 60% local produce sourcing -- a different figure, on a different metric, from a different piece of content.',
        'No source document was found matching "50% women employment" or "60%+ local procurement" verbatim.',
      ],
      dateRecorded: '2026-09-16',
      origin: 'secondary_external',
      evidenceConfidence: {
        level: 'Low',
        reason: 'The specific figures asserted in the blueprint do not match any figure found in retrievable chat history. This is the strongest reason this cannot be entered as verified.',
      },
      retrospective: 'decision_time',
    },
    interpretation: {
      coreHypothesis: 'This claim cannot be entered as a verified ESG fact until the exact source document is located and checked.',
      analyticalInference: 'Publishing an unverified percentage would be exactly the kind of unsupported claim PR-01 and FR-BRD-003 exist to block. This case is a deliberate test of whether the schema actually stops that from happening, not a completed ESG claim.',
      interpretationConfidence: {
        level: 'Low',
        reason: 'Low is the correct confidence here -- asserting anything higher would defeat the purpose of the test case.',
      },
      retrospective: 'decision_time',
      alternativeInterpretations: [
        {
          id: 'alt-int-0002-a',
          title: 'The figures exist in an unreviewed ESG document',
          proponentRole: 'Research Editor',
          rationale: 'A full ESG framework file may contain these exact figures even though this compilation did not locate one.',
          confidence: { level: 'Medium', reason: 'Plausible but unconfirmed -- the source document has not been produced or reviewed.' },
        },
      ],
    },
    linkedEvidence: [],
    assumptions: [],
    openQuestions: [
      'Locate and check the original ESG framework document for the actual women\'s-employment and procurement figures before any percentage is published.',
    ],
    learningStrength: 'provisional',
    verificationFlag: 'STOP -- NEEDS SOURCE DOCUMENT before this figure is published anywhere. Treat this record as evidence the verification step works, not as a completed ESG claim.',
  },
];

export const INITIAL_DECISIONS: DecisionItem[] = [
  {
    id: 'dec-001',
    code: formatRecordCode('DEC', 1),
    domain: 'iddav-marketing-intelligence',
    title: 'Preserve real evidence over synthetic replacement (real vs. AI imagery)',
    problemStatement: 'Recurring decision point across content work: whether AI-generated wildlife imagery or video may substitute for real photographs and field footage.',
    associatedRecordCode: formatRecordCode('INT', 1),
    approvalClass: 'B',
    approvalStatus: 'approved',
    approverRequired: 'Founder / Admin',
    approvedBy: 'Founder / Admin',
    approvedAt: '2026-05-01',
    retrospective: 'reconstructed_post_hoc',
    optionsConsidered: [
      {
        id: 'publish',
        title: 'AI-assisted conceptual content, clearly disclosed',
        summary: 'Use AI tooling for narrative, conceptual, or depth-conversion work (e.g. the Independence Day film narration), with disclosure.',
        tradeoffs: 'Expands what can be produced without real footage, but requires disciplined disclosure every time.',
      },
      {
        id: 'do_not_publish',
        title: 'Do not present AI-generated imagery as real evidence',
        summary: 'Real photographic and video evidence remains primary and undisplaceable for any wildlife behaviour or sighting claim.',
        tradeoffs: 'Limits content volume to what real material actually supports, but protects the platform\'s core credibility.',
      },
    ],
    selectedOption: 'do_not_publish',
    rationale: 'Guest trust and brand differentiation depend on documentary authenticity. This is the strongest-evidenced case in the whole manifest -- the rule is explicit and repeated unchanged across three separate document iterations (PR-05, PR-06, FR-BRD-007).',
    confidence: {
      level: 'High',
      reason: 'Explicit, written rule, consistently stated across FRS v1.0, v1.2, and the reuse-first blueprint.',
    },
    actionsDeliberatelyAvoided: [
      'Presenting AI-generated tiger footage or composites as real Sri Antra sightings.',
    ],
    risks: [
      {
        description: 'AI-assisted conceptual content could be mistaken by a viewer for a real sighting if disclosure is inconsistent.',
        severity: 'Medium',
        mitigation: 'Disclosure follows the asset per FR-BRD-007 -- every AI-assisted piece is labelled, not just the ones judged high-risk.',
      },
    ],
  },
  {
    id: 'dec-002',
    code: formatRecordCode('DEC', 2),
    domain: 'iddav-marketing-intelligence',
    title: 'Separate Iddav WildStay from Sri Antra in brand communication',
    problemStatement: 'Risk of guest- and public-facing confusion between "Sri Antra" (the land/property/operations entity) and "Iddav WildStay" (the commercial hospitality brand).',
    associatedRecordCode: formatRecordCode('INT', 1),
    approvalClass: 'B',
    approvalStatus: 'approved',
    approverRequired: 'Founder / Admin',
    approvedBy: 'Founder / Admin',
    approvedAt: '2026-09-01',
    retrospective: 'decision_time',
    optionsConsidered: [
      {
        id: 'do_not_publish',
        title: 'Keep the two names strictly separated',
        summary: 'Iddav WildStay owns all commercial attribution; Sri Antra is the source of property facts and operational evidence.',
        tradeoffs: 'Requires discipline in every piece of content, but keeps evidence provenance clean.',
      },
      {
        id: 'publish',
        title: 'Merge into a single public identity',
        summary: 'Use one name for everything, for simplicity.',
        tradeoffs: 'Simpler externally, but blurs which entity "owns" a booking, a review, or an ESG claim.',
      },
    ],
    selectedOption: 'do_not_publish',
    rationale: 'Clear entity separation prevents commercial-attribution and claims confusion. A fact about the land is not the same evidentiary class as a marketing claim about the brand.',
    confidence: {
      level: 'High',
      reason: 'Explicit, written, unchanged across FRS revisions (Section 2.3).',
    },
    actionsDeliberatelyAvoided: [
      'Using the two names interchangeably in commercial or legal contexts.',
    ],
    risks: [
      {
        description: 'Existing published content may not consistently follow this separation.',
        severity: 'Medium',
        mitigation: 'A retroactive audit of published posters/articles against this rule is an early Phase 1 task, not yet completed.',
      },
    ],
    schemaFitNote: 'This decision is really an entity-naming/governance rule, not a publish-vs-withhold content decision. The five-value DecisionOptionId enum (publish / do_not_publish / wait / investigate / communicate_privately) does not have a clean slot for "which of two entities does this belong to" -- mapped to do_not_publish/publish here as the closest fit. Worth deciding whether governance rules like this deserve their own record type distinct from content Decisions.',
  },
  {
    id: 'dec-003',
    code: formatRecordCode('DEC', 3),
    domain: 'iddav-marketing-intelligence',
    title: 'Room/package pricing communication and the Core-safari promise limit',
    problemStatement: 'Package pricing communication needed a rule preventing promises of Core Tadoba safari availability that aren\'t confirmed for the specific booking.',
    associatedRecordCode: formatRecordCode('INT', 1),
    approvalClass: 'A',
    approvalStatus: 'pending',
    approverRequired: 'Founder / Admin (Mandatory Class A)',
    retrospective: 'decision_time',
    optionsConsidered: [
      {
        id: 'do_not_publish',
        title: 'Never promise Core-zone access in fixed-price packages',
        summary: 'Packages describe safari access accurately (buffer zone vs. Core, confirmed vs. requested) and never promise Core access unless it is actually confirmed for that booking.',
        tradeoffs: 'More conservative marketing copy, but avoids a misleading-claim violation and guest disappointment.',
      },
      {
        id: 'publish',
        title: 'Bundle Core-zone access as a standard package inclusion',
        summary: 'Market Core safari as included, since forest-department allocation is usually available.',
        tradeoffs: 'Simpler, more attractive marketing, but Core-zone permits are allocated by the forest department and not guaranteed by the property.',
      },
    ],
    selectedOption: 'do_not_publish',
    rationale: 'Core-zone safari permits are allocated by the forest department and are not guaranteed by the property. Bundling an unconfirmed Core promise risks both guest disappointment and a misleading-claim violation.',
    confidence: {
      level: 'High',
      reason: 'Direct implementation of FR-COM-008 (availability truth) and FR-COM-009 (no Core promise).',
    },
    actionsDeliberatelyAvoided: [
      'Marketing copy implying guaranteed Core-zone safari inclusion in a fixed-price package.',
    ],
    risks: [
      {
        description: 'Current live package pages may not yet reflect this rule.',
        severity: 'High',
        mitigation: 'Audit current live package/pricing pages against FR-COM-009 as an early Phase 1 task.',
      },
    ],
    schemaFitNote: 'Also a governance/operational rule rather than a single publish-or-withhold content decision -- same mismatch noted on the entity-separation decision above. Flagged rather than force-fit silently.',
  },
];

export const INITIAL_OUTCOMES: OutcomeItem[] = [
  {
    id: 'out-001',
    code: formatRecordCode('OUT', 1),
    domain: 'iddav-marketing-intelligence',
    decisionCode: formatRecordCode('DEC', 1),
    actionTaken: 'Behaviour Intelligence AI "Live Read" launch: matching copy shipped across LinkedIn, Instagram, Facebook and WhatsApp, plus a documented competitive positioning check.',
    actualOutcome: 'No content-to-inquiry or content-to-booking attribution link exists in retrievable material for this campaign, or for any other campaign reviewed in this compilation.',
    dateEvaluated: '2026-09-16',
    evaluator: 'Founder / Admin',
    retrospective: 'reconstructed_post_hoc',
    quantitativeResults: [],
    qualitativeResults: [
      'The content and its rationale are thoroughly documented -- what is missing is not evidence of the content, it is evidence of what happened after it was posted.',
    ],
    attributionConfidence: {
      level: 'Unknown',
      reason: 'No WhatsApp click, inquiry, or booking record has been located that links back to this specific campaign. This is a confirmed gap in the underlying tracking, not a failed search.',
    },
    unexpectedEffects: [],
    resultingLearning: {
      summary: 'The absence of an attribution trail for even the single best-documented campaign in this material is the most important early finding in the whole manifest -- it demonstrates concretely why FR-CRM-008 (multi-touch attribution) and the inquiry/booking ledger are P0 priorities, not nice-to-haves.',
      learningStrength: 'established',
    },
  },
  {
    id: 'out-002',
    code: formatRecordCode('OUT', 2),
    domain: 'iddav-marketing-intelligence',
    decisionCode: formatRecordCode('DEC', 1),
    actionTaken: 'Editorial review session: multiple specific copy corrections were made, each with the original wording, the reason for rejection, and the revised wording captured directly in the source conversation.',
    actualOutcome: 'Corrected language adopted as standing practice: no naturalist-verification claim, "grounded in" instead of "trained on" for unlabelled source material, "as far as we\'ve found" instead of "world first".',
    dateEvaluated: '2026-08-20',
    evaluator: 'Founder / Admin',
    retrospective: 'reconstructed_post_hoc',
    quantitativeResults: [],
    qualitativeResults: [
      'The same category of correction (overclaiming precision or certainty) recurred across at least three distinct phrases in one session alone.',
    ],
    attributionConfidence: {
      level: 'Unknown',
      reason: 'No engagement or inquiry comparison exists between the rejected and corrected wording -- this outcome captures the editorial correction itself, not a measured audience response to it.',
    },
    unexpectedEffects: [],
    resultingLearning: {
      summary: 'Overclaiming precision or certainty is a recurring house tendency in Iddav content, not a one-off mistake -- worth watching for specifically in future review passes.',
      learningStrength: 'repeated',
    },
  },
];

export const INITIAL_SEARCH_RESULTS: SearchQueryResult[] = [
  {
    id: 'sr-01',
    code: formatRecordCode('INT', 1),
    domain: 'iddav-marketing-intelligence',
    type: 'evidence',
    title: 'Tiger territory-marking near Sri Antra',
    excerpt: 'Restrained forest-proximity messaging, evidence confidence Medium pending source file link.',
    retrievalReason: 'Direct keyword match: "tiger", "proximity", "sighting".',
    relationshipType: 'caused_this',
    confidence: { level: 'Medium', reason: 'Underlying source file not yet linked.' },
    retrospective: 'reconstructed_post_hoc',
    date: '2026-09-16',
  },
  {
    id: 'sr-02',
    code: formatRecordCode('DEC', 1),
    domain: 'iddav-marketing-intelligence',
    type: 'decision',
    title: 'Preserve real evidence over synthetic replacement',
    excerpt: 'Selected: real evidence remains primary; AI-assisted content permitted only with disclosure.',
    retrievalReason: 'Directly governs how the tiger-marking case above may be illustrated.',
    relationshipType: 'caused_this',
    confidence: { level: 'High', reason: 'Explicit written rule across three document versions.' },
    retrospective: 'reconstructed_post_hoc',
    date: '2026-05-01',
  },
  {
    id: 'sr-03',
    code: formatRecordCode('OUT', 1),
    domain: 'iddav-marketing-intelligence',
    type: 'learning',
    title: 'No attribution trail exists for the best-documented campaign',
    excerpt: 'Established learning: the inquiry/booking ledger is a P0 priority, confirmed by real data absence.',
    retrievalReason: 'Thematic overlap: any new content decision should account for the fact that attribution currently cannot be measured.',
    relationshipType: 'similar_to_this',
    confidence: { level: 'High', reason: 'Confirmed absent across every campaign reviewed, not just one.' },
    retrospective: 'reconstructed_post_hoc',
    date: '2026-09-16',
  },
];
