'use client';

import RequireAuth from '@/components/RequireAuth';
import DashboardView from '@/components/DashboardView';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardView />
    </RequireAuth>
  );
}
