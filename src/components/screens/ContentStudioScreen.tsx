import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Megaphone, Plus, Sparkles, Upload, Image as ImageIcon, Save, ShieldCheck, FlaskConical, Send, CheckCircle2, XCircle,
  ExternalLink, Download, AlertTriangle, Link2, Film, Share2, Wand2, Copy, RefreshCw,
} from 'lucide-react';
import { api, mediaUrl, label, useOwnerPin, takePendingDecision } from '../../api';
import { OwnerPinBar } from '../common/OwnerPinBar';
import { renderPoster, canvasToJpeg, posterWordCount, TEMPLATE_LABELS, type PosterTemplate } from '../../posterCanvas';

interface Options {
  objectives: string[]; metrics: string[]; ctaTypes: string[]; segments: string[]; templates: PosterTemplate[];
  channels: { id: string; connection: string | null; connected: boolean; copyOnly: boolean }[];
  creativeTools: { id: string; name: string; url: string; makes: string[]; note: string }[];
  aiProviders: { claude: boolean; chatgpt: boolean };
  approvedDecisions: { code: string; title: string }[];
  ownerPinSet: boolean; aiDisclosure: string;
}
interface Campaign {
  id: string; code: string; name: string; objective: string; primaryMetric: string; audience: string[]; ctaType: string;
  destinationUrl: string; ownerFacts: string; decisionCode?: string; expectedOutcome: string; outcomeWindowDays: number; seriesLabel: string;
}
interface Asset { id: string; key: string; kind: string; authenticity: string; credit: string }
interface PubResult { ok: boolean; dryRun: boolean; message: string; permalink?: string; at?: string }
interface Publication {
  id: string; channel: string; caption: string; hashtags: string[]; title: string; trackedUrl: string; finalText: string;
  status: 'draft' | 'tested' | 'published' | 'failed'; method: string | null; permalink: string | null; publishedAt: string | null; lastResult?: PubResult;
  extra: { headlines?: string[]; descriptions?: string[]; metaDescription?: string }; copyOnly: boolean; canPostVideo: boolean;
}
interface Content {
  id: string; campaignCode: string; seriesNumber: number; template: PosterTemplate; eyebrow: string; headline: string; wordCount: number;
  imagePrompt: string; backgroundAuthenticity: string; background: Asset | null; poster: Asset | null; video: Asset | null;
  copyProvider: string; copyModel: string; evidenceIdsUsed: string[]; insufficientEvidence: boolean; aiNotes: string; status: string;
  mediaMode: 'poster' | 'video'; aiMediaTool: string | null; requiresClassA: boolean; posterSource: 'composed' | 'imported';
  approval: { approvalClass: string; approvedBy: string; approvedAt: string; note: string; valid: boolean } | null;
  publications: Publication[];
}

interface Funnel {
  window: { start: string | null; end: string | null; closed: boolean };
  published: number;
  totals: { enquiries: number; tracked: number; qualified: number; quoted: number; booked: number; lost: number; roomNights: number;
    bookedValue: number; contribution: number; contributionKnown: boolean; medianFirstReplyHours: number | null };
  byChannel: Record<string, { enquiries: number; booked: number; bookedValue: number }>;
  topLossReason: string | null;
}

const panel = 'bg-white border border-zinc-300 rounded p-4';
const lbl = 'block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1';
const input = 'w-full border border-zinc-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-900 disabled:bg-zinc-100';
const btn = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border disabled:opacity-40 disabled:cursor-not-allowed';
const btnDark = `${btn} bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800`;
const btnLight = `${btn} bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100`;
const chip = (tone: string) => `text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${tone}`;
const STATUS_TONE: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600', tested: 'bg-sky-100 text-sky-800', published: 'bg-emerald-100 text-emerald-800', failed: 'bg-red-100 text-red-800',
};

const emptyCampaign = {
  name: '', objective: '', primaryMetric: '', audience: [] as string[], ctaType: 'whatsapp', destinationUrl: '',
  ownerFacts: '', decisionCode: '', expectedOutcome: '', outcomeWindowDays: 14, seriesLabel: '',
};

async function uploadFile(file: File, credit: string): Promise<Asset> {
  return api<Asset>(`/api/assets?authenticity=original&rightsConfirmed=true&credit=${encodeURIComponent(credit)}&filename=${encodeURIComponent(file.name)}`, {
    method: 'POST', body: file, raw: true, headers: { 'Content-Type': file.type },
  });
}

