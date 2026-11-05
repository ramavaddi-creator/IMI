import React, { useCallback, useEffect, useState } from 'react';
import { Users, Plus, Phone, MessageCircle, Search, CheckCircle2, Link2, Trash2, X } from 'lucide-react';
import { api, label, useOwnerPin } from '../../api';
import { OwnerPinBar } from '../common/OwnerPinBar';

interface Enquiry {
  id: string; code: string; name: string; phone: string; email: string; consentMarketing: boolean; intake: string; firstMessage: string;
  refCode: string; campaignId: string | null; campaignCode: string | null; campaignName: string | null; channel: string | null;
  attribution: string; checkIn: string; checkOut: string; adults: number | null; children: number | null; rooms: number | null;
  safari: string; budgetNote: string; interests: string; stage: string; owner: string; nextAction: string; nextActionDue: string;
  overdue: boolean; dueToday: boolean; quoteAmount: number | null; quoteNights: number | null; quoteRooms: number | null;
  estContribution: number | null; bookedValue: number | null; roomNights: number | null; lostReason: string; createdAt: string; piiDeleted: boolean;
  events?: { kind: string; text: string; from: string | null; to: string | null; actor: string; at: string }[];
}
interface Opts { lossReasons: string[]; intake: string[]; safari: string[]; campaigns: { id: string; code: string; name: string }[] }

const PATH = ['new', 'contacted', 'qualified', 'quoted', 'booked', 'stayed'];
const STAGE_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', quoted: 'Quoted', tentative: 'Tentative', booked: 'Booked',
  stayed: 'Stayed', lost: 'Lost', cancelled: 'Cancelled', nurture: 'Later',
};
const INTAKE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', call: 'Phone call', website_form: 'Website form', instagram_dm: 'Instagram message', facebook_message: 'Facebook message',
  email: 'Email', walk_in: 'Walk-in', referral: 'Referral', ota: 'Booking site', other: 'Other',
};
const LOSS_LABEL: Record<string, string> = {
  price: 'Price', dates: 'Dates', safari: 'Safari access', travel: 'Travel', property_fit: 'Not the right fit', delayed_response: 'We replied late',
  competitor: 'Chose another stay', trust: 'Trust', no_response: 'No response', other: 'Other',
};
const VIEWS = [
  { id: 'due', label: 'Follow up' }, { id: 'open', label: 'Open' }, { id: 'won', label: 'Booked' }, { id: 'closed', label: 'Closed' }, { id: 'all', label: 'All' },
];

