'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, RefreshCw, Link, Unlink, Play, Square, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSignalChannels } from '@/hooks/use-signal-channels';
import { useRealtimeQuote } from '@/hooks/use-realtime-quote';
import { fetchChannelStatus, fetchChannelMonitor } from '@/lib/api/signal-channel';
import { getCurrentBucketTimestamp } from '@/lib/chart/utils';
import { getChannelState } from '@/types/signal-channel';
import type {
  SignalChannel,
  ChannelStatus,
  ChannelIndicatorCache,
  ChannelMonitor,
  ConditionGroupEval,
  LeafConditionEval,
  RuleEvalResult,
  MarketSession,
} from '@/types/signal-channel';
import { MARKET_SESSION_LABELS } from '@/types/signal-channel';
import type { VersionSnapshot } from '@/types/strategy';
import { COMPARISON_OPERATOR_LABELS, CROSS_OPERATOR_LABELS } from '@/types/strategy';

/** UTC 시간을 차트와 동일한 형식(HH:MM)으로 표시 — lightweight-charts는 UTCTimestamp 사용 */
function formatUtcTime(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatUtcDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const mon = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${mon}-${day} ${h}:${m} UTC`;
}

interface ChannelDetailViewProps {
  strategyNo: number;
  channel: SignalChannel;
  onBack: () => void;
}

export function ChannelDetailView({
  strategyNo,
  channel,
  onBack,
}: ChannelDetailViewProps) {
  const {
    channels,
    connect,
    disconnect,
    startReceiving,
    stopReceiving,
    remove,
  } = useSignalChannels(strategyNo);

  // Use live channel data from store (updates after actions)
  const liveChannel = channels.find(
    (c) => c.signalChannelNo === channel.signalChannelNo,
  ) ?? channel;

  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bucketKey, setBucketKey] = useState(0);

  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const data = await fetchChannelStatus(strategyNo, channel.signalChannelNo);
      setStatus(data);
    } catch {
      // silent
    } finally {
      setIsLoadingStatus(false);
    }
  }, [strategyNo, channel.signalChannelNo]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // 버킷 전환 감지 → status + monitor 자동 갱신
  useEffect(() => {
    const timeframe = liveChannel.timeframe;
    if (!timeframe) return;
    const bucketRef = { current: getCurrentBucketTimestamp(timeframe) };
    const timer = setInterval(() => {
      const now = getCurrentBucketTimestamp(timeframe);
      if (now !== bucketRef.current) {
        bucketRef.current = now;
        loadStatus();
        setBucketKey((k) => k + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [liveChannel.timeframe, loadStatus]);

  const state = getChannelState(liveChannel);
  const snapshot = liveChannel.versionSnapshot;

  const stateBadge = {
    RECEIVING: { cls: 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30', dot: 'bg-[#26a69a]', pulse: true },
    CONNECTED: { cls: 'bg-[#2962ff]/20 text-[#2962ff] border-[#2962ff]/30', dot: 'bg-[#2962ff]', pulse: false },
    DISCONNECTED: { cls: 'bg-[#787b86]/10 text-[#787b86] border-[#2a2e39]', dot: 'bg-[#787b86]', pulse: false },
  }[state];

  const handleAction = async (action: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await action();
    } catch {
      // error handled in hook
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await remove(channel.signalChannelNo);
      onBack();
    } catch {
      // error handled in hook
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-3 py-2 border-b border-[#2a2e39] flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-[#787b86] hover:text-[#d1d4dc]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            목록으로
          </button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-[#787b86] hover:text-[#d1d4dc]"
            onClick={loadStatus}
            disabled={isLoadingStatus}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#d1d4dc]">
            {liveChannel.symbol} · {liveChannel.timeframe}
          </span>
          <Badge className={`${stateBadge.cls} text-[10px]`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${stateBadge.dot} mr-1 ${stateBadge.pulse ? 'animate-pulse' : ''}`} />
            {state}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#787b86]">
          {liveChannel.strategyName && <span>{liveChannel.strategyName}</span>}
          <span>v{liveChannel.versionNumber ?? '?'}</span>
          <span>{liveChannel.deliveryType}</span>
          <span className={liveChannel.isAutoTrade ? 'text-[#26a69a]' : ''}>
            AutoTrade {liveChannel.isAutoTrade ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-1.5 mt-2">
          {state === 'DISCONNECTED' && (
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 gap-1 bg-[#2962ff] hover:bg-[#1e53e5] text-white"
              disabled={actionLoading}
              onClick={() => handleAction(() => connect(channel.signalChannelNo))}
            >
              <Link className="w-3 h-3" />
              Connect
            </Button>
          )}
          {state === 'CONNECTED' && (
            <>
              <Button
                size="sm"
                className="h-6 text-[10px] px-2 gap-1 bg-[#26a69a] hover:bg-[#26a69a]/80 text-white"
                disabled={actionLoading}
                onClick={() => handleAction(() => startReceiving(channel.signalChannelNo))}
              >
                <Play className="w-3 h-3" />
                Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 gap-1 border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
                disabled={actionLoading}
                onClick={() => handleAction(() => disconnect(channel.signalChannelNo))}
              >
                <Unlink className="w-3 h-3" />
                Disconnect
              </Button>
            </>
          )}
          {state === 'RECEIVING' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 gap-1 border-[#ff9800]/50 text-[#ff9800] hover:bg-[#ff9800]/10"
                disabled={actionLoading}
                onClick={() => handleAction(() => stopReceiving(channel.signalChannelNo))}
              >
                <Square className="w-3 h-3" />
                Stop
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 gap-1 border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
                disabled={actionLoading}
                onClick={() => handleAction(() => disconnect(channel.signalChannelNo))}
              >
                <Unlink className="w-3 h-3" />
                Disconnect
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 gap-1 border-[#ef5350]/50 text-[#ef5350] hover:bg-[#ef5350]/10 ml-auto"
            disabled={actionLoading}
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="monitor" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="flex-shrink-0 bg-transparent border-b border-[#2a2e39] rounded-none h-auto p-0">
          <TabsTrigger value="monitor" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2962ff] data-[state=active]:text-[#d1d4dc] text-[#787b86] text-xs px-3 py-1.5">
            Monitor
          </TabsTrigger>
          <TabsTrigger value="status" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2962ff] data-[state=active]:text-[#d1d4dc] text-[#787b86] text-xs px-3 py-1.5">
            Status
          </TabsTrigger>
          <TabsTrigger value="signals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2962ff] data-[state=active]:text-[#d1d4dc] text-[#787b86] text-xs px-3 py-1.5">
            Signals
          </TabsTrigger>
          <TabsTrigger value="indicators" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2962ff] data-[state=active]:text-[#d1d4dc] text-[#787b86] text-xs px-3 py-1.5">
            Indicators
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0">
          <TabsContent value="monitor" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <MonitorSection
                strategyNo={strategyNo}
                channel={liveChannel}
                snapshot={snapshot}
                bucketKey={bucketKey}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="status" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <StatusSection channel={liveChannel} status={status} isLoading={isLoadingStatus} snapshot={snapshot} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="signals" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <SignalsSection strategyNo={strategyNo} channelNo={channel.signalChannelNo} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="indicators" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <IndicatorsSection status={status} isLoading={isLoadingStatus} snapshot={snapshot} />
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─── Monitor Section ───

function MonitorSection({
  strategyNo,
  channel,
  snapshot,
  bucketKey,
}: {
  strategyNo: number;
  channel: SignalChannel;
  snapshot: VersionSnapshot;
  bucketKey: number;
}) {
  const [monitor, setMonitor] = useState<ChannelMonitor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const quote = useRealtimeQuote(channel.symbol);
  const tickPrice = quote?.price ?? null;
  const tickPriceRef = useRef(tickPrice);
  tickPriceRef.current = tickPrice;

  const loadMonitor = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchChannelMonitor(strategyNo, channel.signalChannelNo, tickPriceRef.current ?? undefined);
      setMonitor(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [strategyNo, channel.signalChannelNo]);

  useEffect(() => {
    loadMonitor();
  }, [loadMonitor]);

  // 버킷 전환 시 자동 갱신
  useEffect(() => {
    if (bucketKey > 0) loadMonitor();
  }, [bucketKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // indicatorRef → displayName 매핑
  const indicatorNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const ind of snapshot?.indicators ?? []) {
      map.set(ind.userIndicatorConfigNo, ind.displayName);
    }
    return map;
  }, [snapshot]);

  const signalAt = monitor?.lastSignalAt;
  const timeAgo = signalAt ? formatTimeAgo(signalAt) : null;

  const marketSession = monitor?.marketSession;
  const isQuoteAvailable = monitor?.isQuoteAvailable ?? true;

  return (
    <div className="p-3 space-y-3">
      {/* ── Market Session Banner ── */}
      {marketSession && (
        isQuoteAvailable ? (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded border border-[#26a69a]/30 bg-[#26a69a]/10">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#26a69a] animate-pulse" />
              <span className="text-xs font-medium text-[#26a69a]">
                {MARKET_SESSION_LABELS[marketSession] ?? marketSession}
              </span>
            </div>
            <span className="text-[10px] text-[#26a69a]">Quotes active</span>
          </div>
        ) : (
          <div className="px-2.5 py-1.5 rounded border border-[#ff9800]/30 bg-[#ff9800]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#ff9800]" />
                <span className="text-xs font-medium text-[#ff9800]">
                  {MARKET_SESSION_LABELS[marketSession] ?? marketSession}
                </span>
              </div>
              <span className="text-[10px] text-[#ff9800]">Quotes paused</span>
            </div>
            <p className="text-[10px] text-[#ff9800]/70 mt-0.5">
              Stock quotes available 08:00~17:00 ET Mon~Fri
            </p>
          </div>
        )
      )}

      {/* ── Top: Tick Price + State ── */}
      <div className="p-2.5 rounded border border-[#2a2e39] bg-[#131722]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[#787b86] uppercase">Tick</span>
          {tickPrice != null ? (
            <span className="text-sm font-mono font-medium text-[#d1d4dc]">
              ${tickPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
            </span>
          ) : !isQuoteAvailable ? (
            <span className="text-xs text-[#ff9800] italic">market closed</span>
          ) : (
            <span className="text-xs text-[#787b86] italic">waiting...</span>
          )}
          {monitor?.lastSignalType && (
            <>
              <span className="text-[#2a2e39]">·</span>
              <span className="text-[10px] text-[#787b86]">Last:</span>
              <span className={`text-xs font-medium ${monitor.lastSignalType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {monitor.lastSignalType}
              </span>
              {monitor.lastSignalPrice != null && (
                <span className="text-xs font-mono text-[#d1d4dc]">
                  ${Number(monitor.lastSignalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                </span>
              )}
              {monitor.lastSignalType === 'BUY' && monitor.lastSignalPrice != null && tickPrice != null && (() => {
                const entryPrice = Number(monitor.lastSignalPrice);
                const pnl = ((tickPrice - entryPrice) / entryPrice) * 100;
                const isPositive = pnl >= 0;
                return (
                  <span className={`text-xs font-mono font-medium ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                    {isPositive ? '+' : ''}{pnl.toFixed(2)}%
                  </span>
                );
              })()}
              {timeAgo && <span className="text-[10px] text-[#787b86]">({timeAgo})</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px]">
          {monitor?.isInCooldown ? (
            <span className="text-[#ff9800]">
              Cooldown {formatCooldown(monitor.cooldownSecondsRemaining)}
            </span>
          ) : (
            <span className="text-[#787b86]">No cooldown</span>
          )}
          <span className="text-[#2a2e39]">·</span>
          <span className="text-[#787b86]">
            Next: <span className={`font-medium ${monitor?.nextEvaluateRule === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {monitor?.nextEvaluateRule ?? '—'}
            </span>
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-[#787b86] hover:text-[#d1d4dc] ml-auto"
            onClick={loadMonitor}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Rule Evaluations ── */}
      {isLoading && !monitor ? (
        <div className="space-y-2">
          <Skeleton className="h-16 bg-[#131722]" />
          <Skeleton className="h-16 bg-[#131722]" />
        </div>
      ) : monitor?.ruleEvaluations.length === 0 ? (
        <p className="text-xs text-[#787b86] py-4 text-center">
          평가 대상 규칙이 없습니다.
        </p>
      ) : (
        monitor?.ruleEvaluations.map((rule) => (
          <RuleEvalCard
            key={rule.ruleNo}
            rule={rule}
            tickPrice={tickPrice}
            indicatorNameMap={indicatorNameMap}
            lastSignalPrice={monitor.lastSignalPrice}
          />
        ))
      )}

      {/* ── Indicator Summary ── */}
      {monitor && monitor.indicators.length > 0 && (
        <div>
          <div className="text-[10px] text-[#787b86] uppercase tracking-wider mb-1.5">
            Indicators
          </div>
          <div className="space-y-1">
            {monitor.indicators.map((ind) => (
              <div
                key={ind.paramHash}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-[#2a2e39] bg-[#131722] text-xs"
              >
                <span className="text-[#d1d4dc] font-medium shrink-0">{ind.displayName}</span>
                {ind.hasCacheData && ind.values.length > 0 ? (
                  <>
                    <span className="text-[#787b86] font-mono text-[10px] truncate">
                      {Object.entries(ind.values[0].v)
                        .map(([k, v]) => `${k}=${typeof v === 'number' ? v.toFixed(4) : v}`)
                        .join('  ')}
                    </span>
                    <span className="text-[9px] text-[#787b86]/60 shrink-0 ml-auto">
                      {formatUtcTime(ind.values[0].at)}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-[#787b86] italic">No data</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rule Eval Card ───

function RuleEvalCard({
  rule,
  tickPrice,
  indicatorNameMap,
  lastSignalPrice,
}: {
  rule: RuleEvalResult;
  tickPrice: number | null;
  indicatorNameMap: Map<number, string>;
  lastSignalPrice: number | null;
}) {
  const passedLabel = rule.passed ? 'MET' : 'NOT MET';
  const passedCls = rule.passed ? 'text-[#26a69a]' : 'text-[#ef5350]';
  const ruleSideCls = rule.ruleType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]';

  return (
    <div className="rounded border border-[#2a2e39] bg-[#131722] overflow-hidden">
      {/* Rule Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0a0e17]">
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-medium ${ruleSideCls}`}>{rule.ruleType}</span>
          <span className="text-[#787b86]">Rule #{rule.ruleNo}</span>
          <span className="text-[10px] text-[#787b86]">(P{rule.priority})</span>
        </div>
        <span className={`text-[10px] font-medium ${passedCls}`}>{passedLabel}</span>
      </div>
      {/* Condition Tree */}
      <div className="px-2.5 py-2">
        <ConditionNode
          node={rule.conditionTrace}
          depth={0}
          tickPrice={tickPrice}
          indicatorNameMap={indicatorNameMap}
          lastSignalPrice={lastSignalPrice}
        />
      </div>
    </div>
  );
}

// ─── Condition Node (Recursive) ───

function isLeafConditionEval(
  node: ConditionGroupEval | LeafConditionEval,
): node is LeafConditionEval {
  return 'type' in node && !('logic' in node);
}

function ConditionNode({
  node,
  depth,
  tickPrice,
  indicatorNameMap,
  lastSignalPrice,
}: {
  node: ConditionGroupEval | LeafConditionEval;
  depth: number;
  tickPrice: number | null;
  indicatorNameMap: Map<number, string>;
  lastSignalPrice: number | null;
}) {
  if (isLeafConditionEval(node)) {
    return (
      <LeafConditionRow
        leaf={node}
        tickPrice={tickPrice}
        indicatorNameMap={indicatorNameMap}
        lastSignalPrice={lastSignalPrice}
      />
    );
  }

  const group = node;
  const logicCls = group.logic === 'AND' ? 'text-[#2196F3]' : 'text-[#FFD54F]';

  return (
    <div className={depth > 0 ? 'ml-3 pl-2 border-l border-[#2a2e39]' : ''}>
      <span className={`text-[10px] font-bold ${logicCls}`}>{group.logic}</span>
      <div className="space-y-1 mt-0.5">
        {group.conditions.map((child, i) => (
          <ConditionNode
            key={i}
            node={child}
            depth={depth + 1}
            tickPrice={tickPrice}
            indicatorNameMap={indicatorNameMap}
            lastSignalPrice={lastSignalPrice}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Leaf Condition Row ───

function LeafConditionRow({
  leaf,
  tickPrice,
  indicatorNameMap,
  lastSignalPrice,
}: {
  leaf: LeafConditionEval;
  tickPrice: number | null;
  indicatorNameMap: Map<number, string>;
  lastSignalPrice: number | null;
}) {
  const isPosition = leaf.type === 'POSITION';
  const indicatorName = isPosition
    ? 'POSITION'
    : (indicatorNameMap.get(leaf.indicatorRef) ?? `Ref#${leaf.indicatorRef}`);

  // PRICE 조건: targetValue를 tickPrice로 대체 + passed 재계산
  let displayTarget = leaf.targetValue;
  let displayPassed = leaf.passed;
  let displayActual = leaf.actualValue;
  if (leaf.type === 'PRICE' && tickPrice != null) {
    displayTarget = tickPrice;
    displayPassed = leaf.actualValue != null ? compareOp(leaf.actualValue, leaf.operator, tickPrice) : false;
  }
  // POSITION changePercent: tickPrice + lastSignalPrice 기반 실시간 재계산
  if (isPosition && leaf.field === 'changePercent' && tickPrice != null && lastSignalPrice != null && Number(lastSignalPrice) !== 0) {
    const entryPrice = Number(lastSignalPrice);
    displayActual = ((tickPrice - entryPrice) / entryPrice) * 100;
    displayPassed = displayTarget != null ? compareOp(displayActual, leaf.operator, displayTarget) : false;
  }

  const typeBadgeColors: Record<string, string> = {
    THRESHOLD: 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30',
    CROSS: 'bg-[#ab47bc]/20 text-[#ab47bc] border-[#ab47bc]/30',
    PRICE: 'bg-[#ff9800]/20 text-[#ff9800] border-[#ff9800]/30',
    POSITION: 'bg-[#ef5350]/20 text-[#ef5350] border-[#ef5350]/30',
  };

  const positionFieldLabel: Record<string, string> = {
    changePercent: '수익률',
    trailingPercent: '고점 대비',
    highChangePercent: '최고 수익률',
    holdingMinutes: '보유 시간',
  };
  const fieldUnit = isPosition
    ? (leaf.field === 'holdingMinutes' ? '분' : '%')
    : '';

  const operatorLabel = getOperatorLabel(leaf.operator);

  return (
    <div className="flex items-start gap-1.5 py-0.5">
      <span className={`${displayPassed ? 'text-[#26a69a]' : 'text-[#ef5350]'} text-xs leading-4`}>
        {displayPassed ? '\u2705' : '\u274C'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap text-[10px]">
          <Badge className={`${typeBadgeColors[leaf.type] ?? ''} text-[9px] px-1 py-0 h-3.5`}>
            {isPosition ? 'SL/TP' : leaf.type}
          </Badge>
          {isPosition ? (
            <>
              <span className="text-[#d1d4dc] font-medium">{positionFieldLabel[leaf.field] ?? leaf.field}</span>
              <span className={`font-mono ${displayActual != null && displayActual >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {displayActual != null ? `${formatNum(displayActual)}${fieldUnit}` : 'null'}
              </span>
              <span className="text-[#787b86]">{operatorLabel}</span>
              <span className="text-[#ef5350] font-mono">
                {displayTarget != null ? `${formatNum(displayTarget)}${fieldUnit}` : 'null'}
              </span>
              {leaf.field === 'changePercent' && tickPrice != null && lastSignalPrice != null && (
                <span className="text-[9px] text-[#787b86] italic">(live)</span>
              )}
            </>
          ) : (
            <>
              <span className="text-[#d1d4dc] font-medium">{indicatorName}</span>
              <span className="text-[#787b86]">.{leaf.field}</span>
              <span className="text-[#787b86]">=</span>
              <span className="text-[#d1d4dc] font-mono">
                {displayActual != null ? formatNum(displayActual) : 'null'}
              </span>
              <span className="text-[#787b86]">{operatorLabel}</span>
              <span className={`font-mono ${leaf.type === 'PRICE' ? 'text-[#ff9800]' : 'text-[#d1d4dc]'}`}>
                {displayTarget != null ? formatNum(displayTarget) : 'null'}
              </span>
              {leaf.type === 'PRICE' && tickPrice != null && (
                <span className="text-[9px] text-[#787b86] italic">(live)</span>
              )}
            </>
          )}
        </div>
        {/* CROSS: show prev values */}
        {leaf.type === 'CROSS' && (leaf.prevValue != null || leaf.prevTargetValue != null) && (
          <div className="text-[9px] text-[#787b86] mt-0.5 ml-5">
            prev: {leaf.prevValue != null ? formatNum(leaf.prevValue) : '—'} vs{' '}
            {leaf.prevTargetValue != null ? formatNum(leaf.prevTargetValue) : '—'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───

function compareOp(left: number, operator: string, right: number): boolean {
  switch (operator) {
    case 'GT': return left > right;
    case 'GTE': return left >= right;
    case 'LT': return left < right;
    case 'LTE': return left <= right;
    case 'EQ': return Math.abs(left - right) < 0.0001;
    default: return false;
  }
}

function getOperatorLabel(op: string): string {
  const labels: Record<string, string> = {
    ...COMPARISON_OPERATOR_LABELS,
    ...CROSS_OPERATOR_LABELS,
  };
  return labels[op] ?? op;
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatCooldown(seconds: number): string {
  if (seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Status Section ───

function StatusSection({
  channel,
  status,
  isLoading,
  snapshot,
}: {
  channel: SignalChannel;
  status: ChannelStatus | null;
  isLoading: boolean;
  snapshot: SignalChannel['versionSnapshot'];
}) {
  const signalType = status?.lastSignalType ?? channel.lastSignalType;
  const signalAt = status?.lastSignalAt ?? channel.lastSignalAt;
  const signalPrice = status?.lastSignalPrice ?? channel.lastSignalPrice;

  return (
    <div className="p-3 space-y-3">
      {isLoading && !status ? (
        <div className="space-y-2">
          <Skeleton className="h-10 bg-[#131722]" />
          <Skeleton className="h-10 bg-[#131722]" />
        </div>
      ) : (
        <>
          {/* Last Signal */}
          <div className="flex items-center justify-between p-2.5 rounded border border-[#2a2e39] bg-[#131722]">
            <span className="text-[10px] text-[#787b86] uppercase">Last Signal</span>
            {signalType ? (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${signalType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                  {signalType}
                </span>
                {signalPrice != null && (
                  <span className="text-xs text-[#d1d4dc] font-mono">
                    ${Number(signalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                )}
                {signalAt && (
                  <span className="text-[10px] text-[#787b86]">
                    {new Date(signalAt).toLocaleString()}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-[#787b86] italic">No signals yet</span>
            )}
          </div>

          {/* Cooldown + Eval Lock */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2.5 rounded border border-[#2a2e39] bg-[#131722]">
              <span className="text-[10px] text-[#787b86] uppercase">Cooldown</span>
              {status?.isInCooldown ? (
                <span className="flex items-center gap-1 text-[10px] text-[#ff9800]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff9800] animate-pulse" />
                  {status.cooldownSecondsRemaining}s
                </span>
              ) : (
                <span className="text-[10px] text-[#787b86]">-</span>
              )}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded border border-[#2a2e39] bg-[#131722]">
              <span className="text-[10px] text-[#787b86] uppercase">Eval Lock</span>
              {status?.isEvalLocked ? (
                <span className="flex items-center gap-1 text-[10px] text-[#ef5350]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef5350] animate-pulse" />
                  Locked
                </span>
              ) : (
                <span className="text-[10px] text-[#787b86]">-</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Channel Meta */}
      <div className="p-2.5 rounded border border-[#2a2e39] bg-[#131722]">
        <div className="text-[10px] text-[#787b86] uppercase tracking-wider mb-1.5">Channel Info</div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div>
            <span className="text-[#787b86]">Symbol </span>
            <span className="text-[#d1d4dc] font-mono">{channel.symbol}</span>
          </div>
          <div>
            <span className="text-[#787b86]">Timeframe </span>
            <span className="text-[#d1d4dc] font-mono">{channel.timeframe}</span>
          </div>
          <div>
            <span className="text-[#787b86]">Delivery </span>
            <span className="text-[#d1d4dc]">{channel.deliveryType}</span>
          </div>
          <div>
            <span className="text-[#787b86]">Created </span>
            <span className="text-[#d1d4dc]">{new Date(channel.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Rules summary (compact) */}
      {snapshot && (snapshot.buyRules.length > 0 || snapshot.sellRules.length > 0) && (
        <div>
          <div className="text-[10px] text-[#787b86] uppercase tracking-wider mb-1.5">
            Rules (BUY {snapshot.buyRules.length} / SELL {snapshot.sellRules.length})
          </div>
          <div className="space-y-1">
            {[
              ...snapshot.buyRules.map((r) => ({ ...r, side: 'BUY' as const })),
              ...snapshot.sellRules.map((r) => ({ ...r, side: 'SELL' as const })),
            ].map((rule, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 rounded border border-[#2a2e39] bg-[#131722] text-xs"
              >
                <span className={`font-medium font-mono ${rule.side === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                  {rule.side}
                </span>
                <span className="text-[#787b86]">P{rule.priority}</span>
                <span className="text-[10px] text-[#787b86] truncate">
                  {summarizeConditions(rule.conditions)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Signals Section ───

function SignalsSection({
  strategyNo,
  channelNo,
}: {
  strategyNo: number;
  channelNo: number;
}) {
  const { channelLogs, isLoadingLogs, loadLogs } = useSignalChannels(strategyNo);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    loadLogs(channelNo, 1, limit);
    setPage(1);
  }, [channelNo, loadLogs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadLogs(channelNo, newPage, limit);
  };

  return (
    <div className="p-3">
      {isLoadingLogs ? (
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 bg-[#131722]" />
          ))}
        </div>
      ) : channelLogs.length === 0 ? (
        <p className="text-xs text-[#787b86] py-8 text-center">
          시그널 이력이 없습니다.
        </p>
      ) : (
        <>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2e39] text-[#787b86]">
                <th className="text-left py-1.5 px-2">Type</th>
                <th className="text-right py-1.5 px-2">Price</th>
                <th className="text-left py-1.5 px-2">Rule</th>
                <th className="text-right py-1.5 px-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {channelLogs.map((log) => (
                <tr
                  key={log.signalChannelLogNo}
                  className="border-b border-[#2a2e39]/50 hover:bg-[#131722]/50"
                >
                  <td className="py-1.5 px-2">
                    <span className={`font-medium ${log.signalType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                      {log.signalType}
                    </span>
                  </td>
                  <td className="text-right py-1.5 px-2 text-[#d1d4dc] font-mono">
                    ${Number(log.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </td>
                  <td className="py-1.5 px-2 text-[#787b86]">{log.matchedRuleType}</td>
                  <td className="text-right py-1.5 px-2 text-[#787b86]">
                    {new Date(log.evaluatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2e39]">
            <span className="text-[10px] text-[#787b86]">
              Page {page} · {channelLogs.length} entries
            </span>
            <div className="flex gap-1">
              <Button
                size="sm" variant="outline"
                className="h-5 text-[10px] px-2 border-[#2a2e39] text-[#d1d4dc] hover:bg-[#2a2e39]"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm" variant="outline"
                className="h-5 text-[10px] px-2 border-[#2a2e39] text-[#d1d4dc] hover:bg-[#2a2e39]"
                disabled={channelLogs.length < limit}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Indicators Section ───

function IndicatorsSection({
  status,
  isLoading,
  snapshot,
}: {
  status: ChannelStatus | null;
  isLoading: boolean;
  snapshot: SignalChannel['versionSnapshot'];
}) {
  const indicators = status?.indicators ?? [];

  return (
    <div className="p-3 space-y-3">
      {isLoading && !status ? (
        <div className="space-y-2">
          <Skeleton className="h-20 bg-[#131722]" />
          <Skeleton className="h-20 bg-[#131722]" />
        </div>
      ) : indicators.length === 0 ? (
        <p className="text-xs text-[#787b86] py-8 text-center">
          설정된 지표가 없습니다.
        </p>
      ) : (
        indicators.map((ind) => (
          <IndicatorCard key={ind.paramHash} indicator={ind} />
        ))
      )}

      {/* Drawings (if any) */}
      {snapshot?.drawingSnapshots && Object.keys(snapshot.drawingSnapshots).length > 0 && (
        <div>
          <div className="text-[10px] text-[#787b86] uppercase tracking-wider mb-1.5">
            Drawings
          </div>
          <div className="space-y-1">
            {Object.entries(snapshot.drawingSnapshots).map(([key, items]) => (
              <div key={key} className="px-2 py-1 rounded text-xs bg-[#131722] border border-[#2a2e39]">
                <span className="text-[#787b86] font-mono">{key}</span>
                <span className="text-[#d1d4dc] ml-2">{(items as unknown[]).length} drawings</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ───

function IndicatorCard({ indicator: ind }: { indicator: ChannelIndicatorCache }) {
  return (
    <div className="p-2.5 rounded border border-[#2a2e39] bg-[#131722]">
      <div className="flex items-center gap-2 mb-1.5">
        <Badge className="bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30 text-[10px]">
          {ind.indicatorType}
        </Badge>
        <span className="text-xs text-[#d1d4dc]">{ind.displayName}</span>
        <span className="text-[10px] text-[#787b86] ml-auto font-mono">
          {Object.entries(ind.parameters).map(([k, v]) => `${k}=${v}`).join(', ')}
        </span>
      </div>

      {!ind.hasCacheData ? (
        <p className="text-[10px] text-[#787b86] italic">No cached data</p>
      ) : (
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-[#2a2e39] text-[#787b86]">
              <th className="text-left py-1 px-1">Time</th>
              {ind.values.length > 0 &&
                Object.keys(ind.values[0].v).map((field) => (
                  <th key={field} className="text-right py-1 px-1">{field}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {ind.values.slice(0, 5).map((entry, idx) => (
              <tr key={idx} className="border-b border-[#2a2e39]/30">
                <td className="py-1 px-1 text-[#787b86]">
                  {formatUtcDateTime(entry.at)}
                </td>
                {Object.values(entry.v).map((val, vi) => (
                  <td key={vi} className="text-right py-1 px-1 text-[#d1d4dc] font-mono">
                    {typeof val === 'number' ? val.toFixed(4) : String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function summarizeConditions(conditions: Record<string, unknown> | undefined): string {
  if (!conditions) return '(empty)';
  const group = conditions as { logic?: string; conditions?: unknown[] };
  if (group.logic && group.conditions) {
    return `${group.logic} (${group.conditions.length} conditions)`;
  }
  return JSON.stringify(conditions).slice(0, 80);
}
