'use client';

import type { ChartCandle, ChartIndicator, UserChartDrawing } from '@/types/chart';
import { formatPrice } from '@/lib/utils/format';
import { INDICATOR_COLORS } from '@/lib/chart/theme';
import { Eye, EyeOff, Settings, X } from 'lucide-react';

/** Bandwidth 파생 필드 — 차트 시리즈가 아니므로 가격 레전드에서 분리 표시 */
const BANDWIDTH_KEYS = new Set(['bandwidth', 'bandwidthPercentile', 'bandwidthSma', 'bandwidthRatio']);

interface IndicatorActions {
  onEdit: (configNo: number) => void;
  onToggle: (configNo: number) => void;
  onDelete: (configNo: number) => void;
}

interface DrawingActions {
  onEdit: (drawingNo: number) => void;
  onToggle: (drawingNo: number) => void;
  onDelete: (drawingNo: number) => void;
}

interface ChartLegendProps {
  candle: ChartCandle | null;
  indicators: ChartIndicator[];
  indicatorActions?: IndicatorActions;
  activeConfigNos?: number[];
  drawings?: UserChartDrawing[];
  drawingActions?: DrawingActions;
  activeDrawingNos?: number[];
  /** 크로스헤어 위치의 Unix timestamp (초 단위) — 드로잉 채널 값 계산용 */
  crosshairTimeSec?: number | null;
  indicatorColorMap?: Map<number, Record<string, string>>;
}

export function ChartLegend({ candle, indicators, indicatorActions, activeConfigNos, drawings, drawingActions, activeDrawingNos, crosshairTimeSec, indicatorColorMap }: ChartLegendProps) {
  if (!candle) return null;

  const isUp = candle.closePrice >= candle.openPrice;
  const changeColor = isUp ? '#26a69a' : '#ef5350';

  const overlayIndicators = indicators.filter((ind) =>
    ['MA', 'EMA', 'BOLLINGER', 'SUPERTREND', 'ICHIMOKU', 'KELTNER', 'DONCHIAN', 'VWAP', 'PIVOT', 'PSAR'].includes(ind.indicatorType),
  );

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
      {/* OHLCV */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-[#787b86]">O</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.openPrice)}</span>
        <span className="text-[#787b86]">H</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.highPrice)}</span>
        <span className="text-[#787b86]">L</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.lowPrice)}</span>
        <span className="text-[#787b86]">C</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.closePrice)}</span>
      </div>

      {/* Overlay Indicator Values */}
      {overlayIndicators.map((ind) => (
        <IndicatorLegendLine
          key={ind.indicatorConfigNo}
          indicator={ind}
          actions={indicatorActions}
          isActive={activeConfigNos?.includes(ind.indicatorConfigNo) ?? true}
          customColors={indicatorColorMap?.get(ind.indicatorConfigNo)}
          hoveredTradedAt={candle?.tradedAt}
        />
      ))}

      {/* Drawing Legend */}
      {drawings && drawings.length > 0 && drawings.map((d, idx) => (
        <DrawingLegendLine
          key={d.userChartDrawingNo}
          drawing={d}
          index={idx}
          actions={drawingActions}
          isActive={activeDrawingNos?.includes(d.userChartDrawingNo) ?? true}
          crosshairTimeSec={crosshairTimeSec}
        />
      ))}
    </div>
  );
}

interface IndicatorLegendLineProps {
  indicator: ChartIndicator;
  actions?: IndicatorActions;
  isActive: boolean;
  customColors?: Record<string, string>;
  hoveredTradedAt?: string | null;
}