const panel = 'bg-white border border-zinc-300 rounded p-4';
const lbl = 'block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1';
const input = 'w-full border border-zinc-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-900';
const btn = 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border disabled:opacity-40 disabled:cursor-not-allowed';
const btnDark = `${btn} bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800`;
const btnLight = `${btn} bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100`;
const inr = (n: number | null | undefined) => (n || n === 0 ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');
const isoIn = (days: number) => new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`;

const blankNew = { name: '', phone: '', intake: 'whatsapp', message: '', checkIn: '', checkOut: '', adults: '', rooms: '', campaignId: '', attribution: 'self_reported', consentMarketing: false };

export const EnquiriesScreen: React.FC = () => {
  const pin = useOwnerPin();
  const [opts, setOpts] = useState<Opts | null>(null);
  const [view, setView] = useState('due');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState({ overdue: 0, dueToday: 0, new: 0 });
  const [sel, setSel] = useState<Enquiry | null>(null);
  const [adding, setAdding] = useState(false);
  const [nw, setNw] = useState(blankNew);
  const [step, setStep] = useState<'' | 'quoted' | 'booked' | 'lost' | 'nurture'>('');
  const [stepForm, setStepForm] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const run = async (k: string, fn: () => Promise<void>) => {
    setBusy(k); setError('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  };

  const load = useCallback(async () => {
    const d = await api<{ items: Enquiry[]; counts: typeof counts }>(`/api/enquiries?view=${view}&q=${encodeURIComponent(q)}`);
    setItems(d.items); setCounts(d.counts);
  }, [view, q]);

  useEffect(() => { api<Opts>('/api/crm/options').then(setOpts).catch((e) => setError(e.message)); }, []);
  useEffect(() => { run('list', load); }, [load]);

  const open = (id: string) => run('open', async () => {
    const e = await api<Enquiry>(`/api/enquiries/${id}`);
    setSel(e); setStep(''); setStepForm({});
    setEdit({
      checkIn: e.checkIn, checkOut: e.checkOut, adults: String(e.adults ?? ''), children: String(e.children ?? ''), rooms: String(e.rooms ?? ''),
      safari: e.safari, budgetNote: e.budgetNote, interests: e.interests, nextAction: e.nextAction, nextActionDue: e.nextActionDue,
    });
  });

  const refresh = async (id: string) => { await load(); await open(id); };

  const create = () => run('create', async () => {
    const e = await api<Enquiry>('/api/enquiries', { method: 'POST', body: JSON.stringify({ ...nw, campaignId: nw.campaignId || undefined }) });
    setAdding(false); setNw(blankNew); setView('open'); await load(); await open(e.id);
  });

  const move = (stage: string, extra: Record<string, unknown> = {}) => run('stage', async () => {
    if (!sel) return;
    await api(`/api/enquiries/${sel.id}/stage`, { method: 'POST', body: JSON.stringify({ stage, ...extra }) });
    await refresh(sel.id);
  });

  const save = () => run('save', async () => {
    if (!sel) return;
    await api(`/api/enquiries/${sel.id}`, { method: 'PATCH', body: JSON.stringify(edit) });
    await refresh(sel.id);
  });

  const addNote = () => run('note', async () => {
    if (!sel || !note.trim()) return;
    await api(`/api/enquiries/${sel.id}/notes`, { method: 'POST', body: JSON.stringify({ text: note }) });
    setNote(''); await open(sel.id);
  });

  const forget = () => {
    if (!sel || !window.confirm('Delete this guest’s personal details? The anonymous booking numbers are kept.')) return;
    run('forget', async () => { await api(`/api/enquiries/${sel.id}/forget`, { method: 'POST' }); await refresh(sel.id); });
  };

  const pathIdx = sel ? PATH.indexOf(sel.stage === 'tentative' ? 'quoted' : sel.stage) : -1;
  const nextStage = pathIdx >= 0 ? PATH[pathIdx + 1] : undefined;
  const isOpen = !!sel && ['new', 'contacted', 'qualified', 'quoted', 'tentative'].includes(sel.stage);
  const advance = () => {
    if (!nextStage) return;
    if (nextStage === 'quoted' || nextStage === 'booked') {
      setStep(nextStage);
      setStepForm(nextStage === 'booked'
        ? { bookedValue: String(sel?.quoteAmount ?? ''), roomNights: String((sel?.quoteNights ?? 0) * (sel?.quoteRooms ?? 0) || ''), estContribution: String(sel?.estContribution ?? '') }
        : { quoteNights: String(sel?.quoteNights ?? ''), quoteRooms: String(sel?.rooms ?? sel?.quoteRooms ?? '') });
    } else {
      move(nextStage);
    }
  };
  const sf = (k: string) => stepForm[k] || '';
  const setSf = (k: string, v: string) => setStepForm({ ...stepForm, [k]: v });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Users className="w-5 h-5 text-zinc-900" />
        <h1 className="text-lg font-bold text-zinc-900">Enquiries</h1>
        <span className="text-xs font-mono text-zinc-500">enquiry → quote → booking → stay</span>
        <div className="flex-1" />
        <button className={btnDark} onClick={() => { setAdding(true); setSel(null); }}><Plus className="w-3.5 h-3.5" /> New enquiry</button>
      </div>
      <OwnerPinBar />
      {error && <div className="border border-red-300 bg-red-50 text-red-800 text-xs rounded p-2">{error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded border border-zinc-300 overflow-hidden">
          {VIEWS.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} className={`px-3 py-1.5 text-xs font-mono ${view === v.id ? 'bg-zinc-900 text-white' : 'bg-white hover:bg-zinc-100'}`}>{v.label}</button>
          ))}
        </div>
        {counts.overdue > 0 && <span className="text-xs font-mono text-red-700">{counts.overdue} overdue</span>}
        {counts.dueToday > 0 && <span className="text-xs font-mono text-zinc-700">{counts.dueToday} due today</span>}
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-zinc-400" />
          <input className={`${input} pl-7 w-48`} placeholder="Name, phone, ENQ-…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4">
        {/* List */}
        <div className={`${panel} p-0 divide-y divide-zinc-100 h-fit`}>
          {items.length === 0 && <div className="p-4 text-sm text-zinc-500">{view === 'due' ? 'Nothing to follow up. ' : 'No enquiries here yet. '}</div>}
          {items.map((e) => (
            <button key={e.id} onClick={() => open(e.id)} className={`w-full text-left p-3 hover:bg-zinc-50 ${sel?.id === e.id ? 'bg-zinc-50' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 truncate">{e.piiDeleted ? '(details deleted)' : e.name || e.phone || e.email}</span>
                <span className="text-[10px] font-mono text-zinc-400">{e.code}</span>
                <span className="ml-auto text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">{STAGE_LABEL[e.stage]}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-500 mt-0.5">
                {e.checkIn && <span>{e.checkIn}{e.checkOut ? ` → ${e.checkOut}` : ''}</span>}
                {e.campaignCode && <span className="inline-flex items-center gap-0.5">{e.attribution === 'tracked' && <Link2 className="w-3 h-3" />}{e.campaignCode}{e.channel ? ` · ${label(e.channel)}` : ''}</span>}
                {e.nextAction && (
                  <span className={e.overdue ? 'text-red-700 font-bold' : e.dueToday ? 'text-zinc-900' : ''}>
                    {e.nextAction}{e.nextActionDue ? ` · ${e.overdue ? 'overdue ' : ''}${e.nextActionDue}` : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* New enquiry */}
        {adding && opts && (
          <div className={`${panel} space-y-3 h-fit`}>
            <div className="flex items-center"><span className="font-bold text-sm">New enquiry</span><button className="ml-auto" onClick={() => setAdding(false)}><X className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className={lbl}>Name</span><input className={input} value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} /></div>
              <div><span className={lbl}>Phone</span><input className={input} value={nw.phone} onChange={(e) => setNw({ ...nw, phone: e.target.value })} /></div>
            </div>
            <div>
              <span className={lbl}>Reached us by</span>
              <select className={input} value={nw.intake} onChange={(e) => setNw({ ...nw, intake: e.target.value })}>
                {opts.intake.map((i) => <option key={i} value={i}>{INTAKE_LABEL[i]}</option>)}
              </select>
            </div>
            <div>
              <span className={lbl}>Paste their message (a “ref CMP-…” code links the campaign automatically)</span>
              <textarea className={input} rows={3} value={nw.message} onChange={(e) => setNw({ ...nw, message: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2"><span className={lbl}>Check-in</span><input type="date" className={input} value={nw.checkIn} onChange={(e) => setNw({ ...nw, checkIn: e.target.value })} /></div>
              <div><span className={lbl}>Adults</span><input type="number" min={1} className={input} value={nw.adults} onChange={(e) => setNw({ ...nw, adults: e.target.value })} /></div>
              <div><span className={lbl}>Rooms</span><input type="number" min={1} className={input} value={nw.rooms} onChange={(e) => setNw({ ...nw, rooms: e.target.value })} /></div>
            </div>
            {!/CMP-\d{4}/i.test(nw.message) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={lbl}>Which campaign? (if known)</span>
                  <select className={input} value={nw.campaignId} onChange={(e) => setNw({ ...nw, campaignId: e.target.value })}>
                    <option value="">Don’t know</option>
                    {opts.campaigns.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <span className={lbl}>How do we know?</span>
                  <select className={input} value={nw.attribution} onChange={(e) => setNw({ ...nw, attribution: e.target.value })}>
                    <option value="self_reported">Guest told us</option>
                    <option value="operator_attributed">Our best judgement</option>
                  </select>
                </div>
              </div>
            )}
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={nw.consentMarketing} onChange={(e) => setNw({ ...nw, consentMarketing: e.target.checked })} /> Agreed to receive Iddav updates</label>
            <button className={btnDark} onClick={create} disabled={!!busy}>Save enquiry</button>
          </div>
        )}

        {/* Detail */}
        {sel && !adding && opts && (
          <div className="space-y-3">
            <div className={`${panel} space-y-3`}>
              <div className="flex items-start gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-base text-zinc-900">{sel.piiDeleted ? '(details deleted)' : sel.name || '—'}</div>
                  <div className="text-xs text-zinc-500 font-mono">{sel.code} · {INTAKE_LABEL[sel.intake]} · {sel.createdAt.slice(0, 10)}</div>
                </div>
                <div className="ml-auto flex gap-1">
                  {sel.phone && <a className={btnLight} href={`tel:${sel.phone}`}><Phone className="w-3.5 h-3.5" /></a>}
                  {sel.phone && <a className={btnLight} href={waLink(sel.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-3.5 h-3.5" /></a>}
                </div>
              </div>

              <div className="text-xs text-zinc-600">
                {sel.campaignCode
                  ? <>From <span className="font-bold">{sel.campaignCode}</span> {sel.campaignName}{sel.channel ? ` via ${label(sel.channel)}` : ''} · <span className={sel.attribution === 'tracked' ? 'text-emerald-700' : ''}>{sel.attribution.replace('_', ' ')}</span></>
                  : 'Source unknown'}
              </div>

              {/* Stage path */}
              <div className="flex items-center gap-1 flex-wrap">
                {PATH.map((s, i) => {
                  const idx = PATH.indexOf(sel.stage === 'tentative' ? 'quoted' : sel.stage);
                  const done = idx >= i && idx !== -1;
                  return (
                    <React.Fragment key={s}>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${done ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>{STAGE_LABEL[s]}</span>
                      {i < PATH.length - 1 && <span className="text-zinc-300">›</span>}
                    </React.Fragment>
                  );
                })}
                {['lost', 'cancelled', 'nurture'].includes(sel.stage) && <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-800">{STAGE_LABEL[sel.stage]}{sel.lostReason ? `: ${LOSS_LABEL[sel.lostReason]}` : ''}</span>}
              </div>

              {!step && (isOpen || sel.stage === 'booked') && (
                <div className="flex flex-wrap gap-2">
                  {nextStage && <button className={btnDark} onClick={advance} disabled={!!busy}><CheckCircle2 className="w-3.5 h-3.5" /> Mark {STAGE_LABEL[nextStage]}</button>}
                  {isOpen && <button className={btnLight} onClick={() => { setStep('lost'); setStepForm({}); }}>Lost</button>}
                  {isOpen && <button className={btnLight} onClick={() => { setStep('nurture'); setStepForm({ nextActionDue: isoIn(30) }); }}>Later</button>}
                  {sel.stage === 'booked' && <button className={btnLight} onClick={() => { setStep('lost'); setStepForm({ cancel: '1' }); }}>Cancelled</button>}
                </div>
              )}
              {!step && ['lost', 'nurture', 'cancelled'].includes(sel.stage) && (
                <button className={btnLight} onClick={() => move('contacted')} disabled={!!busy}>Reopen</button>
              )}

              {step === 'quoted' && (
                <div className="border border-zinc-200 rounded p-2 space-y-2 bg-zinc-50">
                  <div className="grid grid-cols-3 gap-2">
                    <div><span className={lbl}>Quote ₹</span><input type="number" className={input} value={sf('quoteAmount')} onChange={(e) => setSf('quoteAmount', e.target.value)} /></div>
                    <div><span className={lbl}>Nights</span><input type="number" className={input} value={sf('quoteNights')} onChange={(e) => setSf('quoteNights', e.target.value)} /></div>
                    <div><span className={lbl}>Rooms</span><input type="number" className={input} value={sf('quoteRooms')} onChange={(e) => setSf('quoteRooms', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className={lbl}>Est. contribution ₹ (after food, safari, tax, commission)</span><input type="number" className={input} value={sf('estContribution')} onChange={(e) => setSf('estContribution', e.target.value)} /></div>
                    <div><span className={lbl}>Valid until</span><input type="date" className={input} value={sf('quoteValidUntil')} onChange={(e) => setSf('quoteValidUntil', e.target.value)} /></div>
                  </div>
                  <input className={input} placeholder="Inclusions (e.g. meals, buffer-zone safari; Core not included)" value={sf('quoteInclusions')} onChange={(e) => setSf('quoteInclusions', e.target.value)} />
                  <div className="flex gap-2"><button className={btnDark} onClick={() => move('quoted', stepForm)} disabled={!!busy}>Save quote</button><button className={btnLight} onClick={() => setStep('')}>Cancel</button></div>
                </div>
              )}
              {step === 'booked' && (
                <div className="border border-zinc-200 rounded p-2 space-y-2 bg-zinc-50">
                  <div className="grid grid-cols-3 gap-2">
                    <div><span className={lbl}>Booked ₹</span><input type="number" className={input} value={sf('bookedValue')} onChange={(e) => setSf('bookedValue', e.target.value)} /></div>
                    <div><span className={lbl}>Room nights</span><input type="number" className={input} value={sf('roomNights')} onChange={(e) => setSf('roomNights', e.target.value)} /></div>
                    <div><span className={lbl}>Est. contribution ₹</span><input type="number" className={input} value={sf('estContribution')} onChange={(e) => setSf('estContribution', e.target.value)} /></div>
                  </div>
                  <div className="flex gap-2"><button className={btnDark} onClick={() => move('booked', stepForm)} disabled={!!busy}>Confirm booking</button><button className={btnLight} onClick={() => setStep('')}>Cancel</button></div>
                </div>
              )}
              {step === 'lost' && (
                <div className="border border-zinc-200 rounded p-2 space-y-2 bg-zinc-50">
                  <span className={lbl}>Why?</span>
                  <div className="flex flex-wrap gap-1">
                    {opts.lossReasons.map((r) => (
                      <button key={r} onClick={() => setSf('lostReason', r)} className={`text-[11px] px-2 py-0.5 rounded border ${sf('lostReason') === r ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-300'}`}>{LOSS_LABEL[r]}</button>
                    ))}
                  </div>
                  <input className={input} placeholder="Anything worth remembering (optional)" value={sf('lostNote')} onChange={(e) => setSf('lostNote', e.target.value)} />
                  <div className="flex gap-2"><button className={btnDark} onClick={() => move(stepForm.cancel ? 'cancelled' : 'lost', stepForm)} disabled={!!busy || !sf('lostReason')}>Save</button><button className={btnLight} onClick={() => setStep('')}>Cancel</button></div>
                </div>
              )}
              {step === 'nurture' && (
                <div className="border border-zinc-200 rounded p-2 space-y-2 bg-zinc-50">
                  <div className="grid grid-cols-2 gap-2">
                    <input className={input} placeholder="What to do then" value={sf('nextAction')} onChange={(e) => setSf('nextAction', e.target.value)} />
                    <input type="date" className={input} value={sf('nextActionDue')} onChange={(e) => setSf('nextActionDue', e.target.value)} />
                  </div>
                  <div className="flex gap-2"><button className={btnDark} onClick={() => move('nurture', stepForm)} disabled={!!busy}>Save</button><button className={btnLight} onClick={() => setStep('')}>Cancel</button></div>
                </div>
              )}

              {(sel.quoteAmount || sel.bookedValue) && (
                <div className="text-xs text-zinc-600 flex flex-wrap gap-x-4">
                  {sel.quoteAmount ? <span>Quote {inr(sel.quoteAmount)}</span> : null}
                  {sel.bookedValue ? <span>Booked {inr(sel.bookedValue)} · {sel.roomNights} room nights</span> : null}
                  {sel.estContribution ? <span>Contribution ≈ {inr(sel.estContribution)}</span> : null}
                </div>
              )}
            </div>

            {/* Follow-up + details */}
            {!sel.piiDeleted && (
              <div className={`${panel} space-y-3`}>
                <div>
                  <span className={lbl}>Next step</span>
                  <div className="flex flex-wrap gap-2">
                    <input className={`${input} flex-1 min-w-[160px]`} value={edit.nextAction || ''} onChange={(e) => setEdit({ ...edit, nextAction: e.target.value })} />
                    <input type="date" className={`${input} w-40`} value={edit.nextActionDue || ''} onChange={(e) => setEdit({ ...edit, nextActionDue: e.target.value })} />
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([t, d]) => (
                      <button key={t} className="text-[11px] px-2 py-0.5 rounded border border-zinc-300 hover:bg-zinc-100" onClick={() => setEdit({ ...edit, nextActionDue: isoIn(Number(d)) })}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="col-span-2 md:col-span-1"><span className={lbl}>Check-in</span><input type="date" className={input} value={edit.checkIn || ''} onChange={(e) => setEdit({ ...edit, checkIn: e.target.value })} /></div>
                  <div className="col-span-2 md:col-span-1"><span className={lbl}>Check-out</span><input type="date" className={input} value={edit.checkOut || ''} onChange={(e) => setEdit({ ...edit, checkOut: e.target.value })} /></div>
                  <div><span className={lbl}>Adults</span><input type="number" className={input} value={edit.adults || ''} onChange={(e) => setEdit({ ...edit, adults: e.target.value })} /></div>
                  <div><span className={lbl}>Children</span><input type="number" className={input} value={edit.children || ''} onChange={(e) => setEdit({ ...edit, children: e.target.value })} /></div>
                  <div><span className={lbl}>Rooms</span><input type="number" className={input} value={edit.rooms || ''} onChange={(e) => setEdit({ ...edit, rooms: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className={lbl}>Safari</span>
                    <select className={input} value={edit.safari || 'undecided'} onChange={(e) => setEdit({ ...edit, safari: e.target.value })}>
                      {opts.safari.map((s) => <option key={s} value={s}>{s === 'core' ? 'Core (confirm separately)' : s[0].toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div><span className={lbl}>Budget</span><input className={input} value={edit.budgetNote || ''} onChange={(e) => setEdit({ ...edit, budgetNote: e.target.value })} /></div>
                  <div><span className={lbl}>Interests</span><input className={input} value={edit.interests || ''} onChange={(e) => setEdit({ ...edit, interests: e.target.value })} /></div>
                </div>
                <button className={btnDark} onClick={save} disabled={!!busy}>Save</button>
              </div>
            )}

            {/* Notes + timeline */}
            <div className={`${panel} space-y-2`}>
              {!sel.piiDeleted && (
                <div className="flex gap-2">
                  <input className={input} placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
                  <button className={btnLight} onClick={addNote} disabled={!note.trim()}>Add</button>
                </div>
              )}
              {sel.firstMessage && <div className="text-xs bg-zinc-50 border border-zinc-200 rounded p-2 whitespace-pre-wrap">{sel.firstMessage}</div>}
              <div className="space-y-1">
                {sel.events?.map((e, i) => (
                  <div key={i} className="text-xs text-zinc-600 flex gap-2">
                    <span className="font-mono text-zinc-400 shrink-0">{e.at.slice(5, 16)}</span>
                    <span>{e.kind === 'stage' ? `${STAGE_LABEL[e.from || ''] || e.from} → ${STAGE_LABEL[e.to || ''] || e.to}${e.text ? ` · ${e.text}` : ''}` : e.text}</span>
                  </div>
                ))}
              </div>
              {!sel.piiDeleted && (
                <button className="text-[11px] text-zinc-500 inline-flex items-center gap-1 hover:text-red-700 disabled:opacity-40" onClick={forget} disabled={!pin}>
                  <Trash2 className="w-3 h-3" /> Delete personal data{!pin ? ' (unlock with PIN)' : ''}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
