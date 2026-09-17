import React, { useState } from 'react';
import type { SearchQueryResult, UserRole, ActiveScreen } from '../../types';
import { ConfidenceTag } from '../common/ConfidenceTag';
import { RetrospectiveMarker } from '../common/RetrospectiveMarker';
import { Search, GitCommit, GitCompare, ArrowRight, Layers, CheckSquare, TrendingUp, FileText, Info } from 'lucide-react';

interface AskSystemScreenProps {
  searchResults: SearchQueryResult[];
  onNavigate: (screen: ActiveScreen) => void;
  currentUserRole: UserRole;
}

export const AskSystemScreen: React.FC<AskSystemScreenProps> = ({ searchResults, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [activeRelationFilter, setActiveRelationFilter] = useState<'all' | 'caused_this' | 'similar_to_this'>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');

  const sampleQueries = ['tiger territory marking', 'ESG claim verification', 'AI imagery disclosure', 'attribution unknown'];

  const filtered = searchResults.filter((item) => {
    if (activeRelationFilter !== 'all' && item.relationshipType !== activeRelationFilter) return false;
    if (activeTypeFilter !== 'all' && item.type !== activeTypeFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.retrievalReason.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const typeIconMap = {
    evidence: <Layers className="w-3.5 h-3.5 text-blue-700" />,
    decision: <CheckSquare className="w-3.5 h-3.5 text-zinc-900" />,
    outcome: <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />,
    learning: <FileText className="w-3.5 h-3.5 text-indigo-700" />,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-300 rounded p-4 sm:p-6 shadow-xs space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-950 font-sans">Ask the System (Institutional Retrieval)</h1>
          <p className="text-xs text-zinc-600 font-sans mt-0.5">
            Query past evidence, decisions, outcomes, and learnings. Every result shows its retrieval reason and distinguishes causal lineage from
            correlative similarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded text-xs">
          <div className="flex items-start gap-2">
            <div className="p-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 mt-0.5">
              <GitCommit className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-mono font-bold text-emerald-950 uppercase text-[11px] block">Lineage: "Caused This"</span>
              <p className="text-[11px] text-zinc-600 font-sans leading-relaxed">Direct chronological predecessor that triggered this outcome or decision.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 mt-0.5">
              <GitCompare className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-mono font-bold text-indigo-950 uppercase text-[11px] block">Analogy: "Similar to This"</span>
              <p className="text-[11px] text-zinc-600 font-sans leading-relaxed">Thematic or pattern-level precedent, without direct causal linkage.</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search historical evidence, past decisions, outcomes, or questions..."
              className="w-full pl-10 pr-4 py-3 text-sm font-sans border border-zinc-300 rounded focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 bg-white text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-mono text-zinc-500 uppercase">Suggested Queries:</span>
            {sampleQueries.map((sq) => (
              <button
                key={sq}
                onClick={() => setQuery(sq)}
                className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300 font-mono text-[11px] transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-500 uppercase text-[11px]">Distinction:</span>
            {(['all', 'caused_this', 'similar_to_this'] as const).map((rel) => (
              <button
                key={rel}
                onClick={() => setActiveRelationFilter(rel)}
                className={`px-2.5 py-1 rounded uppercase text-[11px] transition-colors ${
                  activeRelationFilter === rel ? 'bg-zinc-900 text-white font-bold' : 'bg-zinc-100 text-zinc-700 border border-zinc-300 hover:bg-zinc-200'
                }`}
              >
                {rel === 'all' ? 'All Relations' : rel.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="ask-type-filter" className="text-zinc-500 uppercase text-[11px]">
              Type:
            </label>
            <select
              id="ask-type-filter"
              value={activeTypeFilter}
              onChange={(e) => setActiveTypeFilter(e.target.value)}
              className="px-2 py-1 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded text-zinc-800"
            >
              <option value="all">All Types</option>
              <option value="evidence">Evidence</option>
              <option value="decision">Decision</option>
              <option value="outcome">Outcome</option>
              <option value="learning">Learning</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
          <span className="uppercase tracking-wider">Retrieved Knowledge ({filtered.length} matches)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-zinc-300 rounded bg-white space-y-2">
            <p className="text-sm font-mono text-zinc-500">No past records match your query.</p>
            <button onClick={() => setQuery('')} className="text-xs font-mono text-zinc-800 underline">
              Reset search query
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isCausal = item.relationshipType === 'caused_this';
            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded border bg-white shadow-xs space-y-3.5 transition-all ${
                  isCausal ? 'border-l-4 border-l-emerald-600 border-zinc-300' : 'border-l-4 border-l-indigo-600 border-zinc-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">{item.code}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {typeIconMap[item.type]}
                      <span>{item.type}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider rounded border ${
                        isCausal ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-indigo-50 text-indigo-900 border-indigo-300'
                      }`}
                    >
                      {isCausal ? <GitCommit className="w-3 h-3" /> : <GitCompare className="w-3 h-3" />}
                      <span>{isCausal ? 'CAUSED THIS (DIRECT LINEAGE)' : 'SIMILAR TO THIS (ANALOGY)'}</span>
                    </span>
                    <RetrospectiveMarker type={item.retrospective} />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">{item.date}</span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-950 font-sans">{item.title}</h3>
                  <p className="text-xs text-zinc-700 font-sans leading-relaxed mt-1">{item.excerpt}</p>
                </div>

                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded flex items-start gap-2 text-xs">
                  <Info className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <div className="font-sans">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-600 block">Why This Was Returned:</span>
                    <p className="text-zinc-800 leading-snug">{item.retrievalReason}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                  <ConfidenceTag confidence={item.confidence} size="sm" />
                  <button
                    onClick={() => {
                      if (item.type === 'decision') onNavigate('decision_review');
                      else if (item.type === 'outcome') onNavigate('outcome_review');
                      else onNavigate('record_workspace');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs self-start sm:self-auto"
                  >
                    <span>Inspect Full {item.type}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
