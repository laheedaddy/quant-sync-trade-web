'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useBacktest } from '@/hooks/use-backtest';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  BacktestConditionLog,
  RuleEvalResult,
  ConditionGroupEval,
  LeafConditionEval,
} from '@/types/backtest';

function isLeaf(
  node: ConditionGroupEval | LeafConditionEval,
): node is LeafConditionEval {
  return 'indicatorRef' in node;
}

function formatOperator(op: string): string {
  switch (op) {
    case 'GT': return '>';
    case 'GTE': return '>=';
    case 'LT': return '<';
    case 'LTE': return '<=';
    case 'EQ': return '=';
    case 'BETWEEN': return 'BETWEEN';
    case 'CROSS_ABOVE': return 'CROSS ABOVE';
    case 'CROSS_BELOW': return 'CROSS BELOW';
    default: return op;
  }
}

function formatValue(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'N/A';
  return Number(v).toFixed(4);
}

function ConditionNode({
  node,
  depth,
  isLast,
}: {
  node: ConditionGroupEval | LeafConditionEval;
  depth: number;
  isLast: boolean;
}) {
  if (isLeaf(node)) {
    const icon = node.passed ? '\u2713' : '\u2717';
    const color = node.passed ? 'text-[#26a69a]' : 'text-[#ef5350]';
    const typeColor =
      node.type === 'THRESHOLD' ? 'bg-[#26a69a]/20 text-[#26a69a]' :
      node.type === 'CROSS' ? 'bg-[#ab47bc]/20 text-[#ab47bc]' :
      'bg-[#ff9800]/20 text-[#ff9800]';

    return (
      <div className="flex items-start gap-1.5 py-0.5" style={{ paddingLeft: depth * 16 }}>
        <span className="text-[#787b86] text-[10px] flex-shrink-0 w-3 mt-0.5">
          {isLast ? '\u2514' : '\u251C'}
        </span>
        <span className={`font-mono text-xs ${color}`}>{icon}</span>
        <span className={`text-[10px] px-1 rounded font-medium ${typeColor}`}>
          {node.type}
        </span>
        <span className="text-xs text-[#d1d4dc] font-mono">
          {node.type === 'CROSS' ? (
            <>
              ref({node.indicatorRef}).{node.field} {formatOperator(node.operator)} target
              <span className="text-[#787b86] ml-1">
                (curr: {formatValue(node.actualValue)} {formatOperator(node.operator)} {formatValue(node.targetValue)}
                {(node.prevValue !== undefined && node.prevValue !== null) && (
                  <> | prev: {formatValue(node.prevValue)} vs {formatValue(node.prevTargetValue)}</>
                )}
                )
              </span>
            </>
          ) : (
            <>
              ref({node.indicatorRef}).{node.field} = {formatValue(node.actualValue)}{' '}
              {formatOperator(node.operator)}{' '}
              {node.type === 'PRICE' && node.priceField ? (
                <><span className="text-[#ff9800]">{node.priceField}</span>({formatValue(node.targetValue)})</>
              ) : (
                formatValue(node.targetValue)
              )}
            </>
          )}
        </span>
      </div>
    );
  }

  // Group node
  const group = node as ConditionGroupEval;
  const icon = group.passed ? '\u2713' : '\u2717';
  const color = group.passed ? 'text-[#26a69a]' : 'text-[#ef5350]';
  const logicColor = group.logic === 'AND' ? 'text-[#2196F3]' : 'text-[#FFD54F]';

  return (
    <div>
      {depth > 0 && (
        <div className="flex items-center gap-1.5 py-0.5" style={{ paddingLeft: depth * 16 }}>
          <span className="text-[#787b86] text-[10px] flex-shrink-0 w-3">
            {isLast ? '\u2514' : '\u251C'}
          </span>
          <span className={`font-mono text-xs ${color}`}>{icon}</span>
          <span className={`text-xs font-bold ${logicColor}`}>{group.logic}</span>
        </div>
      )}
      {depth === 0 && (
        <div className="flex items-center gap-1.5 py-0.5">
          <span className={`font-mono text-xs ${color}`}>{icon}</span>
          <span className={`text-xs font-bold ${logicColor}`}>{group.logic}</span>
        </div>
      )}
      {group.conditions.map((child, idx) => (
        <ConditionNode
          key={idx}
          node={child}
          depth={depth + 1}
          isLast={idx === group.conditions.length - 1}
        />
      ))}
    </div>
  );
}

function RuleTraceView({ rule }: { rule: RuleEvalResult }) {
  const passIcon = rule.passed ? '\u2713 PASS' : '\u2717 FAIL';
  const passColor = rule.passed ? 'text-[#26a69a]' : 'text-[#ef5350]';
  const typeColor = rule.ruleType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]';

  return (
    <div className="py-1.5 border-b border-[#2a2e39] last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-mono font-semibold ${typeColor}`}>
          {rule.ruleType} Rule #{rule.ruleNo}
        </span>
        <span className="text-[10px] text-[#787b86]">P{rule.priority}</span>
        <span className={`text-xs font-mono font-medium ${passColor}`}>
          {passIcon}
        </span>
      </div>
      <div className="pl-2">
        <ConditionNode node={rule.conditionTrace} depth={0} isLast />
      </div>
    </div>
  );
}

