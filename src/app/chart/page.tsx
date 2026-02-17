'use client';

import { Header } from '@/components/layout/header';
import { ChartContainer } from '@/components/chart/chart-container';
import { StrategyPanel } from '@/components/backtest/strategy-panel';

export default function ChartPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 h-full">
          <ChartContainer />
        </div>
        <StrategyPanel />
      </main>
    </div>
  );
}
