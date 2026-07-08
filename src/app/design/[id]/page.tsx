'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { getDesign } from '@/lib/designs';

const Designer = dynamic(() => import('@/components/Designer'), {
  ssr: false,
  loading: () => <Loading />,
});

function Loading() {
  return (
    <div className="grid h-dvh place-items-center bg-[#f2f1ec] text-stone-400">
      Loading OssTrack…
    </div>
  );
}

/** Only render a design the signed-in user actually owns; otherwise bounce to the dashboard. */
function OwnedDesigner({ id }: { id: string }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  // RLS already scopes the fetch to the owner; a null result means it isn't theirs
  useEffect(() => {
    let cancelled = false;
    getDesign(id)
      .then((design) => {
        if (cancelled) return;
        if (design) setOk(true);
        else router.replace('/dashboard');
      })
      .catch(() => !cancelled && router.replace('/dashboard'));
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (!ok) return <Loading />;
  return <Designer designId={id} />;
}

export default function SavedDesignPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <RequireAuth>{id ? <OwnedDesigner id={id} /> : <Loading />}</RequireAuth>
  );
}
