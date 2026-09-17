import React from 'react';
import {
  X,
  Compass,
  Inbox,
  FileText,
  CheckSquare,
  TrendingUp,
  Search,
  ShieldCheck,
  GitFork,
  Lock,
  Users,
  Palette,
} from 'lucide-react';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label="IMI Help Guide"
    >
      <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-3xl max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-zinc-800 z-10">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider">How to Use IMI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close help guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 text-sm font-sans text-zinc-800">
          <section className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">What IMI Is</h3>
            <p className="leading-relaxed">
              Iddav Marketing Intelligence (IMI) is an internal decision-and-learning workspace. Its one strict rule:
              observed facts and analytical interpretations are always kept in separate, clearly labelled zones,
              and every confidence rating must come with an explicit stated reason. This keeps marketing decisions
              grounded in what was actually observed, rather than assumptions dressed up as facts.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">The Basic Workflow</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {[
                '1. Capture an observation, evidence item, question, or outcome',
                '2. Triage it in the Inbox: verify, archive, ignore, or promote',
                '3. Promoted items become Intelligence Records with Fact + Interpretation zones',
                '4. Records feed Decisions, which require Class A/B/C sign-off',
                '5. Executed decisions get logged as Outcomes with attribution confidence',
                '6. Outcomes synthesize into institutional Learning you can search later',
              ].map((step) => (
                <div key={step} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-700 leading-snug">
                  {step}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Screen by Screen</h3>

            <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
              <Compass className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block">Home / Today</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Your daily ledger and fast-capture box. Type anything you observed or are wondering about; the
                  system suggests a type, confidence level, and origin, which you can edit before sending it to the
                  Inbox.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
              <Inbox className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block">Inbox &amp; Triage</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Every captured item lands here first. Review it, confirm or add a stated confidence reason, then
                  Verify, Archive, Ignore, or Promote it into a full Intelligence Record.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
              <FileText className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block">Record Workspace</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Each record has a green Fact zone (only verified, observed statements) and a blue Interpretation
                  zone (your working hypothesis, clearly marked as not-fact). Interpretation is optional — pure
                  questions or unresolved patterns don't need one yet. You can add counter-hypotheses to challenge
                  the leading interpretation.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
              <CheckSquare className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block">Decision Review</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Shows the options that were considered, which one was selected and why, what was deliberately
                  avoided, and the risks with their mitigations. Class A decisions (high-risk) require the
                  Owner/Admin to type a confirmation phrase before locking the sign-off.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
              <TrendingUp className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block">Outcome Review</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Compares what was expected against what actually happened, with an honest attribution confidence
                  — "Unknown" is a valid, expected result when a causal link genuinely can't be traced. Each
                  outcome synthesizes into a Learning statement.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
              <Search className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block">Ask the System</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Search past evidence, decisions, outcomes, and learnings. Results are always tagged as either
                  "Caused This" (a direct chronological predecessor) or "Similar to This" (a thematic parallel, not
                  a proven cause) — the system never blurs the two.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded">
              <Palette className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block">Create Poster (opens in a new tab)</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Two buttons in the header, side by side: <strong>Claude</strong> opens the Iddav Perspective Poster
                  Studio &mdash; a tool that analyzes an uploaded photo, drafts platform-specific captions, and lets
                  you download a branded poster. <strong>ChatGPT</strong> opens a fresh ChatGPT tab, where your
                  account's own history and established brand voice already carry the context. Both live outside IMI
                  since they need each assistant's own hosted capabilities, which a plain browser app like IMI can't
                  call directly.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Key Concepts</h3>

            <div className="flex gap-3 p-3 border border-zinc-200 rounded">
              <ShieldCheck className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block text-xs">Confidence + Stated Reason</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Every confidence tag (High / Medium / Low / Unknown) must carry an explicit written reason. A
                  confidence level with no reason is flagged as a governance violation and can't be left as-is.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 border border-zinc-200 rounded">
              <GitFork className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block text-xs">Retrospective Marker</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Every record shows whether it was logged at the moment of the decision ("Decision-time") or
                  written up afterward from memory ("Reconstructed post-hoc") — so nobody mistakes an
                  after-the-fact account for a contemporaneous one.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 border border-zinc-200 rounded">
              <Lock className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 block text-xs">Approval Classes</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Class A (high risk) can only be signed off by the Founder/Owner-Admin, with a typed confirmation.
                  Class B (standard) allows a Research Editor or the Founder to approve. Class C (routine) is
                  desk-level sign-off.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 border border-zinc-200 rounded">
              <Users className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-zinc-900 block">Roles</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Owner/Admin (Founder, Class A approver), Research Editor, Property Contributor (field/mobile), and
                  Reservations-Sales Desk. Switch roles from the dropdown in the top-right to see how permissions
                  change what you can approve.
                </p>
              </div>
            </div>
          </section>

          <section className="p-3.5 bg-zinc-900 text-white rounded text-xs font-sans leading-relaxed">
            Tip: this Help Guide is available any time from the button in the top navigation bar next to your role
            switcher.
          </section>
        </div>
      </div>
    </div>
  );
};
