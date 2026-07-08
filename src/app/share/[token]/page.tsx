'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const ShareView = dynamic(() => import('@/components/ShareView'), {
  ssr: false,
  loading: () => <Loading />,
});

function Loading() {
  return <div className="grid h-dvh place-items-center bg-[#f2f1ec] text-stone-400">Loading…</div>;
}

export default function SharePage() {
  const params = useParams();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  if (!token) return <Loading />;
  return <ShareView token={token} />;
}
