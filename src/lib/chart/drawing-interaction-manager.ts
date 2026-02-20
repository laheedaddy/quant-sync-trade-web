import type {
  IChartApi,
  ISeriesApi,
  SeriesType,
  MouseEventParams,
  Time,
} from 'lightweight-charts';
import type { DrawingPoint, CreateChartDrawingRequest, PriceScaleMode, DrawingToolMode } from '@/types/chart';
import type { IDrawingPrimitive } from './primitives/drawing-primitive';
import { ParallelChannelPrimitive } from './primitives/parallel-channel-primitive';
import { RayPrimitive } from './primitives/ray-primitive';
import { HorizontalLinePrimitive } from './primitives/horizontal-line-primitive';

interface DrawingInteractionManagerOptions {
  chart: IChartApi;
  series: ISeriesApi<SeriesType>;
  onComplete: (request: CreateChartDrawingRequest) => void;
  onCancel: () => void;
  priceScaleMode?: number;
  drawingToolMode?: DrawingToolMode;
}

const TOOL_REQUIRED_CLICKS: Record<string, number> = {
  parallel_channel: 3,
  ray: 2,
  horizontal_line: 1,
};

export class DrawingInteractionManager {
  private _chart: IChartApi;
  private _series: ISeriesApi<SeriesType>;
  private _onComplete: (request: CreateChartDrawingRequest) => void;
  private _onCancel: () => void;
  private _priceScaleMode: PriceScaleMode;
  private _drawingToolMode: DrawingToolMode;

  private _points: DrawingPoint[] = [];
  private _previewPrimitive: IDrawingPrimitive | null = null;
  private _isActive = false;
  private _chartContainer: HTMLElement | null = null;
  private _prevCursor: string = '';

