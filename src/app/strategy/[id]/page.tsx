'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StrategySettingsForm } from '@/components/strategy/strategy-settings-form';
import { IndicatorConfigList } from '@/components/strategy/indicator-config-list';
import { SignalRuleList } from '@/components/strategy/signal-rule-list';
import { useStrategyDetail } from '@/hooks/use-strategy-detail';

export default function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userStrategyNo = parseInt(id, 10);
  const {
    strategy, indicators, rules,
    isLoading, error,
    update, addIndicator, editIndicator, removeIndicator,
    addRule, editRule, removeRule,
  } = useStrategyDetail(userStrategyNo);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-auto">
        <div className="p-4 space-y-4 max-w-4xl">
          <div className="flex items-center gap-3">
            <Button asChild size="icon-xs" variant="ghost" className="text-[#787b86] hover:text-[#d1d4dc]">
              <Link href="/strategy"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            {isLoading ? (
              <Skeleton className="h-5 w-40 bg-[#1e222d]" />
            ) : strategy ? (
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#d1d4dc]">{strategy.name}</h2>
                <Badge
                  variant={strategy.isActive ? 'default' : 'secondary'}
                  className={strategy.isActive ? 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30' : 'bg-[#2a2e39] text-[#787b86] border-[#2a2e39]'}
                >
                  {strategy.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ) : null}
          </div>

          {error && <p className="text-sm text-[#ef5350]">{error}</p>}

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 bg-[#1e222d]" />
              <Skeleton className="h-40 bg-[#1e222d]" />
            </div>
          ) : strategy ? (
            <Tabs defaultValue="settings" className="space-y-4">
              <TabsList className="bg-[#0a0e17] border border-[#2a2e39]">
                <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#d1d4dc] text-[#787b86]">Settings</TabsTrigger>
                <TabsTrigger value="indicators" className="text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#d1d4dc] text-[#787b86]">Indicators ({indicators.length})</TabsTrigger>
                <TabsTrigger value="rules" className="text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#d1d4dc] text-[#787b86]">Rules ({rules.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="settings">
                <StrategySettingsForm strategy={strategy} onSave={update} />
              </TabsContent>

              <TabsContent value="indicators">
                <IndicatorConfigList indicators={indicators} onAdd={addIndicator} onEdit={editIndicator} onDelete={removeIndicator} />
              </TabsContent>

              <TabsContent value="rules">
                <SignalRuleList rules={rules} onAdd={addRule} onUpdate={editRule} onDelete={removeRule} />
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </main>
    </div>
  );
}
