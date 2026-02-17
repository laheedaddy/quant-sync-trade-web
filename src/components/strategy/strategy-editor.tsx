'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StrategySettingsForm } from './strategy-settings-form';
import { IndicatorConfigList } from './indicator-config-list';
import { SignalRuleList } from './signal-rule-list';
import { useStrategyDetail } from '@/hooks/use-strategy-detail';

interface StrategyEditorProps {
  strategyNo: number;
  onChanged?: () => void;
  hideSettings?: boolean;
  hideIndicators?: boolean;
}

export function StrategyEditor({
  strategyNo,
  onChanged,
  hideSettings,
  hideIndicators,
}: StrategyEditorProps) {
  const { strategy, indicators, rules, isLoading, update, addIndicator, editIndicator, removeIndicator, addRule, editRule, removeRule } = useStrategyDetail(strategyNo);

  // Wrap mutation callbacks to notify parent of changes
  const wrap = <T extends (...args: never[]) => Promise<unknown>>(fn: T): T => {
    if (!onChanged) return fn;
    return (async (...args: Parameters<T>) => {
      const result = await fn(...args);
      onChanged();
      return result;
    }) as T;
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-8 w-48 bg-[#1e222d]" />
        <Skeleton className="h-40 bg-[#1e222d]" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="p-3 text-center">
        <p className="text-xs text-[#787b86]">Failed to load strategy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Strategy settings (top) — hidden when hideSettings is true */}
      {!hideSettings && strategy && (
        <StrategySettingsForm strategy={strategy} onSave={wrap(update)} />
      )}

      {/* Indicators / Rules tabs (or rules-only when hideIndicators) */}
      {hideIndicators ? (
        <div className="space-y-3">
          <h4 className="text-xs text-[#787b86] uppercase tracking-wider">
            Rules ({rules.length})
          </h4>
          <SignalRuleList
            rules={rules}
            onAdd={wrap(addRule)}
            onUpdate={wrap(editRule)}
            onDelete={wrap(removeRule)}
          />
        </div>
      ) : (
        <Tabs defaultValue="indicators" className="space-y-3">
          <TabsList className="bg-[#0a0e17] border border-[#2a2e39]">
            <TabsTrigger
              value="indicators"
              className="text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#d1d4dc] text-[#787b86]"
            >
              Indicators ({indicators.length})
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#d1d4dc] text-[#787b86]"
            >
              Rules ({rules.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indicators">
            <IndicatorConfigList
              indicators={indicators}
              onAdd={wrap(addIndicator)}
              onEdit={wrap(editIndicator)}
              onDelete={wrap(removeIndicator)}
            />
          </TabsContent>

          <TabsContent value="rules">
            <SignalRuleList
              rules={rules}
              onAdd={wrap(addRule)}
              onUpdate={wrap(editRule)}
              onDelete={wrap(removeRule)}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
