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

const DEFAULT_STYLE = {
  lineColor: '#787b86',
  lineWidth: 1,
  dashed: true,
  showPriceLabel: true,
};

class HorizontalLineRenderer implements IPrimitivePaneRenderer {
  private _y: number | null = null;
  private _lineColor = DEFAULT_STYLE.lineColor;
  private _lineWidth = DEFAULT_STYLE.lineWidth;
  private _dashed = DEFAULT_STYLE.dashed;
  private _showPriceLabel = DEFAULT_STYLE.showPriceLabel;
  private _chartWidth = 0;
  private _priceText = '';

  update(
    y: number | null,
    lineColor: string,
    lineWidth: number,
    dashed: boolean,
    showPriceLabel: boolean,
    chartWidth: number,
    priceText: string,
  ): void {
    this._y = y;
    this._lineColor = lineColor;
    this._lineWidth = lineWidth;
    this._dashed = dashed;
    this._showPriceLabel = showPriceLabel;
    this._chartWidth = chartWidth;
    this._priceText = priceText;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      if (this._y === null) return;

      ctx.strokeStyle = this._lineColor;
      ctx.lineWidth = this._lineWidth;

      if (this._dashed) {
        ctx.setLineDash([6, 4]);
      }

      ctx.beginPath();
      ctx.moveTo(0, this._y);
      ctx.lineTo(this._chartWidth, this._y);
      ctx.stroke();

      if (this._dashed) {
        ctx.setLineDash([]);
      }

      // Price label on right side
      if (this._showPriceLabel && this._priceText) {
        const padding = 4;
        const fontSize = 11;
        ctx.font = `${fontSize}px monospace`;
        const textWidth = ctx.measureText(this._priceText).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = fontSize + padding * 2;
        const boxX = this._chartWidth - boxWidth - 2;
        const boxY = this._y - boxHeight / 2;

        ctx.fillStyle = this._lineColor;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this._priceText, boxX + padding, this._y);
      }
    });
  }
}

class HorizontalLinePaneView implements IPrimitivePaneView {
  private _renderer = new HorizontalLineRenderer();

  update(
    y: number | null,
    lineColor: string,
    lineWidth: number,
    dashed: boolean,
    showPriceLabel: boolean,
    chartWidth: number,
    priceText: string,
  ): void {
    this._renderer.update(y, lineColor, lineWidth, dashed, showPriceLabel, chartWidth, priceText);
  }

  zOrder(): 'bottom' {
    return 'bottom';
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer;
  }
}

export class HorizontalLinePrimitive implements IDrawingPrimitive {
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<SeriesType> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _paneView = new HorizontalLinePaneView();
  private _retryCount = 0;

  private _points: DrawingPoint[] = [];
  private _lineColor = DEFAULT_STYLE.lineColor;
  private _lineWidth = DEFAULT_STYLE.lineWidth;
  private _dashed = DEFAULT_STYLE.dashed;
  private _showPriceLabel = DEFAULT_STYLE.showPriceLabel;

  constructor(points: DrawingPoint[], style?: DrawingStyle) {
    this._points = points;
    if (style?.lineColor) this._lineColor = style.lineColor;
    if (style?.lineWidth) this._lineWidth = style.lineWidth;
    if (style?.dashed !== undefined) this._dashed = style.dashed;
    if (style?.showPriceLabel !== undefined) this._showPriceLabel = style.showPriceLabel;
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
    if (style.dashed !== undefined) this._dashed = style.dashed;
    if (style.showPriceLabel !== undefined) this._showPriceLabel = style.showPriceLabel;
    this._requestUpdate?.();
  }

  updateAllViews(): void {
    if (!this._chart || !this._series || this._points.length < 1) {
      this._paneView.update(null, this._lineColor, this._lineWidth, this._dashed, this._showPriceLabel, 0, '');
      return;
    }

    const price = this._points[0].price;
    const y = this._series.priceToCoordinate(price);

    if (y === null) {
      this._paneView.update(null, this._lineColor, this._lineWidth, this._dashed, this._showPriceLabel, 0, '');
      if (this._retryCount < 3) {
        this._retryCount++;
        requestAnimationFrame(() => this._requestUpdate?.());
      }
      return;
    }

    this._retryCount = 0;

    const chartWidth = this._chart.timeScale().width();
    const priceText = price.toFixed(2);

    this._paneView.update(
      y as number,
      this._lineColor,
      this._lineWidth,
      this._dashed,
      this._showPriceLabel,
      chartWidth,
      priceText,
    );
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }
}
