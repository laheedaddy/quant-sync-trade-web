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
import type { DrawingPoint } from '@/types/chart';

interface PixelPoint {
  x: number;
  y: number;
}

class HandleRenderer implements IPrimitivePaneRenderer {
  private _handles: PixelPoint[] = [];

  update(handles: PixelPoint[]): void {
    this._handles = handles;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      for (const h of this._handles) {
        // White outer circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Blue inner circle
        ctx.fillStyle = '#2962ff';
        ctx.beginPath();
        ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}

class HandlePaneView implements IPrimitivePaneView {
  private _renderer = new HandleRenderer();

  update(handles: PixelPoint[]): void {
    this._renderer.update(handles);
  }

  zOrder(): 'top' {
    return 'top';
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer;
  }
}

export class DrawingHandlesPrimitive implements ISeriesPrimitive<Time> {
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<SeriesType> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _paneView = new HandlePaneView();
  private _points: DrawingPoint[] = [];

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

  setPoints(points: DrawingPoint[]): void {
    this._points = points;
    this._requestUpdate?.();
  }

  updateAllViews(): void {
    if (!this._chart || !this._series || this._points.length < 3) {
      this._paneView.update([]);
      return;
    }

    const timeScale = this._chart.timeScale();
    const series = this._series;
    const handles: PixelPoint[] = [];

    // Handle 0: p0 (line 1 start)
    const p0x = timeScale.timeToCoordinate(this._points[0].time as unknown as Time);
    const p0y = series.priceToCoordinate(this._points[0].price);
    if (p0x !== null && p0y !== null) {
      handles.push({ x: p0x as number, y: p0y as number });
    }

    // Handle 1: p1 (line 1 end)
    const p1x = timeScale.timeToCoordinate(this._points[1].time as unknown as Time);
    const p1y = series.priceToCoordinate(this._points[1].price);
    if (p1x !== null && p1y !== null) {
      handles.push({ x: p1x as number, y: p1y as number });
    }

    // Handle 2: line 2 start position (pixel-space offset for straight line rendering)
    const p2x = timeScale.timeToCoordinate(this._points[2].time as unknown as Time);
    const p2y = series.priceToCoordinate(this._points[2].price);
    if (p0x !== null && p0y !== null && p1x !== null && p1y !== null && p2x !== null && p2y !== null) {
      const dx = (p1x as number) - (p0x as number);
      const t = dx === 0 ? 0 : ((p2x as number) - (p0x as number)) / dx;
      const interpY = (p0y as number) + t * ((p1y as number) - (p0y as number));
      const pixelOffsetY = (p2y as number) - interpY;
      handles.push({ x: p0x as number, y: (p0y as number) + pixelOffsetY });
    }

    this._paneView.update(handles);
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }
}