  private _clickHandler: ((params: MouseEventParams) => void) | null = null;
  private _moveHandler: ((params: MouseEventParams) => void) | null = null;
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: DrawingInteractionManagerOptions) {
    this._chart = options.chart;
    this._series = options.series;
    this._onComplete = options.onComplete;
    this._onCancel = options.onCancel;
    this._priceScaleMode = (options.priceScaleMode ?? 0) as PriceScaleMode;
    this._drawingToolMode = options.drawingToolMode ?? 'parallel_channel';
  }

  get requiredClicks(): number {
    return TOOL_REQUIRED_CLICKS[this._drawingToolMode] ?? 3;
  }

  start(): void {
    if (this._isActive) return;
    this._isActive = true;
    this._points = [];

    // Change cursor to crosshair
    this._chartContainer = (this._chart as unknown as { chartElement(): HTMLElement }).chartElement();
    if (this._chartContainer) {
      this._prevCursor = this._chartContainer.style.cursor;
      this._chartContainer.style.cursor = 'crosshair';
    }

    // Create preview primitive based on tool mode
    this._previewPrimitive = this._createPreviewPrimitive();
    this._series.attachPrimitive(this._previewPrimitive);

    // Subscribe to chart events
    this._clickHandler = this._handleClick.bind(this);
    this._moveHandler = this._handleMove.bind(this);
    this._chart.subscribeClick(this._clickHandler);
    this._chart.subscribeCrosshairMove(this._moveHandler);

    // Escape key handler
    this._keyHandler = this._handleKey.bind(this);
    document.addEventListener('keydown', this._keyHandler);
  }

  stop(): void {
    if (!this._isActive) return;
    this._isActive = false;
    this._points = [];

    // Restore cursor
    if (this._chartContainer) {
      this._chartContainer.style.cursor = this._prevCursor;
      this._chartContainer = null;
    }

    // Remove preview primitive
    if (this._previewPrimitive) {
      this._series.detachPrimitive(this._previewPrimitive);
      this._previewPrimitive = null;
    }

    // Unsubscribe
    if (this._clickHandler) {
      this._chart.unsubscribeClick(this._clickHandler);
      this._clickHandler = null;
    }
    if (this._moveHandler) {
      this._chart.unsubscribeCrosshairMove(this._moveHandler);
      this._moveHandler = null;
    }
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }

  private _createPreviewPrimitive(): IDrawingPrimitive {
    switch (this._drawingToolMode) {
      case 'ray':
        return new RayPrimitive([], { lineColor: '#2962ff', lineWidth: 1 });
      case 'horizontal_line':
        return new HorizontalLinePrimitive([], {
          lineColor: '#787b86',
          lineWidth: 1,
          dashed: true,
          showPriceLabel: true,
        });
      default:
        return new ParallelChannelPrimitive([], {
          lineColor: '#2962ff',
          fillColor: '#2962ff',
          fillOpacity: 0.08,
          lineWidth: 1,
        });
    }
  }

  private _getPointFromParams(params: MouseEventParams): DrawingPoint | null {
    if (!params.time || !params.point) return null;
    const rawPrice = this._series.coordinateToPrice(params.point.y);
    if (rawPrice === null) return null;

    // Snap to nearest OHLC within pixel threshold
    const snappedPrice = this._snapToOHLC(params, rawPrice as number);

    return {
      time: params.time as number,
      price: snappedPrice,
    };
  }

  private _snapToOHLC(params: MouseEventParams, rawPrice: number): number {
    const SNAP_THRESHOLD_PX = 15;

    if (!params.seriesData) return rawPrice;
    const seriesData = params.seriesData.get(this._series);
    if (!seriesData) return rawPrice;

    const candidates: number[] = [];
    const data = seriesData as unknown as Record<string, unknown>;

    if ('open' in data && 'high' in data && 'low' in data && 'close' in data) {
      candidates.push(data.open as number, data.high as number, data.low as number, data.close as number);
    }

    if (candidates.length === 0) return rawPrice;

    const cursorY = params.point!.y;
    let bestPrice = rawPrice;
    let bestDist = Infinity;

    for (const price of candidates) {
      const coord = this._series.priceToCoordinate(price);
      if (coord === null) continue;
      const dist = Math.abs((coord as number) - cursorY);
      if (dist < bestDist) {
        bestDist = dist;
        bestPrice = price;
      }
    }

    return bestDist <= SNAP_THRESHOLD_PX ? bestPrice : rawPrice;
  }

  private _handleClick(params: MouseEventParams): void {
    if (!this._isActive) return;
    const point = this._getPointFromParams(params);
    if (!point) return;

    this._points.push(point);

    if (this._points.length >= this.requiredClicks) {
      const request = this._buildRequest();
      this.stop();
      this._onComplete(request);
    }
  }

  private _buildRequest(): CreateChartDrawingRequest {
    switch (this._drawingToolMode) {
      case 'ray':
        return {
          drawingType: 'RAY',
          points: [...this._points],
          style: { lineColor: '#2962ff', lineWidth: 2 },
        };
      case 'horizontal_line':
        return {
          drawingType: 'HORIZONTAL_LINE',
          points: [...this._points],
          style: {
            lineColor: '#787b86',
            lineWidth: 1,
            dashed: true,
            showPriceLabel: true,
          },
        };
      default:
        return {
          drawingType: 'PARALLEL_CHANNEL',
          points: [...this._points],
          style: {
            lineColor: '#2962ff',
            lineWidth: 2,
            fillColor: '#2962ff',
            fillOpacity: 0.1,
            extendLeft: false,
            extendRight: true,
            priceScaleMode: this._priceScaleMode,
          },
        };
    }
  }

  private _handleMove(params: MouseEventParams): void {
    if (!this._isActive || !this._previewPrimitive) return;
    const cursorPoint = this._getPointFromParams(params);
    if (!cursorPoint) return;

    switch (this._drawingToolMode) {
      case 'horizontal_line':
        // Always show horizontal line at cursor price
        this._previewPrimitive.updatePoints([cursorPoint]);
        break;

      case 'ray':
        if (this._points.length === 0) {
          this._previewPrimitive.updatePoints([]);
        } else if (this._points.length === 1) {
          this._previewPrimitive.updatePoints([this._points[0], cursorPoint]);
        }
        break;

      default:
        // parallel_channel
        if (this._points.length === 0) {
          this._previewPrimitive.updatePoints([]);
        } else if (this._points.length === 1) {
          this._previewPrimitive.updatePoints([
            this._points[0],
            cursorPoint,
            this._points[0],
          ]);
        } else if (this._points.length === 2) {
          this._previewPrimitive.updatePoints([
            this._points[0],
            this._points[1],
            cursorPoint,
          ]);
        }
        break;
    }
  }

  private _handleKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.stop();
      this._onCancel();
    }
  }
}
