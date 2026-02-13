'use client';

import { Header } from '@/components/layout/header';
import { ChartContainer } from '@/components/chart/chart-container';

export default function ChartPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0">
        <ChartContainer />
      </main>
    </div>
  );
}
