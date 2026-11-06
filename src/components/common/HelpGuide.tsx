import React, { useMemo, useState } from 'react';
import {
  X, Compass, Inbox, FileText, CheckSquare, TrendingUp, Search, ShieldCheck, GitFork, Lock, Users, Palette,
  Megaphone, Plug, Home, Sparkles, KeyRound, AlertTriangle, Smartphone, LifeBuoy, CalendarCheck,
} from 'lucide-react';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ManualEntry {
  id: string;
  title: string;
  icon: React.ReactNode;
  purpose: string;
  steps: string[];
  tips?: string[];
  watch?: string[];
}

const ic = 'w-4 h-4 text-zinc-600 shrink-0';

// ---------------------------------------------------------------- Manual content
// Keep this list in step with the app: one entry per screen, in menu order.

const MANUAL: ManualEntry[] = [
  {
    id: 'pin',
    title: 'Owner PIN (the black bar)',
    icon: <KeyRound className={ic} />,
    purpose: 'Proves it is you before IMI connects accounts, approves content, posts live, records an outcome or deletes guest data.',
    steps: [
      'Type your PIN in the white box in the black bar and press Unlock.',
      'The bar turns to "Owner actions unlocked for this tab". It stays unlocked until you press Lock, close the tab or refresh.',
      'Press Lock when you step away from the computer.',
    ],
    tips: ['The PIN is checked by the server and is never stored in the browser or the app code.'],
    watch: ['If you forget it, set a new one in Terminal: npx wrangler secret put OWNER_PIN (inside ~/imi-backend).'],
  },
  {
    id: 'home',
    title: 'Home / Today',
    icon: <Home className={ic} />,
    purpose: 'Your daily starting point: what needs attention, fast capture of anything you notice, and a live research feed.',
    steps: [
      'Read the five counters at the top: new evidence, open interpretations, decisions awaiting action, actions awaiting outcomes, lessons for review. Click a counter to jump to that screen.',
      'Operational Intake & Fast Capture: type an observation, piece of evidence, question or outcome. Use a test template if you want an example. Check the suggested type, confidence and origin, then send it to the Inbox.',
      'Live Intelligence Feed: pick a suggested topic or type your own (e.g. "Panthera tigris Tadoba") and press Refresh Feed. Results come from real sources (Mongabay news, GBIF, research databases). No AI is involved.',
      'Press Add to Inbox on any item worth keeping. It arrives in the Inbox for triage, not as a fact.',
      'Optional: paste free eBird and NASA FIRMS keys to add bird sightings and fire alerts to the feed. These keys are saved in this browser only.',
      'Recurring Source Checks: for sources IMI cannot read automatically (your website, Google reviews), press Check Now to open them, then Mark Checked. IMI reminds you when each is due again.',
    ],
    tips: ['Every counter shows only your real data. If a counter is 0, nothing of that kind exists yet.'],
  },
  {
    id: 'inbox',
    title: 'Inbox & Triage',
    icon: <Inbox className={ic} />,
    purpose: 'Everything new lands here first, so nothing becomes "fact" without a human look.',
    steps: [
      'Open an item and read it with its source, source category and evidence weight.',
      'Add or confirm a confidence level with a written reason. A confidence level without a reason is flagged.',
      'Choose an action: Verify Fact (it checks out), Mark Disputed (something contradicts it), Promote to Record (turn it into an Intelligence Record), Archive (keep, no action) or Ignore (not relevant).',
      'Use Claude or ChatGPT only to improve your own wording. They do not decide what is true.',
    ],
    watch: ['News articles are discovery, not proof. Treat them as Media evidence, not Official or Scientific.'],
  },
  {
    id: 'records',
    title: 'Record Workspace',
    icon: <FileText className={ic} />,
    purpose: 'Where an item becomes structured intelligence, with facts and interpretations kept apart.',
    steps: [
      'Select a record from the list.',
      'Green Fact zone: only what was actually observed, with its confidence and reason.',
      'Blue Interpretation zone: what you think it means. It is optional; questions and early patterns may not have one yet.',
      'Add counter-hypotheses: other plausible explanations, each with its own reason.',
      'Use Verify Fact or Mark Disputed to record whether the evidence holds up.',
    ],
    tips: ['If you are unsure, write the uncertainty down. "Unknown" is an honest, valid state in IMI.'],
  },
  {
    id: 'decisions',
    title: 'Decision Review',
    icon: <CheckSquare className={ic} />,
    purpose: 'Decides what Iddav does about a record, including deciding to stay silent.',
    steps: [
      'Press Create Decision. Link the record it is based on, list the options you considered, pick one, and write why.',
      'Record what you are deliberately avoiding and the main risks.',
      'Choose the approval class: A for high risk (wildlife claims, sightings, pricing, controversy), B for brand or campaign, C for routine.',
      'Approve it. Class A asks you to type CONFIRM CLASS A before it locks.',
      'Once approved, press "Create content from this decision" to open Content Studio with a campaign already started.',
    ],
    watch: ['Content Studio only lets AI use facts from approved decisions and the facts you type yourself.'],
  },
  {
    id: 'outcomes',
    title: 'Outcome Review',
    icon: <TrendingUp className={ic} />,
    purpose: 'Records what actually happened after a decision, and what was learned.',
    steps: [
      'Press Create Outcome, or let Content Studio create one for you (see Record outcome under Content Studio).',
      'Compare expected against actual results.',
      'Set attribution confidence with a reason. "Unknown" is correct when no link can be traced.',
      'Write the learning. New learnings start as Provisional and only become Repeated or Established after more outcomes agree.',
    ],
  },
  {
    id: 'ask',
    title: 'Ask the System (preview)',
    icon: <Search className={ic} />,
    purpose: 'Will search past evidence, decisions, outcomes and learnings.',
    steps: [
      'Today this screen shows sample results only, marked with an amber banner. It is not yet connected to your records.',
      'Results are always labelled "Caused this" (a direct predecessor) or "Similar to this" (a parallel, not a cause).',
    ],
    watch: ['Do not quote anything from this screen as Iddav data until the banner is gone.'],
  },
  {
    id: 'studio',
    title: 'Content Studio',
    icon: <Megaphone className={ic} />,
    purpose: 'Turns an approved decision into posters, videos and captions for every channel, then posts and measures them.',
    steps: [
      'Start a campaign: either from Decision Review ("Create content from this decision") or New here. Fill in one objective, how success is measured, audience, call to action, destination link (e.g. https://wa.me/91… or your website), expected outcome and the window in days.',
      'Evidence: link an approved decision and/or type the facts the AI may use. The AI cannot add anything beyond these.',
      'New content: tick the channels. Choose Claude or ChatGPT to write. Choose Your photo (default; tick that Iddav owns it) or AI atmosphere (landscape only, labelled as AI). Press Draft.',
      'Poster: edit the eyebrow and headline (12 words maximum, hook in the first 3 words), pick a template (Bottom, Left, Full Bleed, Dark), then Save poster.',
      'Captions: each channel has its own tab. Edit, or use Rewrite with Claude / Rewrite with ChatGPT with an optional instruction such as "shorter". Use + Add channel to write for another channel later. "Exactly what will be posted" shows the final text, including the tracked link and any AI label.',
      'Make it with another tool: pick Gemini, Google Flow, Runway, Adobe Firefly, Canva, CapCut, ChatGPT or Claude. Let Claude or ChatGPT write the prompt, press Copy prompt & open, sign in there with your own account, create it, then Choose file to bring the video, finished poster or background back. Tick "Made with AI" and, if animals appear, "Shows animals".',
      'With a video attached, choose whether Instagram (Reel), Facebook, Threads and Telegram post the Poster or the Video. YouTube always uses the video.',
      'Approve (PIN needed): Class B for brand content, Class A with a domain review note for wildlife claims or AI media showing animals. Any later edit cancels the approval.',
      'Test first: tick channels and press Test. Nothing goes public. Fix anything red.',
      'Publish live (approval + PIN). Results appear per channel with a link to the live post.',
      'Copy-only channels (WhatsApp Status, Iddav website, Google Ads) and channels you have not connected: copy the text, post it yourself, paste the live link and press Record.',
      'Results from Enquiries: the campaign card shows enquiries, qualified, quoted, booked, room nights and value. When the window ends, press Record outcome, write what you learned, and it is saved to Outcome Review.',
    ],
    tips: [
      'Every channel gets a tracked link. WhatsApp links pre-fill a reference such as "ref CMP-0001-1-IG", so enquiries show which post they came from.',
      'AI use is capped each month (60 images, 600 text drafts) so costs cannot run away.',
    ],
    watch: [
      'AI images never show animals, people or Sri Antra buildings, and are always labelled. Real wildlife must come from your own photos.',
      'Never promise sightings or Core-zone safari access.',
    ],
  },
  {
    id: 'enquiries',
    title: 'Enquiries (CRM)',
    icon: <Users className={ic} />,
    purpose: 'Every guest enquiry from first message to stay, linked back to the campaign that brought it.',
    steps: [
      'Press New enquiry. Add name and phone, how they reached you, and paste their message. If it contains a "ref CMP-…" code, the campaign links automatically. Otherwise choose the campaign (if known) and how you know.',
      'Tick "Agreed to receive Iddav updates" only if the guest actually agreed.',
      'Open an enquiry and press Mark [next step]: Contacted → Qualified → Quoted (enter amount, nights, rooms, estimated contribution) → Booked (value and room nights) → Stayed.',
      'Not going ahead? Press Lost and pick the reason, or Later to follow up on a date. Reopen brings it back.',
      'Set the next step and its date. Quick buttons: Today, Tomorrow, In 3 days, Next week. The menu badge counts follow-ups due today or overdue.',
      'Use the Call and WhatsApp buttons to reply straight from the enquiry. Add notes; every change is kept in the timeline.',
      'Tabs: Follow up (due now), Open, Booked, Closed, All. Search by name, phone or ENQ number.',
    ],
    tips: ['Website enquiries arrive automatically once the enquiry form is added to iddavwildstay.com.'],
    watch: [
      'Guest details are never sent to Claude or ChatGPT.',
      'Delete personal data (PIN) erases a guest’s name, phone and messages but keeps the anonymous booking numbers.',
    ],
  },
  {
    id: 'connections',
    title: 'Connections',
    icon: <Plug className={ic} />,
    purpose: 'One place to connect Iddav’s accounts and AI writers. Each card has steps, a Check button and a manual fallback.',
    steps: [
      'Unlock with your PIN, open a card and press Connect (or Reconnect / edit).',
      'Follow the numbered steps on the card. Form platforms (Telegram, Facebook + Instagram, WhatsApp Business, Claude, ChatGPT): paste the details and press Connect. Sign-in platforms (Threads, LinkedIn, Google): copy the Redirect URI into that platform’s developer app once, then press Sign in.',
      'If the card offers choices (your Facebook Page, your Google listing), press Use on the right one.',
      'Press Check any time to confirm a connection still works. A green tick means ready; amber means it needs attention.',
      'Ads inside AI tools: choose a campaign and an ad source (ChatGPT Ads, Meta Ads, Google Ads) to get a tracked link to paste into that ad manager.',
    ],
    tips: [
      'Easiest first: Telegram (3 minutes), Claude and ChatGPT (2 minutes each), then Facebook + Instagram.',
      'Google Business Profile, LinkedIn Company Page and WhatsApp templates need approval from those platforms first.',
    ],
    watch: ['Saved tokens are encrypted. Disconnect makes IMI forget them.'],
  },
  {
    id: 'header',
    title: 'Top bar tools',
    icon: <Smartphone className={ic} />,
    purpose: 'Quick tools available on every screen.',
    steps: [
      'Mobile Viewport: previews IMI at phone width, to check how it looks on a mobile.',
      'Create Poster: Claude opens your Iddav Perspective Poster Studio, and ChatGPT opens chatgpt.com, both in a new tab. For drafting, approving and posting inside IMI, use Content Studio instead.',
      'Role: switches what the screens show for each role (Owner/Admin, Research Editor, Property Contributor, Reservations). The real protection for owner actions is the PIN.',
      'Help: opens this guide.',
    ],
  },
];