function IndicatorLegendLine({ indicator, actions, isActive, customColors, hoveredTradedAt }: IndicatorLegendLineProps) {
  const displayData = (() => {
    if (hoveredTradedAt) {
      const targetTs = Math.floor(new Date(hoveredTradedAt).getTime() / 1000);
      const matched = indicator.data.find((d) =>
        Math.floor(new Date(d.calculatedAt).getTime() / 1000) === targetTs,
      );
      if (matched) return matched;
    }
    return indicator.data[indicator.data.length - 1];
  })();
  if (!displayData) return null;

  const color = customColors
    ? Object.values(customColors)[0] ?? getIndicatorColor(indicator.indicatorType)
    : getIndicatorColor(indicator.indicatorType);

  return (
    <div className={`group flex items-center gap-1.5 text-xs font-mono pointer-events-auto${isActive ? '' : ' opacity-40'}`}>
      {/* 이름 클릭 → 설정 다이얼로그 */}
      <span
        style={{ color }}
        className={`font-semibold ${actions ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
        onClick={actions ? () => actions.onEdit(indicator.indicatorConfigNo) : undefined}
      >
        {indicator.displayName}
      </span>

      {/* 호버 시 액션 버튼 (설정 / 토글 / 삭제) */}
      {actions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => actions.onEdit(indicator.indicatorConfigNo)}
            className="p-0.5 text-[#9598a1] hover:text-[#d1d4dc] transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => actions.onToggle(indicator.indicatorConfigNo)}
            className="p-0.5 text-[#9598a1] hover:text-[#d1d4dc] transition-colors"
            title={isActive ? 'Hide' : 'Show'}
          >
            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => actions.onDelete(indicator.indicatorConfigNo)}
            className="p-0.5 text-[#9598a1] hover:text-[#ef5350] transition-colors"
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 값 표시 (숨겨진 상태에서는 값 생략) */}
      {isActive && Object.entries(displayData.value)
        .filter(([key]) => !BANDWIDTH_KEYS.has(key))
        .map(([key, val]) => (
          <span key={key} style={{ color }} className="opacity-80">
            {typeof val === 'number' ? formatPrice(val) : String(val)}
          </span>
        ))}
      {/* Bandwidth 파생 지표 (BOLLINGER 전용) */}
      {isActive && indicator.indicatorType === 'BOLLINGER' && (() => {
        const bw = displayData.value as Record<string, unknown>;
        const hasBw = typeof bw.bandwidth === 'number';
        if (!hasBw) return null;
        return (
          <span className="text-[#787b86] text-[10px] ml-1">
            BW {(bw.bandwidth as number).toFixed(2)}%
            {typeof bw.bandwidthPercentile === 'number' && (
              <> · Pctl <span className={
                (bw.bandwidthPercentile as number) <= 20 ? 'text-[#26a69a]' :
                (bw.bandwidthPercentile as number) >= 80 ? 'text-[#ef5350]' : 'text-[#d1d4dc]'
              }>{(bw.bandwidthPercentile as number).toFixed(0)}</span></>
            )}
            {typeof bw.bandwidthRatio === 'number' && (
              <> · Ratio <span className={
                (bw.bandwidthRatio as number) >= 1.0 ? 'text-[#ef5350]' : 'text-[#26a69a]'
              }>{(bw.bandwidthRatio as number).toFixed(2)}</span></>
            )}
          </span>
        );
      })()}
    </div>
  );
}

interface DrawingLegendLineProps {
  drawing: UserChartDrawing;
  index: number;
  actions?: DrawingActions;
  isActive: boolean;
  crosshairTimeSec?: number | null;
}

function DrawingLegendLine({ drawing, index, actions, isActive, crosshairTimeSec }: DrawingLegendLineProps) {
  const isSnapshot = drawing.userChartDrawingNo < 0;
  const color = isSnapshot ? '#ff9800' : (drawing.style.lineColor ?? '#2962ff');

  let label: string;
  switch (drawing.drawingType) {
    case 'RAY':
      label = isSnapshot ? `Ray #${index + 1}` : `Ray #${drawing.userChartDrawingNo}`;
      break;
    case 'HORIZONTAL_LINE':
      label = 'H-Line';
      break;
    default:
      label = isSnapshot ? `Channel #${index + 1}` : `Channel #${drawing.userChartDrawingNo}`;
      break;
  }

  const channelValues = drawing.drawingType === 'PARALLEL_CHANNEL' && crosshairTimeSec != null
    ? computeChannelAtTime(drawing.points, drawing.style.priceScaleMode ?? 0, crosshairTimeSec)
    : null;

  const hLinePrice = drawing.drawingType === 'HORIZONTAL_LINE' && drawing.points.length > 0
    ? drawing.points[0].price
    : null;

  return (
    <div className={`group flex items-center gap-1.5 text-xs font-mono pointer-events-auto${isActive ? '' : ' opacity-40'}`}>
      <span
        className="w-3 h-0.5 rounded-full inline-block flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span style={{ color }} className="font-semibold cursor-default">
        {label}
      </span>

      {!isSnapshot && actions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => actions.onEdit(drawing.userChartDrawingNo)}
            className="p-0.5 text-[#9598a1] hover:text-[#d1d4dc] transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => actions.onToggle(drawing.userChartDrawingNo)}
            className="p-0.5 text-[#9598a1] hover:text-[#d1d4dc] transition-colors"
            title={isActive ? 'Hide' : 'Show'}
          >
            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => actions.onDelete(drawing.userChartDrawingNo)}
            className="p-0.5 text-[#9598a1] hover:text-[#ef5350] transition-colors"
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isActive && channelValues && (
        <>
          <span className="text-[#787b86]">U</span>
          <span style={{ color }} className="opacity-80">{formatPrice(channelValues.upper)}</span>
          <span className="text-[#787b86]">M</span>
          <span style={{ color }} className="opacity-80">{formatPrice(channelValues.middle)}</span>
          <span className="text-[#787b86]">L</span>
          <span style={{ color }} className="opacity-80">{formatPrice(channelValues.lower)}</span>
        </>
      )}

      {isActive && hLinePrice !== null && (
        <span style={{ color }} className="opacity-80">{formatPrice(hLinePrice)}</span>
      )}
    </div>
  );
}

