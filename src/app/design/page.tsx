'use client';

import dynamic from 'next/dynamic';

const Designer = dynamic(() => import('@/components/Designer'), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-[#f2f1ec] text-stone-400">
      Loading OssTrack…
    </div>
  ),
});

export default function DesignPage() {
  // anonymous scratch design
  return <Designer designId={null} />;
}