const DAILY = [
  'Enquiries → Follow up: reply to everything due or overdue.',
  'Home: glance at the counters; capture anything you noticed in the field.',
  'Inbox: triage new items (verify, promote, archive or ignore).',
  'Content Studio: check any campaign whose window has ended and record its outcome.',
  'Connections (weekly): press Check on each card.',
];

const TROUBLE: { q: string; a: string }[] = [
  { q: 'A red banner says IMI could not load data.', a: 'The backend could not be reached. Refresh the page. If it stays, the Worker may need redeploying from ~/imi-backend with npx wrangler deploy.' },
  { q: 'Approve or Publish is greyed out.', a: 'Unlock with your PIN first. Publish also needs a saved poster and a valid approval; editing anything after approving cancels the approval.' },
  { q: 'A test shows "not connected".', a: 'Open Connections and connect that platform, or post it yourself and use Record with the live link.' },
  { q: 'Draft with Claude/ChatGPT is greyed out.', a: 'Connect Claude or ChatGPT on the Connections screen.' },
  { q: 'The AI says the evidence is thin.', a: 'Link an approved decision or add more true facts to the campaign. Approving a thin-evidence draft needs an extra acknowledgement.' },
  { q: 'An Instagram or Facebook test fails on the image.', a: 'Save the poster again. Imported finished posters must be JPEG.' },
  { q: 'A YouTube upload stays Private.', a: 'Google keeps API uploads private until your Google project passes YouTube’s audit. Make it public in YouTube Studio.' },
];

