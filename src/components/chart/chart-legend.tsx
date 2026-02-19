'use client';

import type { ChartCandle, ChartIndicator, UserChartDrawing } from '@/types/chart';
import { formatPrice } from '@/lib/utils/format';
import { INDICATOR_COLORS } from '@/lib/chart/theme';
import { Eye, EyeOff, X } from 'lucide-react';

interface IndicatorActions {
  onEdit: (configNo: number) => void;
  onToggle: (configNo: number) => void;
  onDelete: (configNo: number) => void;
}

interface DrawingActions {
  onDelete: (drawingNo: number) => void;
}

interface ChartLegendProps {
  candle: ChartCandle | null;
  indicators: ChartIndicator[];
  indicatorActions?: IndicatorActions;
  activeConfigNos?: number[];
  drawings?: UserChartDrawing[];
  drawingActions?: DrawingActions;
  /** 크로스헤어 위치의 Unix timestamp (초 단위) — 드로잉 채널 값 계산용 */
  crosshairTimeSec?: number | null;
}

export function ChartLegend({ candle, indicators, indicatorActions, activeConfigNos, drawings, drawingActions, crosshairTimeSec }: ChartLegendProps) {
  if (!candle) return null;

  const isUp = candle.closePrice >= candle.openPrice;
  const changeColor = isUp ? '#26a69a' : '#ef5350';

  const overlayIndicators = indicators.filter((ind) => ['MA', 'EMA', 'BOLLINGER'].includes(ind.indicatorType));

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-auto">
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
        />
      ))}

      {/* Drawing Legend */}
      {drawings && drawings.length > 0 && drawings.map((d, idx) => (
        <DrawingLegendLine
          key={d.userChartDrawingNo}
          drawing={d}
          index={idx}
          actions={drawingActions}
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
}

function IndicatorLegendLine({ indicator, actions, isActive }: IndicatorLegendLineProps) {
  const lastData = indicator.data[indicator.data.length - 1];
  if (!lastData) return null;

  const color = getIndicatorColor(indicator.indicatorType);

  return (
    <div className={`group/legend flex items-center gap-1.5 text-xs font-mono${isActive ? '' : ' opacity-40'}`}>
      {/* 이름 클릭 → 설정 다이얼로그 */}
      <span
        style={{ color }}
        className={`font-semibold ${actions ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
        onClick={actions ? () => actions.onEdit(indicator.indicatorConfigNo) : undefined}
      >
        {indicator.displayName}
      </span>

      {/* 호버 시 액션 버튼 (토글 / 삭제) */}
      {actions && (
        <div className="flex items-center gap-0 opacity-0 group-hover/legend:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => actions.onToggle(indicator.indicatorConfigNo)}
            className="p-0.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
            title={isActive ? 'Hide' : 'Show'}
          >
            {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <button
            onClick={() => actions.onDelete(indicator.indicatorConfigNo)}
            className="p-0.5 text-[#787b86] hover:text-[#ef5350] transition-colors"
            title="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 값 표시 (숨겨진 상태에서는 값 생략) */}
      {isActive && Object.entries(lastData.value).map(([key, val]) => (
        <span key={key} style={{ color }} className="opacity-80">
          {typeof val === 'number' ? formatPrice(val) : String(val)}
        </span>
      ))}
    </div>
  );
}

interface DrawingLegendLineProps {
  drawing: UserChartDrawing;
  index: number;
  actions?: DrawingActions;
  crosshairTimeSec?: number | null;
}

function DrawingLegendLine({ drawing, index, actions, crosshairTimeSec }: DrawingLegendLineProps) {
  const isSnapshot = drawing.userChartDrawingNo < 0;
  const color = isSnapshot ? '#ff9800' : (drawing.style.lineColor ?? '#2962ff');
  const label = isSnapshot
    ? `Channel #${index + 1}`
    : `Channel #${drawing.userChartDrawingNo}`;

  const channelValues = crosshairTimeSec != null
    ? computeChannelAtTime(drawing.points, drawing.style.priceScaleMode ?? 0, crosshairTimeSec)
    : null;

  return (
    <div className="group/drawing flex items-center gap-1.5 text-xs font-mono">
      <span
        className="w-3 h-0.5 rounded-full inline-block flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span style={{ color }} className="font-semibold cursor-default">
        {label}
      </span>

      {!isSnapshot && actions && (
        <div className="flex items-center gap-0 opacity-0 group-hover/drawing:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => actions.onDelete(drawing.userChartDrawingNo)}
            className="p-0.5 text-[#787b86] hover:text-[#ef5350] transition-colors"
            title="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {channelValues && (
        <>
          <span className="text-[#787b86]">U</span>
          <span style={{ color }} className="opacity-80">{formatPrice(channelValues.upper)}</span>
          <span className="text-[#787b86]">M</span>
          <span style={{ color }} className="opacity-80">{formatPrice(channelValues.middle)}</span>
          <span className="text-[#787b86]">L</span>
          <span style={{ color }} className="opacity-80">{formatPrice(channelValues.lower)}</span>
        </>
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
    default: return '#d1d4dc';
  }
}
