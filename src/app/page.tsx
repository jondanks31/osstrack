'use client';

import Link from 'next/link';
import { ArrowRight, LandPlot, Layers3, Ruler, FileDown } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

const features = [
  { icon: LandPlot, title: 'Trace your land', text: 'Search your address and draw your exact boundary over aerial imagery.' },
  { icon: Layers3, title: 'Plan every element', text: 'Fields, tracks, water, shelters, gates and more — labelled and measured.' },
  { icon: Ruler, title: 'Real measurements', text: 'Live acreage and fence lengths so your plan reflects the real ground.' },
  { icon: FileDown, title: 'Export & print', text: 'Share a clean PDF or printout of your layout with anyone.' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-dvh bg-[#f2f1ec] text-stone-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">
          Oss<span className="text-emerald-700">Track</span>
        </span>
        <nav className="flex items-center gap-2 text-sm">
          {!loading && user ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-stone-900 px-4 py-2 font-medium text-white transition hover:bg-stone-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 font-medium text-stone-600 transition hover:bg-stone-200/60">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-stone-900 px-4 py-2 font-medium text-white transition hover:bg-stone-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 text-center sm:py-24">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Field & equine smallholding planning
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Plan your land, paddocks and track system — the easy way.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-500">
            Map your plot, divide it into fields, design a track system and place everything your
            horses need. Free to use, right in your browser.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/design"
              className="flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-stone-700"
            >
              Start designing free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl px-6 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-200/60"
            >
              Create an account
            </Link>
          </div>
          <p className="mt-3 text-xs text-stone-400">No sign-up needed to start — save your work when you&apos;re ready.</p>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white/70 p-5 ring-1 ring-black/5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-3 font-semibold text-stone-900">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-stone-200/70 py-6 text-center text-xs text-stone-400">
        OssTrack — plan your plot.
      </footer>
    </div>
  );
}
