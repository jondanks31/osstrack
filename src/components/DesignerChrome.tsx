'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, LoaderCircle, Save, Share2 } from 'lucide-react';
import { useOss } from '@/lib/store';
import { useAuth } from '@/lib/useAuth';
import { createDesign } from '@/lib/designs';
import ShareDialog from './ShareDialog';

export default function DesignerChrome({ designId }: { designId: string | null }) {
  const { user } = useAuth();
  const router = useRouter();
  const name = useOss((s) => s.plan.name);
  const setPlanName = useOss((s) => s.setPlanName);
  const saveState = useOss((s) => s.saveState);
  const plan = useOss((s) => s.plan);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // ── saved design: name + autosave state + back to dashboard + share ──
  if (designId) {
    return (
      <>
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white/85 py-1.5 pl-1.5 pr-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
          <Link
            href="/dashboard"
            title="Back to dashboard"
            className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <input
            value={name}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-36 rounded-lg bg-transparent px-1.5 py-1 text-sm font-semibold text-stone-900 focus:bg-stone-100 focus:outline-none"
          />
          <span className="mx-1 flex items-center gap-1 text-xs text-stone-400">
            {saveState === 'saving' ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            {saveState === 'saving' ? 'Saving' : 'Saved'}
          </span>
          <button
            onClick={() => setShareOpen(true)}
            title="Share"
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            <Share2 className="size-4" />
            Share
          </button>
        </div>
        {shareOpen && <ShareDialog designId={designId} onClose={() => setShareOpen(false)} />}
      </>
    );
  }

  // ── scratch + signed in: offer to save into the account ──
  if (user) {
    async function saveToAccount() {
      if (!user) return;
      setSaving(true);
      try {
        const design = await createDesign({
          name: plan.name || 'My land',
          boundary: plan.boundary,
          features: plan.features,
        });
        router.push(`/design/${design.id}`);
      } catch {
        setSaving(false);
      }
    }
    return (
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/85 p-1.5 pl-3 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
        <Link href="/dashboard" className="text-sm font-medium text-stone-600 hover:text-stone-900">
          My designs
        </Link>
        <button
          onClick={saveToAccount}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
        >
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save to my designs
        </button>
      </div>
    );
  }

  // ── scratch + anonymous: prompt to sign up (carries the scratch on the way) ──
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/85 p-1.5 pl-3 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900">
        Sign in
      </Link>
      <Link
        href="/signup?import=1"
        className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
      >
        <Save className="size-4" />
        Sign up to save
      </Link>
    </div>
  );
}
