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

const DEFAULT_STYLE: Required<DrawingStyle> = {
  lineColor: '#2962ff',
  lineWidth: 2,
  fillColor: '#2962ff',
  fillOpacity: 0.1,
  extendLeft: false,
  extendRight: true,
  priceScaleMode: 0,
};

interface PixelPoint {
  x: number;
  y: number;
}

class ParallelChannelRenderer implements IPrimitivePaneRenderer {
  private _line1Start: PixelPoint | null = null;
  private _line1End: PixelPoint | null = null;
  private _line2Start: PixelPoint | null = null;
  private _line2End: PixelPoint | null = null;
  private _style: Required<DrawingStyle> = DEFAULT_STYLE;
  private _chartWidth = 0;

  update(
    line1Start: PixelPoint | null,
    line1End: PixelPoint | null,
    line2Start: PixelPoint | null,
    line2End: PixelPoint | null,
    style: Required<DrawingStyle>,
    chartWidth: number,
  ): void {
    this._line1Start = line1Start;
    this._line1End = line1End;
    this._line2Start = line2Start;
    this._line2End = line2End;
    this._style = style;
    this._chartWidth = chartWidth;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      if (!this._line1Start || !this._line1End || !this._line2Start || !this._line2End) return;

      let l1s = this._line1Start;
      let l1e = this._line1End;
      let l2s = this._line2Start;
      let l2e = this._line2End;

      // Extend lines to chart edges if requested
      if (this._style.extendLeft || this._style.extendRight) {
        l1s = { ...l1s };
        l1e = { ...l1e };
        l2s = { ...l2s };
        l2e = { ...l2e };

        if (this._style.extendLeft) {
          l1s = this._extendToX(l1e, l1s, 0);
          l2s = this._extendToX(l2e, l2s, 0);
        }
        if (this._style.extendRight) {
          l1e = this._extendToX(l1s, l1e, this._chartWidth);
          l2e = this._extendToX(l2s, l2e, this._chartWidth);
        }
      }

      // Draw filled area between the two lines
      ctx.fillStyle = this._style.fillColor;
      ctx.globalAlpha = this._style.fillOpacity;
      ctx.beginPath();
      ctx.moveTo(l1s.x, l1s.y);
      ctx.lineTo(l1e.x, l1e.y);
      ctx.lineTo(l2e.x, l2e.y);
      ctx.lineTo(l2s.x, l2s.y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw line 1
      ctx.strokeStyle = this._style.lineColor;
      ctx.lineWidth = this._style.lineWidth;
      ctx.beginPath();
      ctx.moveTo(l1s.x, l1s.y);
      ctx.lineTo(l1e.x, l1e.y);
      ctx.stroke();

      // Draw line 2
      ctx.beginPath();
      ctx.moveTo(l2s.x, l2s.y);
      ctx.lineTo(l2e.x, l2e.y);
      ctx.stroke();

      // Draw middle line (dashed)
      const midSx = (l1s.x + l2s.x) / 2;
      const midSy = (l1s.y + l2s.y) / 2;
      const midEx = (l1e.x + l2e.x) / 2;
      const midEy = (l1e.y + l2e.y) / 2;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = Math.max(1, this._style.lineWidth - 1);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(midSx, midSy);
      ctx.lineTo(midEx, midEy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
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

class ParallelChannelPaneView implements IPrimitivePaneView {
  private _renderer = new ParallelChannelRenderer();

  update(
    line1Start: PixelPoint | null,
    line1End: PixelPoint | null,
    line2Start: PixelPoint | null,
    line2End: PixelPoint | null,
    style: Required<DrawingStyle>,
    chartWidth: number,
  ): void {
    this._renderer.update(line1Start, line1End, line2Start, line2End, style, chartWidth);
  }

  zOrder(): 'bottom' {
    return 'bottom';
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer;
  }
}

export class ParallelChannelPrimitive implements ISeriesPrimitive<Time> {
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<SeriesType> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _paneView = new ParallelChannelPaneView();

  private _points: DrawingPoint[] = [];
  private _style: Required<DrawingStyle> = { ...DEFAULT_STYLE };

  constructor(points: DrawingPoint[], style?: DrawingStyle) {
    this._points = points;
    this._style = { ...DEFAULT_STYLE, ...style };
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._chart = param.chart as IChartApi;
    this._series = param.series;
    this._requestUpdate = param.requestUpdate;
    this._requestUpdate();
  }

  detached(): void {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  updatePoints(points: DrawingPoint[]): void {
    this._points = points;
    this._requestUpdate?.();
  }

  updateStyle(style: DrawingStyle): void {
    this._style = { ...DEFAULT_STYLE, ...style };
    this._requestUpdate?.();
  }

  updateAllViews(): void {
    if (!this._chart || !this._series || this._points.length < 2) {
      this._paneView.update(null, null, null, null, this._style, 0);
      return;
    }

    const timeScale = this._chart.timeScale();
    const series = this._series;

    // Convert points to pixel coordinates
    const p0x = timeScale.timeToCoordinate(this._points[0].time as unknown as Time);
    const p0y = series.priceToCoordinate(this._points[0].price);
    const p1x = timeScale.timeToCoordinate(this._points[1].time as unknown as Time);
    const p1y = series.priceToCoordinate(this._points[1].price);

    if (p0x === null || p0y === null || p1x === null || p1y === null) {
      this._paneView.update(null, null, null, null, this._style, 0);
      return;
    }

    const line1Start: PixelPoint = { x: p0x as number, y: p0y as number };
    const line1End: PixelPoint = { x: p1x as number, y: p1y as number };

    // Calculate parallel offset in PIXEL space.
    // Interpolate line1's Y at p2's X, then the difference gives a constant pixel offset.
    // This ensures line2 is always a straight line regardless of price scale mode.
    let pixelOffsetY = 0;
    if (this._points.length >= 3) {
      const p2x = timeScale.timeToCoordinate(this._points[2].time as unknown as Time);
      const p2y = series.priceToCoordinate(this._points[2].price);
      if (p2x !== null && p2y !== null) {
        const dx = (p1x as number) - (p0x as number);
        const t = dx === 0 ? 0 : ((p2x as number) - (p0x as number)) / dx;
        const interpY = (p0y as number) + t * ((p1y as number) - (p0y as number));
        pixelOffsetY = (p2y as number) - interpY;
      }
    }

    const line2Start: PixelPoint = { x: p0x as number, y: (p0y as number) + pixelOffsetY };
    const line2End: PixelPoint = { x: p1x as number, y: (p1y as number) + pixelOffsetY };

    const chartWidth = this._chart.timeScale().width();

    this._paneView.update(line1Start, line1End, line2Start, line2End, this._style, chartWidth);
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }
}