/**
 * 드로잉 채널의 특정 시점 upper/middle/lower를 계산합니다.
 * 서버 indicator-algorithm.service.ts의 computeDrawingChannelAtTime()과 동일한 수식.
 */
function computeChannelAtTime(
  points: import('@/types/chart').DrawingPoint[],
  priceScaleMode: number,
  timestampSec: number,
): { upper: number; middle: number; lower: number } | null {
  if (points.length < 3) return null;

  const p0Time = points[0].time;
  const p0Price = points[0].price;
  const p1Time = points[1].time;
  const p1Price = points[1].price;
  const p2Time = points[2].time;
  const p2Price = points[2].price;

  if (!p0Time || !p0Price || !p1Time || !p1Price || !p2Time || !p2Price) return null;
  if (p1Time === p0Time) return null;

  // offset = p2와 line1(p0→p1)의 p2 시점 값 차이 (서버는 투영 후 전달하므로 여기서 직접 계산)
  if (priceScaleMode === 1 && p0Price > 0 && p1Price > 0 && p2Price > 0) {
    const logP0 = Math.log(p0Price);
    const logSlope = (Math.log(p1Price) - logP0) / (p1Time - p0Time);
    const logLine1AtP2 = logP0 + logSlope * (p2Time - p0Time);
    const logOffset = Math.log(p2Price) - logLine1AtP2;
    const logLine1 = logP0 + logSlope * (timestampSec - p0Time);
    const line1 = Math.exp(logLine1);
    const line2 = Math.exp(logLine1 + logOffset);
    return {
      upper: Math.max(line1, line2),
      middle: Math.exp(logLine1 + logOffset / 2),
      lower: Math.min(line1, line2),
    };
  }

  const slope = (p1Price - p0Price) / (p1Time - p0Time);
  const line1AtP2 = p0Price + slope * (p2Time - p0Time);
  const offset = p2Price - line1AtP2;
  const line1 = p0Price + slope * (timestampSec - p0Time);
  const line2 = line1 + offset;
  return {
    upper: Math.max(line1, line2),
    middle: (line1 + line2) / 2,
    lower: Math.min(line1, line2),
  };
}

function getIndicatorColor(type: string): string {
  switch (type) {
    case 'MA': return INDICATOR_COLORS.MA;
    case 'EMA': return INDICATOR_COLORS.EMA;
    case 'BOLLINGER': return INDICATOR_COLORS.BOLLINGER_MIDDLE;
    case 'RSI': return INDICATOR_COLORS.RSI;
    case 'MACD': return INDICATOR_COLORS.MACD_LINE;
    case 'STOCHASTIC': return INDICATOR_COLORS.STOCHASTIC_K;
    case 'ADX': return INDICATOR_COLORS.ADX;
    case 'SUPERTREND': return INDICATOR_COLORS.SUPERTREND;
    case 'ICHIMOKU': return INDICATOR_COLORS.ICHIMOKU_TENKAN;
    case 'CCI': return INDICATOR_COLORS.CCI;
    case 'ROC': return INDICATOR_COLORS.ROC;
    case 'ATR': return INDICATOR_COLORS.ATR;
    case 'KELTNER': return INDICATOR_COLORS.KELTNER_MIDDLE;
    case 'DONCHIAN': return INDICATOR_COLORS.DONCHIAN_MIDDLE;
    case 'OBV': return INDICATOR_COLORS.OBV;
    case 'VWAP': return INDICATOR_COLORS.VWAP;
    case 'PIVOT': return INDICATOR_COLORS.PIVOT_PP;
    case 'PSAR': return INDICATOR_COLORS.PSAR;
    case 'TREND_SCORE': return INDICATOR_COLORS.TREND_SCORE;
    default: return '#d1d4dc';
  }
}
