'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/useAuth';
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
  const { user } = useAuth();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const design = getDesign(id);
    if (design && design.ownerId === user?.id) setOk(true);
    else router.replace('/dashboard');
  }, [id, user, router]);

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
