import React, { useCallback, useEffect, useState } from 'react';
import { Plug, CheckCircle2, AlertTriangle, Circle, RefreshCw, LogIn, Trash2, Copy, ChevronDown, ChevronUp, Megaphone } from 'lucide-react';
import { api, label } from '../../api';
import { OwnerPinBar } from '../common/OwnerPinBar';

interface Field { key: string; label: string; secret?: boolean; optional?: boolean; placeholder?: string; help?: string }
interface Platform {
  id: string; name: string; group: 'social' | 'messaging' | 'ai'; channels: string[]; method: 'oauth' | 'form';
  effort: string; needsAppEnv?: string[]; fields: Field[]; steps: string[]; limits: string[]; manualFallback: string;
  redirectUri?: string; appConfigured: boolean; connected: boolean; settings: Record<string, string>;
  accountLabel: string | null; expiresAt: string | null; lastCheckedAt: string | null; lastOk: boolean | null; lastMessage: string | null;
}
interface Health { ok: boolean; message: string; options?: { label: string; settings: Record<string, string> }[] }
interface Campaign { id: string; code: string; name: string; destinationUrl: string }

const panel = 'bg-white border border-zinc-300 rounded p-4';
const btn = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border disabled:opacity-40 disabled:cursor-not-allowed';
const btnDark = `${btn} bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800`;
const btnLight = `${btn} bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100`;
const input = 'w-full border border-zinc-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-900';

const GROUPS: { id: Platform['group']; title: string }[] = [
  { id: 'social', title: 'Social channels' },
  { id: 'messaging', title: 'Messaging' },
  { id: 'ai', title: 'AI writers' },
];

const AD_SOURCES = [
  { id: 'chatgpt_ads', label: 'ChatGPT Ads' },
  { id: 'meta_ads', label: 'Meta Ads (Facebook/Instagram)' },
  { id: 'google_ads', label: 'Google Ads' },
];