// ---------------------------------------------------------------- Component

export const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'guide' | 'manual'>('guide');
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!term) return MANUAL;
    return MANUAL.filter((m) =>
      [m.title, m.purpose, ...m.steps, ...(m.tips || []), ...(m.watch || [])].join(' ').toLowerCase().includes(term)
    );
  }, [term]);

  const troubleShown = TROUBLE.filter((t) => !term || 'troubleshooting problem error'.includes(term) || `${t.q} ${t.a}`.toLowerCase().includes(term));

  if (!isOpen) return null;

  const jump = (id: string) => document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="IMI Help">
      <div className="bg-white border border-zinc-300 rounded shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="bg-zinc-900 text-white px-5 py-3 flex items-center gap-3 border-b border-zinc-800 rounded-t">
          <Compass className="w-4 h-4" />
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider">IMI Help</h2>
          <div className="inline-flex rounded border border-zinc-700 overflow-hidden ml-2">
            {(['guide', 'manual'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs font-mono ${tab === t ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                {t === 'guide' ? 'Quick guide' : 'User manual'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800" aria-label="Close help">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 text-sm text-zinc-800">
          {tab === 'guide' ? (
            <div className="space-y-6">
              <section className="space-y-1.5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">What IMI is</h3>
                <p className="leading-relaxed">
                  Iddav Marketing Intelligence is the workspace that turns what Iddav observes into decisions, content,
                  enquiries and bookings, and then learns from the results. Its strict rule: observed facts and
                  interpretations are kept apart, every confidence level carries a written reason, and nothing is
                  presented as Iddav data unless it is.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">The full loop</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    '1. Capture an observation or evidence on Home; it lands in the Inbox.',
                    '2. Triage it: verify, promote to a Record, archive or ignore.',
                    '3. Record Workspace keeps the facts separate from the interpretation.',
                    '4. Decision Review: decide (including "stay silent") and approve.',
                    '5. Content Studio: Claude or ChatGPT drafts from approved facts only; you approve, test and post.',
                    '6. Enquiries: guests arrive via tracked links; move each from enquiry to stay.',
                    '7. Record outcome: real enquiry and booking numbers go into Outcome Review.',
                    '8. The lesson you write starts as Provisional and strengthens only with repeated results.',
                  ].map((s) => <div key={s} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded leading-snug">{s}</div>)}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">New in this version</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: <Megaphone className={ic} />, t: 'Content Studio', d: 'Campaigns, brand posters, a caption per channel, Claude or ChatGPT drafting, outside creative tools, approval, test and publish.' },
                    { icon: <Users className={ic} />, t: 'Enquiries', d: 'The CRM inside IMI: enquiry → quote → booking → stay, with follow-up reminders and automatic campaign linking.' },
                    { icon: <Plug className={ic} />, t: 'Connections', d: 'Facebook, Instagram, Threads, LinkedIn, Google Business, YouTube, Telegram, WhatsApp, Claude and ChatGPT in one place.' },
                    { icon: <KeyRound className={ic} />, t: 'Owner PIN', d: 'Needed to connect, approve, publish, record outcomes and delete guest data.' },
                    { icon: <Sparkles className={ic} />, t: 'Real data only', d: 'Screens show only your own records. Ask the System is marked as a preview until it searches your data.' },
                    { icon: <Palette className={ic} />, t: 'Create from a decision', d: 'An approved decision now has a button that starts a campaign in Content Studio.' },
                  ].map((x) => (
                    <div key={x.t} className="flex gap-3 p-3 border border-zinc-200 rounded">
                      {x.icon}
                      <div><span className="font-bold text-zinc-900 block text-xs">{x.t}</span><p className="text-xs text-zinc-600 leading-relaxed">{x.d}</p></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Rules built into IMI</h3>
                {[
                  { icon: <ShieldCheck className={ic} />, t: 'Confidence + stated reason', d: 'Every High / Medium / Low / Unknown carries a written reason. "Unknown" is an honest, valid answer.' },
                  { icon: <GitFork className={ic} />, t: 'Retrospective marker', d: 'Each record shows whether it was logged at decision time or reconstructed afterwards.' },
                  { icon: <Lock className={ic} />, t: 'Approval classes', d: 'A: high risk (wildlife claims, sightings, pricing, AI media showing animals) with domain review. B: brand and campaigns. C: routine. Content approval is tied to the exact text and images; any edit cancels it.' },
                  { icon: <AlertTriangle className={ic} />, t: 'Real material stays real', d: 'Your own photos come first. AI images and videos are always labelled "Made with AI" and never pass as real wildlife or a real Sri Antra moment. No promised sightings.' },
                  { icon: <Users className={ic} />, t: 'Guest privacy', d: 'Guest details stay in Enquiries, are never sent to AI, and can be erased on request.' },
                ].map((x) => (
                  <div key={x.t} className="flex gap-3 p-3 border border-zinc-200 rounded">
                    {x.icon}
                    <div><span className="font-bold text-zinc-900 block text-xs">{x.t}</span><p className="text-xs text-zinc-600 leading-relaxed">{x.d}</p></div>
                  </div>
                ))}
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5" /> A good daily routine</h3>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-zinc-700">{DAILY.map((d) => <li key={d}>{d}</li>)}</ol>
              </section>

              <button onClick={() => setTab('manual')} className="w-full p-3 bg-zinc-900 text-white rounded text-xs font-mono hover:bg-zinc-800">
                Open the screen-by-screen user manual →
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-zinc-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the manual, e.g. approve, Telegram, outcome"
                  className="w-full border border-zinc-300 rounded pl-7 pr-2 py-1.5 text-sm focus:outline-none focus:border-zinc-900" />
              </div>
              {!term && (
                <div className="flex flex-wrap gap-1">
                  {MANUAL.map((m) => (
                    <button key={m.id} onClick={() => jump(m.id)} className="text-[11px] font-mono px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-100">{m.title}</button>
                  ))}
                  <button onClick={() => jump('trouble')} className="text-[11px] font-mono px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-100">Troubleshooting</button>
                </div>
              )}

              {filtered.length === 0 && troubleShown.length === 0 && <p className="text-xs text-zinc-500">Nothing matches “{q}”.</p>}

              {filtered.map((m) => (
                <section key={m.id} id={`help-${m.id}`} className="border border-zinc-200 rounded p-4 space-y-2 scroll-mt-4">
                  <div className="flex items-center gap-2">{m.icon}<h3 className="font-bold text-zinc-900">{m.title}</h3></div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{m.purpose}</p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs text-zinc-800 leading-relaxed">{m.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                  {m.tips && m.tips.length > 0 && (
                    <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 rounded p-2 space-y-1">
                      {m.tips.map((t) => <p key={t}><span className="font-bold">Tip: </span>{t}</p>)}
                    </div>
                  )}
                  {m.watch && m.watch.length > 0 && (
                    <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded p-2 space-y-1">
                      {m.watch.map((t) => <p key={t}><span className="font-bold">Watch out: </span>{t}</p>)}
                    </div>
                  )}
                </section>
              ))}

              {troubleShown.length > 0 && (
                <section id="help-trouble" className="border border-zinc-200 rounded p-4 space-y-2 scroll-mt-4">
                  <div className="flex items-center gap-2"><LifeBuoy className={ic} /><h3 className="font-bold text-zinc-900">Troubleshooting</h3></div>
                  <div className="space-y-2">
                    {troubleShown.map((t) => (
                      <div key={t.q} className="text-xs"><p className="font-bold text-zinc-900">{t.q}</p><p className="text-zinc-600">{t.a}</p></div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
