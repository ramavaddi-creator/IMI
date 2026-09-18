import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AiAssistPanelProps {
  currentText: string;
  onAccept: (improved: string) => void;
  aiProviders: { claude: boolean; chatgpt: boolean };
  onAiAssist: (text: string, provider: 'claude' | 'chatgpt') => Promise<string>;
  minLength?: number;
}

// CHANGE: new -- shared AI Assist component, factored out so every text
// field across the app (Inbox, Decision, Outcome, Home) gets the exact same
// behavior: a suggestion the person reviews and explicitly accepts or
// discards, never anything applied automatically.
export const AiAssistPanel: React.FC<AiAssistPanelProps> = ({ currentText, onAccept, aiProviders, onAiAssist, minLength = 8 }) => {
  const [loading, setLoading] = useState<'' | 'claude' | 'chatgpt'>('');
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');

  if (!aiProviders.claude && !aiProviders.chatgpt) return null;
  if (currentText.trim().length <= minLength) return null;

  const handleImprove = (provider: 'claude' | 'chatgpt') => {
    setLoading(provider);
    setError('');
    setSuggestion('');
    onAiAssist(currentText, provider)
      .then((improved) => setSuggestion(improved))
      .catch((err: any) => setError(err?.message || 'Could not get a suggestion right now.'))
      .finally(() => setLoading(''));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {aiProviders.claude && (
          <button
            type="button"
            onClick={() => handleImprove('claude')}
            disabled={loading !== ''}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-zinc-300 rounded bg-white hover:bg-zinc-100 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading === 'claude' ? 'Improving...' : 'Improve with Claude'}</span>
          </button>
        )}
        {aiProviders.chatgpt && (
          <button
            type="button"
            onClick={() => handleImprove('chatgpt')}
            disabled={loading !== ''}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-zinc-300 rounded bg-white hover:bg-zinc-100 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading === 'chatgpt' ? 'Improving...' : 'Improve with ChatGPT'}</span>
          </button>
        )}
      </div>
      {error && <div className="p-2 bg-amber-50 border border-amber-300 rounded text-amber-900 text-[11px] font-mono">{error}</div>}
      {suggestion && (
        <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded space-y-2">
          <span className="text-[10px] font-mono uppercase text-indigo-900 font-bold block">AI Suggestion — review before using</span>
          <p className="text-sm font-sans text-zinc-900 leading-relaxed bg-white p-2.5 rounded border border-zinc-200">{suggestion}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onAccept(suggestion);
                setSuggestion('');
              }}
              className="px-3 py-1 text-xs font-mono font-bold uppercase rounded bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Use This
            </button>
            <button type="button" onClick={() => setSuggestion('')} className="px-3 py-1 text-xs font-mono border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100">
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
