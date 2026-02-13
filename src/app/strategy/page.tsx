'use client';

import { Header } from '@/components/layout/header';
import { StrategyList } from '@/components/strategy/strategy-list';

export default function StrategyPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-auto">
        <StrategyList />
      </main>
    </div>
  );
}
