import type {
  ISeriesPrimitive,
  SeriesAttachedParameter,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';
import type { DrawingPoint, DrawingStyle } from '@/types/chart';
import type { IDrawingPrimitive } from './drawing-primitive';

interface PixelPoint {
  x: number;
  y: number;
}

const DEFAULT_STYLE: Required<Pick<DrawingStyle, 'lineColor' | 'lineWidth'>> = {
  lineColor: '#2962ff',
  lineWidth: 2,
};

class RayRenderer implements IPrimitivePaneRenderer {
  private _start: PixelPoint | null = null;
  private _end: PixelPoint | null = null;
  private _lineColor = DEFAULT_STYLE.lineColor;
  private _lineWidth = DEFAULT_STYLE.lineWidth;
  private _chartWidth = 0;

  update(
    start: PixelPoint | null,
    end: PixelPoint | null,
    lineColor: string,
    lineWidth: number,
    chartWidth: number,
  ): void {
    this._start = start;
    this._end = end;
    this._lineColor = lineColor;
    this._lineWidth = lineWidth;
    this._chartWidth = chartWidth;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      if (!this._start || !this._end) return;

      // Extend ray from start through end to chart right edge
      const extended = this._extendToX(this._start, this._end, this._chartWidth);

      ctx.strokeStyle = this._lineColor;
      ctx.lineWidth = this._lineWidth;
      ctx.beginPath();
      ctx.moveTo(this._start.x, this._start.y);
      ctx.lineTo(extended.x, extended.y);
      ctx.stroke();
    });
  }

  private _extendToX(from: PixelPoint, to: PixelPoint, targetX: number): PixelPoint {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 0) return { x: targetX, y: to.y };
    const t = (targetX - from.x) / dx;
    return { x: targetX, y: from.y + dy * t };
  }
}

class RayPaneView implements IPrimitivePaneView {
  private _renderer = new RayRenderer();

  update(
    start: PixelPoint | null,
    end: PixelPoint | null,
    lineColor: string,
    lineWidth: number,
    chartWidth: number,
  ): void {
    this._renderer.update(start, end, lineColor, lineWidth, chartWidth);
  }

  zOrder(): 'bottom' {
    return 'bottom';
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer;
  }
}

export class RayPrimitive implements IDrawingPrimitive {
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<SeriesType> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _paneView = new RayPaneView();
  private _retryCount = 0;

  private _points: DrawingPoint[] = [];
  private _lineColor = DEFAULT_STYLE.lineColor;
  private _lineWidth = DEFAULT_STYLE.lineWidth;

  constructor(points: DrawingPoint[], style?: DrawingStyle) {
    this._points = points;
    if (style?.lineColor) this._lineColor = style.lineColor;
    if (style?.lineWidth) this._lineWidth = style.lineWidth;
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._chart = param.chart as IChartApi;
    this._series = param.series;
    this._requestUpdate = param.requestUpdate;
    this._retryCount = 0;
    this._requestUpdate();
  }

  detached(): void {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  updatePoints(points: DrawingPoint[]): void {
    this._points = points;
    this._retryCount = 0;
    this._requestUpdate?.();
  }

  updateStyle(style: DrawingStyle): void {
    if (style.lineColor) this._lineColor = style.lineColor;
    if (style.lineWidth) this._lineWidth = style.lineWidth;
    this._requestUpdate?.();
  }

  updateAllViews(): void {
    if (!this._chart || !this._series || this._points.length < 2) {
      this._paneView.update(null, null, this._lineColor, this._lineWidth, 0);
      return;
    }

    const timeScale = this._chart.timeScale();
    const series = this._series;

    const p0x = timeScale.timeToCoordinate(this._points[0].time as unknown as Time);
    const p0y = series.priceToCoordinate(this._points[0].price);
    const p1x = timeScale.timeToCoordinate(this._points[1].time as unknown as Time);
    const p1y = series.priceToCoordinate(this._points[1].price);

    if (p0x === null || p0y === null || p1x === null || p1y === null) {
      this._paneView.update(null, null, this._lineColor, this._lineWidth, 0);
      if (this._retryCount < 3) {
        this._retryCount++;
        requestAnimationFrame(() => this._requestUpdate?.());
      }
      return;
    }

    this._retryCount = 0;

    const start: PixelPoint = { x: p0x as number, y: p0y as number };
    const end: PixelPoint = { x: p1x as number, y: p1y as number };
    const chartWidth = this._chart.timeScale().width();

    this._paneView.update(start, end, this._lineColor, this._lineWidth, chartWidth);
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }
}