export const ConnectionsScreen: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [flags, setFlags] = useState({ ownerPinSet: true, encryptionReady: true });
  const [open, setOpen] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [health, setHealth] = useState<Record<string, Health>>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adCampaign, setAdCampaign] = useState('');
  const [adSource, setAdSource] = useState('chatgpt_ads');

  const load = useCallback(async () => {
    try {
      const d = await api<{ ownerPinSet: boolean; encryptionReady: boolean; platforms: Platform[] }>('/api/connections');
      setPlatforms(d.platforms);
      setFlags({ ownerPinSet: d.ownerPinSet, encryptionReady: d.encryptionReady });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
    api<Campaign[]>('/api/campaigns').then(setCampaigns).catch(() => {});
    const onMsg = (ev: MessageEvent) => { if (ev.data === 'imi-connected') load(); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [load]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  };

  const check = (p: Platform) => run(`check-${p.id}`, async () => {
    const h = await api<Health>(`/api/connections/${p.id}/check`, { method: 'POST' });
    setHealth((s) => ({ ...s, [p.id]: h }));
    await load();
  });

  const connectForm = (p: Platform) => run(`connect-${p.id}`, async () => {
    const h = await api<Health>(`/api/connections/${p.id}`, { method: 'POST', body: JSON.stringify(values[p.id] || {}) });
    setHealth((s) => ({ ...s, [p.id]: h }));
    setValues((s) => ({ ...s, [p.id]: {} }));
    await load();
  });

  const signIn = (p: Platform) => run(`connect-${p.id}`, async () => {
    const d = await api<{ url: string }>(`/api/connections/${p.id}/oauth-start`, { method: 'POST', body: JSON.stringify(values[p.id] || {}) });
    window.open(d.url, '_blank', 'width=560,height=720');
  });

  const pick = (p: Platform, settings: Record<string, string>) => run(`pick-${p.id}`, async () => {
    const h = await api<Health>(`/api/connections/${p.id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) });
    setHealth((s) => ({ ...s, [p.id]: h }));
    await load();
  });

  const disconnect = (p: Platform) => {
    if (!window.confirm(`Disconnect ${p.name}? IMI will forget its saved sign-in.`)) return;
    run(`del-${p.id}`, async () => { await api(`/api/connections/${p.id}`, { method: 'DELETE' }); await load(); });
  };

  const setVal = (pid: string, key: string, v: string) => setValues((s) => ({ ...s, [pid]: { ...(s[pid] || {}), [key]: v } }));

  const adLink = (() => {
    const c = campaigns.find((x) => x.id === adCampaign);
    if (!c) return '';
    try {
      const u = new URL(c.destinationUrl);
      if (/wa\.me|whatsapp\.com/.test(u.hostname)) {
        u.searchParams.set('text', `Hi Iddav WildStay, I'd like to know more. (ref ${c.code}-${adSource.toUpperCase()})`);
      } else {
        u.searchParams.set('utm_source', adSource);
        u.searchParams.set('utm_medium', 'paid');
        u.searchParams.set('utm_campaign', c.code.toLowerCase());
      }
      return u.toString();
    } catch { return c.destinationUrl; }
  })();

  const StatusIcon = ({ p }: { p: Platform }) =>
    !p.connected ? <Circle className="w-4 h-4 text-zinc-300" />
      : p.lastOk === false ? <AlertTriangle className="w-4 h-4 text-amber-600" />
        : <CheckCircle2 className="w-4 h-4 text-emerald-600" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Plug className="w-5 h-5 text-zinc-900" />
        <h1 className="text-lg font-bold text-zinc-900">Connections</h1>
        <span className="text-xs font-mono text-zinc-500">set up once · test anytime · manual fallback always available</span>
      </div>

      <OwnerPinBar />

      {(!flags.ownerPinSet || !flags.encryptionReady) && (
        <div className="border border-amber-300 bg-amber-50 text-amber-900 text-xs rounded p-3 space-y-1">
          <div className="font-bold">One-time Worker setup still needed:</div>
          {!flags.ownerPinSet && <div className="font-mono">npx wrangler secret put OWNER_PIN</div>}
          {!flags.encryptionReady && <div className="font-mono">openssl rand -base64 32 | npx wrangler secret put CONNECTIONS_KEY</div>}
        </div>
      )}
      {error && <div className="border border-red-300 bg-red-50 text-red-800 text-xs rounded p-2">{error}</div>}

      {GROUPS.map((g) => (
        <div key={g.id} className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">{g.title}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {platforms.filter((p) => p.group === g.id).map((p) => {
              const h = health[p.id];
              const isOpen = open === p.id;
              return (
                <div key={p.id} className={panel}>
                  <div className="flex items-start gap-2">
                    <StatusIcon p={p} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900">{p.name}</span>
                        {p.channels.length > 0 && <span className="text-[10px] font-mono text-zinc-500">{p.channels.map(label).join(' · ')}</span>}
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5">
                        {p.connected ? (h?.message || p.lastMessage || `Connected${p.accountLabel ? ` as ${p.accountLabel}` : ''}.`) : p.effort}
                      </div>
                    </div>
                  </div>

                  {h?.options && h.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {h.options.map((o) => (
                        <button key={o.label} className={`${btnLight} w-full justify-start`} onClick={() => pick(p, o.settings)} disabled={!!busy}>Use: {o.label}</button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button className={p.connected ? btnLight : btnDark} onClick={() => setOpen(isOpen ? '' : p.id)}>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {p.connected ? 'Reconnect / edit' : 'Connect'}
                    </button>
                    {p.connected && (
                      <>
                        <button className={btnLight} onClick={() => check(p)} disabled={!!busy}>
                          <RefreshCw className={`w-3.5 h-3.5 ${busy === `check-${p.id}` ? 'animate-spin' : ''}`} /> Check
                        </button>
                        <button className={btnLight} onClick={() => disconnect(p)} disabled={!!busy}><Trash2 className="w-3.5 h-3.5" /> Disconnect</button>
                      </>
                    )}
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t border-zinc-200 pt-3 space-y-3">
                      <ol className="list-decimal pl-5 space-y-1 text-xs text-zinc-700">
                        {p.steps.map((s) => <li key={s}>{s}</li>)}
                      </ol>

                      {p.redirectUri && (
                        <div>
                          <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">Redirect URI to paste in the developer app</div>
                          <div className="flex gap-1">
                            <input readOnly className={`${input} font-mono text-xs`} value={p.redirectUri} />
                            <button className={btnLight} onClick={() => navigator.clipboard.writeText(p.redirectUri!)}><Copy className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}

                      {p.method === 'oauth' && !p.appConfigured && (
                        <div className="text-xs bg-zinc-50 border border-zinc-200 rounded p-2">
                          Add the app keys to the Worker once:
                          {p.needsAppEnv?.map((k) => <div key={k} className="font-mono">npx wrangler secret put {k}</div>)}
                        </div>
                      )}

                      {p.fields.map((f) => (
                        <div key={f.key}>
                          <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">{f.label}{f.optional ? ' (optional)' : ''}</div>
                          <input
                            className={input}
                            type={f.secret ? 'password' : 'text'}
                            autoComplete="off"
                            placeholder={p.connected && f.secret ? 'Saved — leave blank to keep' : f.placeholder || p.settings[f.key] || ''}
                            value={values[p.id]?.[f.key] || ''}
                            onChange={(e) => setVal(p.id, f.key, e.target.value)}
                          />
                          {f.help && <div className="text-[11px] text-zinc-500 mt-0.5">{f.help}</div>}
                        </div>
                      ))}

                      {p.method === 'oauth' ? (
                        <button className={btnDark} onClick={() => signIn(p)} disabled={!!busy || !p.appConfigured}>
                          <LogIn className="w-3.5 h-3.5" /> Sign in with {p.name.split(' ')[0]}
                        </button>
                      ) : (
                        <button className={btnDark} onClick={() => connectForm(p)} disabled={!!busy}>
                          <Plug className="w-3.5 h-3.5" /> {busy === `connect-${p.id}` ? 'Connecting…' : 'Connect'}
                        </button>
                      )}

                      {p.limits.length > 0 && (
                        <ul className="text-[11px] text-zinc-500 list-disc pl-4 space-y-0.5">{p.limits.map((l) => <li key={l}>{l}</li>)}</ul>
                      )}
                      <div className="text-[11px] text-zinc-500"><span className="font-bold">If this is not set up:</span> {p.manualFallback}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Ads inside AI tools</div>
        <div className={`${panel} space-y-3`}>
          <div className="flex items-start gap-2">
            <Megaphone className="w-4 h-4 text-zinc-700 mt-0.5" />
            <div className="text-xs text-zinc-700 space-y-1">
              <p><span className="font-bold">ChatGPT Ads</span> are bought in OpenAI’s own Ads Manager (ads.openai.com), which is open to Indian advertisers. IMI does not buy ads: paid spend needs your approval in the ad manager itself. What IMI adds is a tracked link per campaign, so enquiries from the ad are counted against the campaign.</p>
              <p><span className="font-bold">Claude</span> has no ads to buy: Anthropic keeps Claude products ad-free.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select className={input} value={adCampaign} onChange={(e) => setAdCampaign(e.target.value)}>
              <option value="">Choose a campaign…</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
            <select className={input} value={adSource} onChange={(e) => setAdSource(e.target.value)}>
              {AD_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {adLink && (
            <div className="flex gap-1">
              <input readOnly className={`${input} font-mono text-xs`} value={adLink} />
              <button className={btnLight} onClick={() => navigator.clipboard.writeText(adLink)}><Copy className="w-3.5 h-3.5" /> Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
