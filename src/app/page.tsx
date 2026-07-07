'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/components/App'), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-[#f2f1ec] text-stone-400">
      Loading OssTrack…
    </div>
  ),
});

export default function Page() {
  return <App />;
}
