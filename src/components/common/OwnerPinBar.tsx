import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { setOwnerPin, useOwnerPin } from '../../api';

// The owner PIN is needed to connect accounts, approve content and publish
// live. It stays in this tab's memory only and is checked by the Worker.
export const OwnerPinBar: React.FC = () => {
  const pin = useOwnerPin();
  const [draft, setDraft] = useState('');
  return (
    <div className="flex flex-wrap items-center gap-2 bg-zinc-900 text-zinc-100 rounded px-3 py-2 text-xs">
      {pin ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
      <span className="font-mono">{pin ? 'Owner actions unlocked for this tab' : 'Enter your owner PIN to connect, approve or publish'}</span>
      <div className="flex-1" />
      {pin ? (
        <button className="px-2 py-1 rounded border border-zinc-600 hover:bg-zinc-800 font-mono" onClick={() => setOwnerPin('')}>Lock</button>
      ) : (
        <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); setOwnerPin(draft.trim()); setDraft(''); }}>
          <input type="password" autoComplete="off" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="PIN"
            className="w-24 rounded px-2 py-1 text-zinc-900 text-xs" />
          <button type="submit" className="px-2 py-1 rounded bg-zinc-100 text-zinc-900 font-mono">Unlock</button>
        </form>
      )}
    </div>
  );
};