export const ContentStudioScreen: React.FC = () => {
  const pin = useOwnerPin();
  const [opts, setOpts] = useState<Options | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [contents, setContents] = useState<Content[]>([]);
  const [contentId, setContentId] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState(emptyCampaign);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  // New-content form
  const [channels, setChannels] = useState<string[]>(['instagram', 'facebook']);
  const [provider, setProvider] = useState<'claude' | 'chatgpt'>('claude');
  const [bgMode, setBgMode] = useState<'upload' | 'ai'>('upload');
  const [photo, setPhoto] = useState<File | null>(null);
  const [credit, setCredit] = useState('Rama Krishna Vaddi');
  const [rights, setRights] = useState(false);
  const [newTemplate, setNewTemplate] = useState<PosterTemplate>('bottom');

  // Editing the selected content
  const [poster, setPoster] = useState({ eyebrow: '', headline: '', template: 'bottom' as PosterTemplate });
  const [caps, setCaps] = useState<Record<string, { caption: string; hashtags: string; title: string; headlines: string; descriptions: string; metaDescription: string }>>({});
  const [instr, setInstr] = useState('');
  const [addCh, setAddCh] = useState('');
  const [tool, setTool] = useState('gemini');
  const [brief, setBrief] = useState<{ id: string; toolName: string; url: string; prompt: string } | null>(null);
  const [imp, setImp] = useState({ use: 'video', ai: true, animals: false });
  const [tab, setTab] = useState('');
  const [approval, setApproval] = useState({ cls: 'B', note: '', review: '', ack: false });
  const [targets, setTargets] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, PubResult>>({});
  const [manualLink, setManualLink] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [closing, setClosing] = useState(false);
  const [lesson, setLesson] = useState({ learning: '', qualitative: '' });
  const [outcomeMsg, setOutcomeMsg] = useState('');

  const campaign = campaigns.find((c) => c.id === campaignId);
  const content = contents.find((c) => c.id === contentId);
  const published = content?.publications.some((p) => p.status === 'published') ?? false;
  const words = posterWordCount(poster.eyebrow, poster.headline);
  const posterDirty = !!content && (poster.eyebrow !== content.eyebrow || poster.headline !== content.headline || poster.template !== content.template);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  };

  useEffect(() => {
    run('load', async () => {
      const [o, cs] = await Promise.all([api<Options>('/api/studio/options'), api<Campaign[]>('/api/campaigns')]);
      setOpts(o); setCampaigns(cs);
      if (cs[0]) setCampaignId(cs[0].id);
      setProvider(o.aiProviders.claude ? 'claude' : 'chatgpt');
      const pending = takePendingDecision();
      if (pending) {
        setShowNew(true);
        setDraft((d) => ({ ...d, decisionCode: pending.code, name: pending.title.slice(0, 80) }));
      }
    });
  }, []);

  const loadContents = useCallback(async (keep?: string) => {
    if (!campaignId) return;
    const list = await api<Content[]>(`/api/campaigns/${campaignId}/contents`);
    setContents(list);
    setContentId(keep && list.some((c) => c.id === keep) ? keep : list[0]?.id || '');
  }, [campaignId]);

  useEffect(() => { run('contents', () => loadContents()); }, [loadContents]);
  useEffect(() => {
    setFunnel(null); setOutcomeMsg(''); setClosing(false);
    if (campaignId) api<Funnel>(`/api/campaigns/${campaignId}/funnel`).then(setFunnel).catch(() => {});
  }, [campaignId, contents]);

  const closeOutcome = () => run('outcome', async () => {
    const r = await api<{ code: string; interim: boolean }>(`/api/campaigns/${campaignId}/outcome`, { method: 'POST', body: JSON.stringify(lesson) });
    setOutcomeMsg(`Saved as ${r.code}${r.interim ? ' (interim — the window is still open)' : ''}. It is now in Outcome Review.`);
    setClosing(false); setLesson({ learning: '', qualitative: '' });
  });

  const replace = (c: Content) => setContents((prev) => prev.map((x) => (x.id === c.id ? c : x)));

  // Sync edit state when the selected content changes on the server.
  useEffect(() => {
    if (!content) return;
    setPoster({ eyebrow: content.eyebrow, headline: content.headline, template: content.template });
    const m: typeof caps = {};
    for (const p of content.publications) {
      m[p.channel] = {
        caption: p.caption, hashtags: p.hashtags.join(' '), title: p.title,
        headlines: (p.extra?.headlines || []).join('\n'), descriptions: (p.extra?.descriptions || []).join('\n'), metaDescription: p.extra?.metaDescription || '',
      };
    }
    setCaps(m);
    setTab((t) => (content.publications.some((p) => p.channel === t) ? t : content.publications[0]?.channel || ''));
    setTargets(content.publications.filter((p) => p.status !== 'published' && !p.copyOnly).map((p) => p.channel));
    if (content.requiresClassA) setApproval((a) => ({ ...a, cls: 'A' }));
    const r: Record<string, PubResult> = {};
    for (const p of content.publications) if (p.lastResult) r[p.channel] = p.lastResult;
    setResults(r);
  }, [content]);

  // Live poster preview
  useEffect(() => {
    if (!content || !canvasRef.current) return;
    renderPoster(canvasRef.current, {
      backgroundUrl: content.background ? mediaUrl(content.background.key) : undefined,
      template: poster.template, eyebrow: poster.eyebrow, headline: poster.headline,
      seriesLabel: `${campaign?.seriesLabel || campaign?.name || ''} · Nº ${String(content.seriesNumber).padStart(2, '0')}`,
      aiDisclosure: content.backgroundAuthenticity === 'ai_generated',
    }).catch((e) => setError(e.message));
  }, [content, poster, campaign]);

  // ---------------------------------------------------------------- actions

  const createCampaign = () => run('create', async () => {
    const c = await api<Campaign>('/api/campaigns', { method: 'POST', body: JSON.stringify({ ...draft, decisionCode: draft.decisionCode || undefined }) });
    setCampaigns((p) => [c, ...p]); setCampaignId(c.id); setShowNew(false); setDraft(emptyCampaign);
  });

  const generate = () => run('generate', async () => {
    let backgroundAssetId: string | undefined;
    if (bgMode === 'upload') {
      if (!photo) throw new Error('Choose a photo, or switch to an AI atmosphere background.');
      if (!rights) throw new Error('Confirm Iddav owns or has rights to this photo.');
      backgroundAssetId = (await uploadFile(photo, credit)).id;
    }
    const c = await api<Content>(`/api/campaigns/${campaignId}/contents`, {
      method: 'POST',
      body: JSON.stringify({ provider, channels, template: newTemplate, backgroundAssetId, aiBackground: bgMode === 'ai' }),
    });
    setContents((p) => [c, ...p]); setContentId(c.id); setPhoto(null); setRights(false);
  });

  const swapBackground = (file?: File) => run('bg', async () => {
    if (!content) return;
    let body: Record<string, string> = {};
    if (file) {
      if (!window.confirm('Confirm Iddav owns or has rights to this photo.')) return;
      body = { assetId: (await uploadFile(file, credit)).id };
    }
    replace(await api<Content>(`/api/contents/${content.id}/background`, { method: 'POST', body: JSON.stringify(body) }));
  });

  const savePoster = () => run('poster', async () => {
    if (!content || !canvasRef.current) return;
    if (posterDirty) {
      await api<Content>(`/api/contents/${content.id}`, { method: 'PATCH', body: JSON.stringify(poster) });
      await new Promise((r) => setTimeout(r, 50));
    }
    const blob = await canvasToJpeg(canvasRef.current);
    replace(await api<Content>(`/api/contents/${content.id}/poster`, { method: 'PUT', body: blob, raw: true, headers: { 'Content-Type': 'image/jpeg' } }));
  });

  const saveCaption = (p: Publication) => run(`cap-${p.channel}`, async () => {
    const v = caps[p.channel];
    replace(await api<Content>(`/api/publications/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        caption: v.caption, hashtags: v.hashtags.split(/\s+/).filter(Boolean), title: v.title,
        ...(p.channel === 'google_ads' ? { headlines: v.headlines.split('\n').map((x) => x.trim()).filter(Boolean), descriptions: v.descriptions.split('\n').map((x) => x.trim()).filter(Boolean) } : {}),
        ...(p.channel === 'website' ? { metaDescription: v.metaDescription } : {}),
      }),
    }));
  });

  const rewrite = (p: Publication, who: 'claude' | 'chatgpt') => run(`rw-${p.channel}`, async () => {
    replace(await api<Content>(`/api/publications/${p.id}/rewrite`, { method: 'POST', body: JSON.stringify({ provider: who, instruction: instr }) }));
    setInstr('');
  });

  const addChannel = () => run('addch', async () => {
    if (!content || !addCh) return;
    const c = await api<Content>(`/api/contents/${content.id}/channels`, { method: 'POST', body: JSON.stringify({ channel: addCh, provider }) });
    replace(c); setTab(addCh); setAddCh('');
  });

  const makeBrief = (who: 'claude' | 'chatgpt') => run('brief', async () => {
    if (!content) return;
    const t = opts?.creativeTools.find((x) => x.id === tool);
    const b = await api<{ id: string; toolName: string; url: string; prompt: string }>(`/api/contents/${content.id}/creative-brief`, {
      method: 'POST', body: JSON.stringify({ tool, provider: who, kind: t?.makes[0] }),
    });
    setBrief(b);
    const isAi = !['canva', 'capcut'].includes(tool);
    setImp({ use: t?.makes[0] === 'video' ? 'video' : t?.makes[0] === 'design' ? 'poster' : 'background', ai: isAi, animals: false });
  });

  const importFile = (file: File) => run('import', async () => {
    if (!content) return;
    if (!imp.ai && !window.confirm('Confirm Iddav owns or has rights to this file.')) return;
    const qs = new URLSearchParams({ tool, use: imp.use, ai: String(imp.ai), showsAnimals: String(imp.animals), filename: file.name, ...(brief ? { briefId: brief.id } : {}) });
    replace(await api<Content>(`/api/contents/${content.id}/import?${qs}`, { method: 'POST', body: file, raw: true, headers: { 'Content-Type': file.type } }));
  });

  const setMode = (mode: 'poster' | 'video') => run('mode', async () => {
    if (!content) return;
    replace(await api<Content>(`/api/contents/${content.id}/media-mode`, { method: 'POST', body: JSON.stringify({ mode }) }));
  });

  const attachVideo = (file: File) => run('video', async () => {
    if (!content) return;
    if (!window.confirm('Confirm Iddav owns or has rights to this video.')) return;
    const a = await uploadFile(file, credit);
    replace(await api<Content>(`/api/contents/${content.id}/video`, { method: 'POST', body: JSON.stringify({ assetId: a.id }) }));
  });

  const approve = () => run('approve', async () => {
    if (!content) return;
    replace(await api<Content>(`/api/contents/${content.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvalClass: approval.cls, note: approval.note, domainReviewNote: approval.review, acknowledgeThinEvidence: approval.ack }),
    }));
  });

  const publish = (dryRun: boolean) => run(dryRun ? 'test' : 'publish', async () => {
    if (!content) return;
    if (!dryRun && !window.confirm(`Publish live to ${targets.map(label).join(', ')}? This cannot be undone from IMI.`)) return;
    const d = await api<{ results: ({ channel: string } & PubResult)[]; content: Content }>(`/api/contents/${content.id}/publish`, {
      method: 'POST', body: JSON.stringify({ channels: targets, dryRun }),
    });
    replace(d.content);
    setResults((r) => { const n = { ...r }; for (const x of d.results) n[x.channel] = x; return n; });
  });

  const recordManual = (p: Publication) => run(`manual-${p.channel}`, async () => {
    replace(await api<Content>(`/api/publications/${p.id}/manual`, { method: 'POST', body: JSON.stringify({ permalink: manualLink }) }));
    setManualLink('');
  });

  const download = async () => {
    if (!canvasRef.current || !content) return;
    const blob = await canvasToJpeg(canvasRef.current);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `iddav-${content.campaignCode.toLowerCase()}-${content.seriesNumber}.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (!opts) {
    return <div className="text-sm text-zinc-600">{error || 'Loading Content Studio…'}</div>;
  }

  const activePub = content?.publications.find((p) => p.channel === tab);
  const connectedOf = (ch: string) => opts.channels.find((c) => c.id === ch)?.connected ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Megaphone className="w-5 h-5 text-zinc-900" />
        <h1 className="text-lg font-bold text-zinc-900">Content Studio</h1>
        <span className="text-xs font-mono text-zinc-500">evidence → draft → approve → test → publish → outcome</span>
      </div>
      <OwnerPinBar />
      {error && <div className="border border-red-300 bg-red-50 text-red-800 text-xs rounded p-2">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-4">
        {/* ---------------- Campaigns */}
        <div className={`${panel} space-y-2 h-fit`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Campaigns</span>
            <button className={btnLight} onClick={() => setShowNew((s) => !s)}><Plus className="w-3.5 h-3.5" /> New</button>
          </div>

          {showNew && (
            <div className="space-y-2 border border-zinc-200 rounded p-2 bg-zinc-50">
              <div><span className={lbl}>Name</span><input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div>
                <span className={lbl}>One primary objective</span>
                <select className={input} value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })}>
                  <option value="">Choose…</option>{opts.objectives.map((o) => <option key={o} value={o}>{label(o)}</option>)}
                </select>
              </div>
              <div>
                <span className={lbl}>Success is measured by</span>
                <select className={input} value={draft.primaryMetric} onChange={(e) => setDraft({ ...draft, primaryMetric: e.target.value })}>
                  <option value="">Choose…</option>{opts.metrics.map((o) => <option key={o} value={o}>{label(o)}</option>)}
                </select>
              </div>
              <div>
                <span className={lbl}>Audience</span>
                <div className="flex flex-wrap gap-1">
                  {opts.segments.map((s) => (
                    <button key={s} type="button" onClick={() => setDraft({ ...draft, audience: toggle(draft.audience, s) })}
                      className={`text-[11px] px-1.5 py-0.5 rounded border ${draft.audience.includes(s) ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-300'}`}>{label(s)}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={lbl}>Call to action</span>
                  <select className={input} value={draft.ctaType} onChange={(e) => setDraft({ ...draft, ctaType: e.target.value })}>
                    {opts.ctaTypes.map((o) => <option key={o} value={o}>{label(o)}</option>)}
                  </select>
                </div>
                <div>
                  <span className={lbl}>Window (days)</span>
                  <input type="number" min={1} max={180} className={input} value={draft.outcomeWindowDays} onChange={(e) => setDraft({ ...draft, outcomeWindowDays: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <span className={lbl}>Destination link</span>
                <input className={input} placeholder="https://wa.me/91XXXXXXXXXX or https://iddavwildstay.com/…" value={draft.destinationUrl} onChange={(e) => setDraft({ ...draft, destinationUrl: e.target.value })} />
              </div>
              <div>
                <span className={lbl}>Expected outcome (before publishing)</span>
                <input className={input} placeholder="e.g. 8 qualified WhatsApp enquiries in 14 days" value={draft.expectedOutcome} onChange={(e) => setDraft({ ...draft, expectedOutcome: e.target.value })} />
              </div>
              <div>
                <span className={lbl}>Evidence: approved decision</span>
                <select className={input} value={draft.decisionCode} onChange={(e) => setDraft({ ...draft, decisionCode: e.target.value })}>
                  <option value="">None</option>{opts.approvedDecisions.map((d) => <option key={d.code} value={d.code}>{d.code} — {d.title}</option>)}
                </select>
              </div>
              <div>
                <span className={lbl}>Facts the AI may use (your words)</span>
                <textarea className={input} rows={3} placeholder="Only true, current facts. The AI cannot add anything beyond these and the linked decision." value={draft.ownerFacts} onChange={(e) => setDraft({ ...draft, ownerFacts: e.target.value })} />
              </div>
              <div><span className={lbl}>Series label</span><input className={input} value={draft.seriesLabel} onChange={(e) => setDraft({ ...draft, seriesLabel: e.target.value })} /></div>
              <button className={btnDark} onClick={createCampaign} disabled={busy === 'create'}>Create campaign</button>
            </div>
          )}

          {campaigns.length === 0 && !showNew && <p className="text-xs text-zinc-500">No campaigns yet.</p>}
          {campaigns.map((c) => (
            <button key={c.id} onClick={() => setCampaignId(c.id)}
              className={`w-full text-left p-2 rounded border text-xs ${c.id === campaignId ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:bg-zinc-50'}`}>
              <div className="font-mono text-[10px] opacity-70">{c.code}</div>
              <div className="font-bold">{c.name}</div>
              <div className={c.id === campaignId ? 'text-zinc-300' : 'text-zinc-500'}>{label(c.objective)} · {label(c.primaryMetric)}</div>
            </button>
          ))}
        </div>

        {/* ---------------- Workspace */}
        {!campaign ? <div className={`${panel} text-sm text-zinc-600`}>Create or select a campaign.</div> : (
          <div className="space-y-4 min-w-0">
            <div className={`${panel} text-xs text-zinc-700 grid grid-cols-1 md:grid-cols-3 gap-2`}>
              <div><span className={lbl}>Objective / metric</span>{label(campaign.objective)} → {label(campaign.primaryMetric)}</div>
              <div><span className={lbl}>Expected within {campaign.outcomeWindowDays} days</span>{campaign.expectedOutcome}</div>
              <div><span className={lbl}>Evidence</span>{[campaign.decisionCode, campaign.ownerFacts ? 'owner facts' : ''].filter(Boolean).join(' + ') || '—'}</div>
            </div>

            {funnel && (
              <div className={`${panel} space-y-2`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Results from Enquiries</span>
                  <span className="text-[11px] text-zinc-500">
                    {funnel.window.start ? `Window ${funnel.window.start} → ${funnel.window.end}${funnel.window.closed ? ' (closed)' : ''}` : 'Starts when the first post goes live'}
                  </span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
                  {[
                    ['Enquiries', `${funnel.totals.enquiries}`, `${funnel.totals.tracked} tracked`],
                    ['Qualified', `${funnel.totals.qualified}`, ''],
                    ['Quoted', `${funnel.totals.quoted}`, ''],
                    ['Booked', `${funnel.totals.booked}`, `${funnel.totals.lost} lost`],
                    ['Room nights', `${funnel.totals.roomNights}`, ''],
                    ['Booked value', `₹${Math.round(funnel.totals.bookedValue).toLocaleString('en-IN')}`, funnel.totals.contributionKnown ? `≈ ₹${Math.round(funnel.totals.contribution).toLocaleString('en-IN')} contribution` : 'contribution not entered'],
                  ].map(([k, v, sub]) => (
                    <div key={k} className="border border-zinc-200 rounded p-2">
                      <div className="text-lg font-bold text-zinc-900">{v}</div>
                      <div className="text-[10px] font-mono uppercase text-zinc-500">{k}</div>
                      {sub && <div className="text-[10px] text-zinc-400">{sub}</div>}
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-zinc-500 flex flex-wrap gap-x-4">
                  {Object.entries(funnel.byChannel).map(([ch, v]) => <span key={ch}>{label(ch)}: {v.enquiries} enq · {v.booked} booked</span>)}
                  {funnel.totals.medianFirstReplyHours !== null && <span>Median first reply: {funnel.totals.medianFirstReplyHours} h</span>}
                  {funnel.topLossReason && <span>Most common loss: {funnel.topLossReason.replace('_', ' ')}</span>}
                </div>
                {outcomeMsg && <div className="text-xs text-emerald-800">{outcomeMsg}</div>}
                {!closing ? (
                  <button className={btnLight} onClick={() => setClosing(true)} disabled={!pin}>
                    {pin ? (funnel.window.closed ? 'Record outcome in IMI' : 'Record interim outcome in IMI') : 'Unlock with PIN to record the outcome'}
                  </button>
                ) : (
                  <div className="space-y-2 border border-zinc-200 rounded p-2 bg-zinc-50">
                    <p className="text-[11px] text-zinc-600">IMI fills in the numbers and attribution confidence from Enquiries. The lesson must be yours.</p>
                    <textarea className={input} rows={2} placeholder="What did we learn? (required)" value={lesson.learning} onChange={(e) => setLesson({ ...lesson, learning: e.target.value })} />
                    <textarea className={input} rows={2} placeholder="What guests said, objections, surprises (optional)" value={lesson.qualitative} onChange={(e) => setLesson({ ...lesson, qualitative: e.target.value })} />
                    <div className="flex gap-2">
                      <button className={btnDark} onClick={closeOutcome} disabled={!!busy || !lesson.learning.trim()}>Save outcome</button>
                      <button className={btnLight} onClick={() => setClosing(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* New content */}
            <div className={`${panel} space-y-3`}>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">New content</span>
              <div>
                <span className={lbl}>Channels (each gets its own caption)</span>
                <div className="flex flex-wrap gap-2">
                  {opts.channels.map((c) => (
                    <label key={c.id} className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={channels.includes(c.id)} onChange={() => setChannels(toggle(channels, c.id))} />
                      {label(c.id)}{!c.connected && <span className="text-zinc-400">(manual)</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className={lbl}>Writer</span>
                  <div className="flex gap-1">
                    {(['claude', 'chatgpt'] as const).map((p) => (
                      <button key={p} onClick={() => setProvider(p)} disabled={!opts.aiProviders[p]} className={provider === p ? btnDark : btnLight}>
                        {p === 'claude' ? 'Claude' : 'ChatGPT'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className={lbl}>Template</span>
                  <select className={input} value={newTemplate} onChange={(e) => setNewTemplate(e.target.value as PosterTemplate)}>
                    {opts.templates.map((t) => <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <span className={lbl}>Background</span>
                  <div className="flex gap-1">
                    <button onClick={() => setBgMode('upload')} className={bgMode === 'upload' ? btnDark : btnLight}><Upload className="w-3.5 h-3.5" /> Your photo</button>
                    <button onClick={() => setBgMode('ai')} disabled={!opts.aiProviders.chatgpt} className={bgMode === 'ai' ? btnDark : btnLight}><ImageIcon className="w-3.5 h-3.5" /> AI atmosphere</button>
                  </div>
                </div>
              </div>
              {bgMode === 'upload' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="text-xs" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                  <div><span className={lbl}>Photo credit</span><input className={input} value={credit} onChange={(e) => setCredit(e.target.value)} /></div>
                  <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /> Iddav owns or has rights to this photo</label>
                </div>
              ) : (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                  AI backgrounds show landscape and atmosphere only (no animals, people or buildings) and are labelled "AI-generated" on the poster and in every caption, so they are never mistaken for a real Sri Antra moment.
                </p>
              )}
              <button className={btnDark} onClick={generate} disabled={!!busy || !channels.length}>
                <Sparkles className="w-3.5 h-3.5" /> {busy === 'generate' ? 'Drafting from your evidence… (20–60s)' : `Draft with ${provider === 'claude' ? 'Claude' : 'ChatGPT'}`}
              </button>
            </div>

            {contents.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contents.map((c) => (
                  <button key={c.id} onClick={() => setContentId(c.id)} className={c.id === contentId ? btnDark : btnLight}>
                    Nº {String(c.seriesNumber).padStart(2, '0')} · {c.status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}

            {content && (
              <>
                {content.insufficientEvidence && (
                  <div className="flex gap-2 text-xs border border-amber-300 bg-amber-50 text-amber-900 rounded p-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>The writer reported thin evidence, so this draft is deliberately restrained. Add facts or link a decision for a stronger draft. {content.aiNotes}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,400px)_1fr] gap-4">
                  {/* Poster */}
                  <div className={`${panel} space-y-3`}>
                    {content.posterSource === 'imported' && content.poster && !posterDirty && (
                      <div className="space-y-1">
                        <img src={mediaUrl(content.poster.key)} alt="Imported poster" className="w-full h-auto rounded border border-zinc-200" />
                        <p className="text-[11px] text-zinc-500">Finished poster imported from an outside tool. Edit the text below and Save poster to switch back to the IMI template.</p>
                      </div>
                    )}
                    <canvas ref={canvasRef} className={`w-full h-auto rounded border border-zinc-200 bg-zinc-900 ${content.posterSource === 'imported' && content.poster && !posterDirty ? 'hidden' : ''}`} />
                    <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                      <span className={chip(content.backgroundAuthenticity === 'ai_generated' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>{label(content.backgroundAuthenticity)}</span>
                      <span className="text-zinc-500">Evidence used: {content.evidenceIdsUsed.join(', ') || 'none'} · {content.copyModel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={lbl + ' mb-0'}>Poster text</span>
                      <span className={`text-xs font-mono ${words > 12 ? 'text-red-700 font-bold' : 'text-zinc-500'}`}>{words}/12 words</span>
                    </div>
                    <input className={input} disabled={published} value={poster.eyebrow} onChange={(e) => setPoster({ ...poster, eyebrow: e.target.value })} placeholder="Eyebrow" />
                    <textarea className={input} rows={2} disabled={published} value={poster.headline} onChange={(e) => setPoster({ ...poster, headline: e.target.value })} />
                    <div className="flex flex-wrap gap-1">
                      {opts.templates.map((t) => (
                        <button key={t} disabled={published} onClick={() => setPoster({ ...poster, template: t })} className={poster.template === t ? btnDark : btnLight}>{TEMPLATE_LABELS[t]}</button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className={btnDark} onClick={savePoster} disabled={!!busy || words > 12 || published}>
                        <Save className="w-3.5 h-3.5" /> {content.poster && !posterDirty ? 'Poster saved ✓' : 'Save poster'}
                      </button>
                      <label className={`${btnLight} cursor-pointer`}>
                        <Upload className="w-3.5 h-3.5" /> Use another photo
                        <input type="file" accept="image/*" className="hidden" disabled={published} onChange={(e) => e.target.files?.[0] && swapBackground(e.target.files[0])} />
                      </label>
                      {opts.aiProviders.chatgpt && (
                        <button className={btnLight} onClick={() => swapBackground()} disabled={!!busy || published}><ImageIcon className="w-3.5 h-3.5" /> New AI atmosphere</button>
                      )}
                      <button className={btnLight} onClick={download}><Download className="w-3.5 h-3.5" /> Download</button>
                    </div>
                    {content.video && (
                      <div className="space-y-2 border-t border-zinc-200 pt-2">
                        <video src={mediaUrl(content.video.key)} controls playsInline className="w-full rounded border border-zinc-200 bg-black" />
                        <div className="flex items-center gap-2 text-xs">
                          <span className={lbl + ' mb-0'}>Instagram, Facebook, Threads, Telegram post</span>
                          {(['poster', 'video'] as const).map((md) => (
                            <button key={md} onClick={() => setMode(md)} disabled={!!busy || published} className={content.mediaMode === md ? btnDark : btnLight}>{md === 'poster' ? 'Poster' : 'Video'}</button>
                          ))}
                        </div>
                        <p className="text-[11px] text-zinc-500">YouTube always uses the video. LinkedIn and Google Business use the poster.</p>
                      </div>
                    )}
                    {content.publications.some((p) => p.channel === 'youtube') && (
                      <label className={`${btnLight} cursor-pointer w-fit`}>
                        <Film className="w-3.5 h-3.5" /> {content.video ? 'Replace YouTube video' : 'Attach video for YouTube (≤95 MB)'}
                        <input type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => e.target.files?.[0] && attachVideo(e.target.files[0])} />
                      </label>
                    )}
                  </div>

                  {/* Make with another tool */}
                  <div className={`${panel} space-y-3 xl:col-span-2 xl:order-last`}>
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Make it with another tool</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {opts.creativeTools.map((t) => (
                        <button key={t.id} onClick={() => { setTool(t.id); setBrief(null); }} title={t.note} className={tool === t.id ? btnDark : btnLight}>{t.name}</button>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-500">{opts.creativeTools.find((t) => t.id === tool)?.note} You sign in there with your own account; IMI never sees that password.</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-zinc-600">1. Write the prompt with</span>
                      {(['claude', 'chatgpt'] as const).map((w) => (
                        <button key={w} className={btnLight} onClick={() => makeBrief(w)} disabled={!!busy || !opts.aiProviders[w]}>{busy === 'brief' ? 'Writing…' : w === 'claude' ? 'Claude' : 'ChatGPT'}</button>
                      ))}
                    </div>
                    {brief && (
                      <div className="space-y-2">
                        <pre className="whitespace-pre-wrap text-xs bg-zinc-50 border border-zinc-200 rounded p-2 font-sans max-h-56 overflow-auto">{brief.prompt}</pre>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-zinc-600">2.</span>
                          <button className={btnDark} onClick={() => { navigator.clipboard.writeText(brief.prompt); window.open(brief.url, '_blank', 'noopener,noreferrer'); }}>
                            <Copy className="w-3.5 h-3.5" /> Copy prompt & open {brief.toolName} <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 border-t border-zinc-200 pt-2">
                      <span className="text-xs text-zinc-600">3. Bring the finished file back</span>
                      <div className="flex flex-wrap gap-2 items-center text-xs">
                        <select className={`${input} w-auto`} value={imp.use} onChange={(e) => setImp({ ...imp, use: e.target.value })}>
                          <option value="video">It’s a video</option>
                          <option value="poster">It’s a finished poster (JPEG)</option>
                          <option value="background">It’s a background for the IMI template</option>
                        </select>
                        <label className="flex items-center gap-1"><input type="checkbox" checked={imp.ai} onChange={(e) => setImp({ ...imp, ai: e.target.checked })} /> Made with AI</label>
                        {imp.ai && <label className="flex items-center gap-1"><input type="checkbox" checked={imp.animals} onChange={(e) => setImp({ ...imp, animals: e.target.checked })} /> Shows animals</label>}
                        <label className={`${btnLight} cursor-pointer`}>
                          <Upload className="w-3.5 h-3.5" /> {busy === 'import' ? 'Uploading…' : 'Choose file'}
                          <input type="file" accept={imp.use === 'video' ? 'video/mp4,video/quicktime' : imp.use === 'poster' ? 'image/jpeg' : 'image/*'} className="hidden" disabled={published}
                            onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
                        </label>
                      </div>
                      {imp.ai && <p className="text-[11px] text-zinc-500">AI files are labelled “Made with AI” in every caption. If animals appear, approval moves to Class A.</p>}
                    </div>
                  </div>

                  {/* Captions, approval, publishing */}
                  <div className="space-y-4 min-w-0">
                    <div className={`${panel} space-y-3`}>
                      <div className="flex flex-wrap gap-1 items-center">
                        {content.publications.map((p) => (
                          <button key={p.channel} onClick={() => setTab(p.channel)} className={p.channel === tab ? btnDark : btnLight}>
                            {label(p.channel)} <span className={chip(STATUS_TONE[p.status])}>{p.status}</span>
                          </button>
                        ))}
                        {!published && opts.channels.some((c) => !content.publications.some((p) => p.channel === c.id)) && (
                          <span className="inline-flex gap-1 ml-auto">
                            <select className={`${input} w-auto text-xs`} value={addCh} onChange={(e) => setAddCh(e.target.value)}>
                              <option value="">+ Add channel…</option>
                              {opts.channels.filter((c) => !content.publications.some((p) => p.channel === c.id)).map((c) => <option key={c.id} value={c.id}>{label(c.id)}</option>)}
                            </select>
                            {addCh && <button className={btnLight} onClick={addChannel} disabled={!!busy}>{busy === 'addch' ? 'Writing…' : 'Add'}</button>}
                          </span>
                        )}
                      </div>
                      {activePub && caps[activePub.channel] && (
                        <div className="space-y-2">
                          {activePub.channel === 'google_ads' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className={lbl}>Headlines — one per line, max 30 characters</span>
                                <textarea className={`${input} font-mono text-xs`} rows={8} disabled={activePub.status === 'published'} value={caps[tab].headlines} onChange={(e) => setCaps({ ...caps, [tab]: { ...caps[tab], headlines: e.target.value } })} />
                                {caps[tab].headlines.split('\n').some((h) => h.length > 30) && <span className="text-[11px] text-red-700">A headline is over 30 characters.</span>}
                              </div>
                              <div>
                                <span className={lbl}>Descriptions — one per line, max 90 characters</span>
                                <textarea className={`${input} font-mono text-xs`} rows={8} disabled={activePub.status === 'published'} value={caps[tab].descriptions} onChange={(e) => setCaps({ ...caps, [tab]: { ...caps[tab], descriptions: e.target.value } })} />
                                {caps[tab].descriptions.split('\n').some((d) => d.length > 90) && <span className="text-[11px] text-red-700">A description is over 90 characters.</span>}
                              </div>
                            </div>
                          )}
                          {activePub.channel === 'website' && (
                            <div className="space-y-2">
                              <div><span className={lbl}>Article title</span><input className={input} disabled={activePub.status === 'published'} value={caps[tab].title} onChange={(e) => setCaps({ ...caps, [tab]: { ...caps[tab], title: e.target.value } })} /></div>
                              <div><span className={lbl}>Meta description ({caps[tab].metaDescription.length}/155)</span><input className={input} disabled={activePub.status === 'published'} value={caps[tab].metaDescription} onChange={(e) => setCaps({ ...caps, [tab]: { ...caps[tab], metaDescription: e.target.value } })} /></div>
                            </div>
                          )}
                          {activePub.channel === 'youtube' && (
                            <div><span className={lbl}>Video title</span><input className={input} disabled={activePub.status === 'published'} value={caps[tab].title} onChange={(e) => setCaps({ ...caps, [tab]: { ...caps[tab], title: e.target.value } })} /></div>
                          )}
                          <div><span className={lbl}>{label(activePub.channel)} caption</span>
                            <textarea className={input} rows={6} disabled={activePub.status === 'published'} value={caps[tab].caption} onChange={(e) => setCaps({ ...caps, [tab]: { ...caps[tab], caption: e.target.value } })} />
                          </div>
                          {!['google_business', 'whatsapp'].includes(activePub.channel) && (
                            <div><span className={lbl}>Hashtags</span><input className={input} disabled={activePub.status === 'published'} value={caps[tab].hashtags} onChange={(e) => setCaps({ ...caps, [tab]: { ...caps[tab], hashtags: e.target.value } })} /></div>
                          )}
                          <div className="flex flex-wrap gap-2 items-center">
                            <button className={btnLight} onClick={() => saveCaption(activePub)} disabled={!!busy || activePub.status === 'published'}><Save className="w-3.5 h-3.5" /> Save</button>
                            {activePub.status !== 'published' && (
                              <>
                                <input className={`${input} flex-1 min-w-[140px]`} placeholder="Optional: how to change it (e.g. shorter, more about birds)" value={instr} onChange={(e) => setInstr(e.target.value)} />
                                {(['claude', 'chatgpt'] as const).map((w) => (
                                  <button key={w} className={btnLight} onClick={() => rewrite(activePub, w)} disabled={!!busy || !opts.aiProviders[w]}>
                                    <RefreshCw className={`w-3.5 h-3.5 ${busy === `rw-${activePub.channel}` ? 'animate-spin' : ''}`} /> Rewrite with {w === 'claude' ? 'Claude' : 'ChatGPT'}
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                          <div>
                            <span className={lbl}>Exactly what will be posted</span>
                            <pre className="whitespace-pre-wrap text-xs bg-zinc-50 border border-zinc-200 rounded p-2 font-sans">{activePub.finalText}</pre>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 min-w-0"><Link2 className="w-3 h-3 shrink-0" /><span className="truncate font-mono">{activePub.trackedUrl}</span></div>
                          {activePub.permalink && (
                            <a className="text-xs underline inline-flex items-center gap-1" href={activePub.permalink} target="_blank" rel="noopener noreferrer">
                              View live post <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Approval */}
                    <div className={`${panel} space-y-2`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Owner approval</span>
                      </div>
                      {content.approval?.valid ? (
                        <p className="text-xs text-emerald-800">Approved (Class {content.approval.approvalClass}) by {content.approval.approvedBy} at {content.approval.approvedAt}.</p>
                      ) : (
                        <>
                          <p className="text-xs text-zinc-600">{content.approval ? 'The content changed after approval, so it needs approving again.' : 'Approval is recorded against the exact poster and captions; any later edit voids it.'}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <select className={`${input} w-auto`} value={approval.cls} onChange={(e) => setApproval({ ...approval, cls: e.target.value })}>
                              <option value="B" disabled={content.requiresClassA}>Class B — brand / campaign</option>
                              <option value="A">Class A — wildlife or behaviour claim</option>
                            </select>
                            <input className={`${input} flex-1 min-w-[160px]`} placeholder="Note (optional)" value={approval.note} onChange={(e) => setApproval({ ...approval, note: e.target.value })} />
                          </div>
                          {content.requiresClassA && <p className="text-[11px] text-amber-800">AI media in this content shows animals, so it needs Class A with a domain review.</p>}
                          {approval.cls === 'A' && (
                            <input className={input} placeholder="Who reviewed the wildlife interpretation, and what they said" value={approval.review} onChange={(e) => setApproval({ ...approval, review: e.target.value })} />
                          )}
                          {content.insufficientEvidence && (
                            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={approval.ack} onChange={(e) => setApproval({ ...approval, ack: e.target.checked })} /> I accept this was drafted on thin evidence</label>
                          )}
                          <button className={btnDark} onClick={approve} disabled={!!busy || !content.poster || !pin}>
                            <ShieldCheck className="w-3.5 h-3.5" /> {!content.poster ? 'Save the poster first' : !pin ? 'Unlock with PIN to approve' : 'Approve'}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Publish */}
                    <div className={`${panel} space-y-3`}>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Post</span>
                      <div className="flex flex-wrap gap-3">
                        {content.publications.map((p) => (
                          <label key={p.channel} className={`flex items-center gap-1 text-xs ${p.status === 'published' || p.copyOnly ? 'text-zinc-400' : ''}`}>
                            <input type="checkbox" disabled={p.status === 'published' || p.copyOnly} checked={targets.includes(p.channel)} onChange={() => setTargets(toggle(targets, p.channel))} />
                            {label(p.channel)}{p.copyOnly ? ' (copy & post yourself)' : !connectedOf(p.channel) ? ' (not connected)' : ''}
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className={btnLight} onClick={() => publish(true)} disabled={!!busy || !content.poster || !targets.length}>
                          <FlaskConical className="w-3.5 h-3.5" /> {busy === 'test' ? 'Testing…' : 'Test (nothing goes public)'}
                        </button>
                        <button className={btnDark} onClick={() => publish(false)} disabled={!!busy || !content.approval?.valid || !pin || !targets.length}>
                          <Send className="w-3.5 h-3.5" /> {busy === 'publish' ? 'Publishing…' : 'Publish live'}
                        </button>
                      </div>
                      {Object.keys(results).length > 0 && (
                        <div className="space-y-1">
                          {content.publications.filter((p) => results[p.channel]).map((p) => {
                            const r = results[p.channel];
                            return (
                              <div key={p.channel} className="flex items-start gap-2 text-xs">
                                {r.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                                <span><span className="font-bold">{label(p.channel)}{r.dryRun ? ' (test)' : ''}:</span> {r.message}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {activePub && activePub.status !== 'published' && (
                        <div className="border-t border-zinc-200 pt-3 space-y-2">
                          <span className={lbl}>Posted {label(activePub.channel)} yourself? Record it so outcomes are tracked</span>
                          <div className="flex flex-wrap gap-2">
                            <a className={btnLight} href={`https://wa.me/?text=${encodeURIComponent(activePub.finalText)}`} target="_blank" rel="noopener noreferrer">
                              <Share2 className="w-3.5 h-3.5" /> Share via WhatsApp
                            </a>
                            <button className={btnLight} onClick={() => navigator.clipboard.writeText(activePub.finalText)}>Copy caption</button>
                          </div>
                          <div className="flex gap-2">
                            <input className={input} placeholder="Link to the live post" value={manualLink} onChange={(e) => setManualLink(e.target.value)} />
                            <button className={btnLight} onClick={() => recordManual(activePub)} disabled={!!busy || !pin}>Record</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