function LogRow({ log }: { log: BacktestConditionLog }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(log.candleTimestamp);
  const mon = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const dateStr = `${mon}/${day} ${h}:${m}`;

  const anyPassed = log.ruleResults.some((r) => r.passed);
  const resultColor = anyPassed ? 'text-[#26a69a]' : 'text-[#ef5350]';
  const resultText = anyPassed ? 'PASS' : 'FAIL';

  const actionColor =
    log.action === 'ENTRY' ? 'bg-[#26a69a]/10 text-[#26a69a]' :
    log.action === 'EXIT' ? 'bg-[#ef5350]/10 text-[#ef5350]' : '';

  const rowBg =
    log.action === 'ENTRY' ? 'bg-[#26a69a]/5' :
    log.action === 'EXIT' ? 'bg-[#ef5350]/5' : '';

  return (
    <Fragment>
      <tr
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer hover:bg-[#1e222d] transition-colors ${rowBg}`}
      >
        <td className="px-2 py-1 text-xs text-[#d1d4dc] font-mono whitespace-nowrap">
          {expanded ? (
            <ChevronDown className="w-3 h-3 inline mr-1 text-[#787b86]" />
          ) : (
            <ChevronUp className="w-3 h-3 inline mr-1 text-[#787b86] rotate-180" />
          )}
          {dateStr}
        </td>
        <td className="px-2 py-1 text-xs text-[#d1d4dc] font-mono text-right">
          {Number(log.closePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td className="px-2 py-1 text-xs text-[#787b86]">
          {log.positionState}
        </td>
        <td className="px-2 py-1">
          <span className={`text-xs font-mono font-medium ${
            log.evaluatedRuleType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'
          }`}>
            {log.evaluatedRuleType}
          </span>
        </td>
        <td className="px-2 py-1">
          <span className={`text-xs font-mono ${resultColor}`}>
            {anyPassed ? '\u2713' : '\u2717'} {resultText}
          </span>
        </td>
        <td className="px-2 py-1">
          {log.action && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${actionColor}`}>
              {log.action}
            </span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 py-2 bg-[#0a0e17] border-b border-[#2a2e39]">
            <div className="space-y-1">
              {log.ruleResults.map((rule, idx) => (
                <RuleTraceView key={idx} rule={rule} />
              ))}
              {log.ruleResults.length === 0 && (
                <span className="text-xs text-[#787b86]">No rules evaluated</span>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function BacktestConditionLogTable() {
  const {
    currentRun,
    conditionLogs,
    conditionLogsTotalCount,
    conditionLogsPage,
    isLoadingConditionLogs,
    loadConditionLogs,
  } = useBacktest();

  useEffect(() => {
    if (currentRun?.backtestRunNo && currentRun.status === 'COMPLETED') {
      loadConditionLogs(currentRun.backtestRunNo, 1);
    }
  }, [currentRun?.backtestRunNo, currentRun?.status, loadConditionLogs]);

  const totalPages = Math.ceil(conditionLogsTotalCount / 50) || 1;

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!currentRun?.backtestRunNo) return;
      if (newPage < 1 || newPage > totalPages) return;
      loadConditionLogs(currentRun.backtestRunNo, newPage);
    },
    [currentRun?.backtestRunNo, totalPages, loadConditionLogs],
  );

  if (!currentRun) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[#787b86]">Run a backtest to see debug logs</p>
      </div>
    );
  }

  if (currentRun.status === 'FAILED') {
    return (
      <div className="p-4">
        <div className="p-3 rounded border border-[#ef5350]/30 bg-[#ef5350]/5">
          <p className="text-xs text-[#ef5350]">
            Backtest failed: {currentRun.errorMessage || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingConditionLogs) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-[#2962ff]/30 border-t-[#2962ff] rounded-full animate-spin" />
          <span className="text-sm text-[#787b86]">Loading condition logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-[#1e222d] z-10">
            <tr className="border-b border-[#2a2e39]">
              <th className="px-2 py-1.5 text-left text-[10px] text-[#787b86] font-medium uppercase tracking-wider">
                Date
              </th>
              <th className="px-2 py-1.5 text-right text-[10px] text-[#787b86] font-medium uppercase tracking-wider">
                Close
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] text-[#787b86] font-medium uppercase tracking-wider">
                Position
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] text-[#787b86] font-medium uppercase tracking-wider">
                Type
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] text-[#787b86] font-medium uppercase tracking-wider">
                Result
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] text-[#787b86] font-medium uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {conditionLogs.map((log) => (
              <LogRow key={log.backtestConditionLogNo} log={log} />
            ))}
            {conditionLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#787b86]">
                  No condition logs available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {conditionLogsTotalCount > 50 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#2a2e39] flex-shrink-0">
          <span className="text-[10px] text-[#787b86]">
            {conditionLogsTotalCount} rows / Page {conditionLogsPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(conditionLogsPage - 1)}
              disabled={conditionLogsPage <= 1}
              className="h-6 w-6 p-0 text-[#787b86] hover:text-[#d1d4dc]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(conditionLogsPage + 1)}
              disabled={conditionLogsPage >= totalPages}
              className="h-6 w-6 p-0 text-[#787b86] hover:text-[#d1d4dc]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
