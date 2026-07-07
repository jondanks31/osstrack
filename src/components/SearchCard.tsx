'use client';

import { useState } from 'react';
import { Search, MapPin, LoaderCircle } from 'lucide-react';
import { searchPlace, type SearchResult } from '@/lib/search';
import { useOss } from '@/lib/store';

export default function SearchCard() {
  const setSearchTarget = useOss((s) => s.setSearchTarget);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await searchPlace(query);
      setResults(r);
      if (r.length === 0) setError('Nothing found — try a postcode, address or "lat, lng".');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pointer-events-auto w-[min(92vw,480px)] rounded-3xl bg-white/85 p-6 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Find your land</h1>
      <p className="mt-1 text-sm text-stone-500">
        Search by address, postcode or coordinates, then trace your boundary.
      </p>
      <form onSubmit={run} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. DY10 3PT or 52.39, -2.25"
            autoFocus
            className="w-full rounded-xl border-0 bg-stone-100 py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/70"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="rounded-xl bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-40"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : 'Search'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {results && results.length > 0 && (
        <ul className="mt-4 max-h-56 space-y-1 overflow-y-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                onClick={() => setSearchTarget({ lat: r.lat, lng: r.lng })}
                className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-stone-700 transition hover:bg-stone-100"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-stone-400" />
                <span className="line-clamp-2">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
