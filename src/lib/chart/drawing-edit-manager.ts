import type {
  IChartApi,
  ISeriesApi,
  SeriesType,
  MouseEventParams,
  Coordinate,
  Time,
} from 'lightweight-charts';
import type { DrawingPoint, UserChartDrawing } from '@/types/chart';
import type { IDrawingPrimitive } from './primitives/drawing-primitive';
import { DrawingHandlesPrimitive } from './primitives/drawing-handles-primitive';

interface PixelPoint {
  x: number;
  y: number;
}

interface DrawingEditManagerOptions {
  chart: IChartApi;
  series: ISeriesApi<SeriesType>;
  primitiveMap: Map<number, IDrawingPrimitive>;
  getDrawings: () => UserChartDrawing[];
  onUpdate: (drawingNo: number, points: DrawingPoint[]) => Promise<void>;
  onDelete: (drawingNo: number) => Promise<void>;
}

const HANDLE_HIT_RADIUS = 10;
const LINE_HIT_DISTANCE = 6;

export class DrawingEditManager {
  private _chart: IChartApi;
  private _series: ISeriesApi<SeriesType>;
  private _primitiveMap: Map<number, IDrawingPrimitive>;
  private _getDrawings: () => UserChartDrawing[];
  private _onUpdate: (drawingNo: number, points: DrawingPoint[]) => Promise<void>;
  private _onDelete: (drawingNo: number) => Promise<void>;

  private _isActive = false;
  private _container: HTMLElement | null = null;

  // Selection
  private _selectedNo: number | null = null;
  private _handlesPrimitive: DrawingHandlesPrimitive | null = null;

  // Mouse tracking
  private _mouseIsDown = false;
  private _mouseStartX = 0;
  private _mouseStartY = 0;
  private _pendingDrag: {
    type: 'handle' | 'body';
    drawingNo: number;
    handleIndex: number;
  } | null = null;

  // Drag state
  private _isDragging = false;
  private _dragType: 'handle' | 'body' | null = null;
  private _dragHandleIndex = -1;
  private _dragOriginalPoints: DrawingPoint[] = [];
  private _lastDragPoints: DrawingPoint[] = [];
  private _dragStartTime = 0;
  private _dragStartPrice = 0;
  private _lastKnownTime = 0;

  // OHLC snap
  private _lastOHLC: { open: number; high: number; low: number; close: number } | null = null;

  // Event handlers
  private _crosshairHandler: ((params: MouseEventParams) => void) | null = null;
  private _mousedownHandler: ((e: MouseEvent) => void) | null = null;
  private _docMoveHandler: ((e: MouseEvent) => void) | null = null;
  private _mouseupHandler: ((e: MouseEvent) => void) | null = null;
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: DrawingEditManagerOptions) {
    this._chart = options.chart;
    this._series = options.series;
    this._primitiveMap = options.primitiveMap;
    this._getDrawings = options.getDrawings;
    this._onUpdate = options.onUpdate;
    this._onDelete = options.onDelete;
  }

  start(): void {
    if (this._isActive) return;
    this._isActive = true;

    this._container = (this._chart as unknown as { chartElement(): HTMLElement }).chartElement();

    this._crosshairHandler = this._handleCrosshairMove.bind(this);
    this._mousedownHandler = this._handleMouseDown.bind(this);
    this._docMoveHandler = this._handleDocMouseMove.bind(this);
    this._mouseupHandler = this._handleMouseUp.bind(this);
    this._keyHandler = this._handleKey.bind(this);

    this._chart.subscribeCrosshairMove(this._crosshairHandler);
    this._container.addEventListener('mousedown', this._mousedownHandler);
    document.addEventListener('mousemove', this._docMoveHandler);
    document.addEventListener('mouseup', this._mouseupHandler);
    document.addEventListener('keydown', this._keyHandler);
  }

  stop(): void {
    if (!this._isActive) return;
    this._isActive = false;

    // Restore chart interaction before deselect (in case we were mid-drag)
    if (this._isDragging) {
      this._chart.applyOptions({ handleScroll: true, handleScale: true });
    }

    this._deselect();

    if (this._crosshairHandler) {
      this._chart.unsubscribeCrosshairMove(this._crosshairHandler);
    }
    if (this._container && this._mousedownHandler) {
      this._container.removeEventListener('mousedown', this._mousedownHandler);
    }
    if (this._docMoveHandler) {
      document.removeEventListener('mousemove', this._docMoveHandler);
    }
    if (this._mouseupHandler) {
      document.removeEventListener('mouseup', this._mouseupHandler);
    }
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }

    this._crosshairHandler = null;
    this._mousedownHandler = null;
    this._docMoveHandler = null;
    this._mouseupHandler = null;
    this._keyHandler = null;
    this._container = null;
  }

  // === Selection ===

  private _select(drawingNo: number): void {
    if (this._selectedNo === drawingNo) return;
    this._deselect();
    this._selectedNo = drawingNo;

    const drawing = this._getDrawings().find((d) => d.userChartDrawingNo === drawingNo);
    if (!drawing) return;

    this._handlesPrimitive = new DrawingHandlesPrimitive();
    this._handlesPrimitive.setPoints(this._getHandlePoints(drawing));
    this._series.attachPrimitive(this._handlesPrimitive);
  }

  private _deselect(): void {
    if (this._handlesPrimitive) {
      this._series.detachPrimitive(this._handlesPrimitive);
      this._handlesPrimitive = null;
    }
    this._selectedNo = null;
    this._isDragging = false;
    this._dragType = null;
    if (this._container) this._container.style.cursor = '';
  }

  /** Get points for handle display — type-specific */
  private _getHandlePoints(drawing: UserChartDrawing): DrawingPoint[] {
    switch (drawing.drawingType) {
      case 'HORIZONTAL_LINE':
        // Single handle at chart center X position
        return drawing.points.slice(0, 1);
      case 'RAY':
        return drawing.points.slice(0, 2);
      default:
        return drawing.points;
    }
  }

  // === Mouse Events ===

  private _handleMouseDown(e: MouseEvent): void {
    if (!this._container) return;
    const rect = this._container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this._mouseIsDown = true;
    this._mouseStartX = x;
    this._mouseStartY = y;
    this._pendingDrag = null;

    // Check selected drawing first (handles + body)
    if (this._selectedNo !== null) {
      const drawing = this._getDrawings().find((d) => d.userChartDrawingNo === this._selectedNo);
      if (drawing) {
        const handles = this._getHandlePixels(drawing);
        const hIdx = this._findNearestHandle(x, y, handles);
        if (hIdx !== null) {
          e.preventDefault();
          this._pendingDrag = { type: 'handle', drawingNo: this._selectedNo, handleIndex: hIdx };
          return;
        }
        if (this._isNearDrawing(x, y, drawing)) {
          e.preventDefault();
          this._pendingDrag = { type: 'body', drawingNo: this._selectedNo, handleIndex: -1 };
          return;
        }
      }
    }

    // Check all drawings for hit
    const hit = this._findHit(x, y);
    if (hit) {
      e.preventDefault();
      this._pendingDrag = {
        type: hit.handleIndex !== null ? 'handle' : 'body',
        drawingNo: hit.drawingNo,
        handleIndex: hit.handleIndex ?? -1,
      };
    }
  }

  private _handleDocMouseMove(e: MouseEvent): void {
    if (!this._mouseIsDown || !this._container) return;

    const rect = this._container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Drag start detection (3px threshold)
    if (!this._isDragging && this._pendingDrag) {
      const dx = x - this._mouseStartX;
      const dy = y - this._mouseStartY;
      if (Math.sqrt(dx * dx + dy * dy) > 3) {
        this._select(this._pendingDrag.drawingNo);
        const drawing = this._getDrawings().find(
          (d) => d.userChartDrawingNo === this._pendingDrag!.drawingNo,
        );
        if (drawing) {
          this._startDrag(this._pendingDrag.type, drawing, this._pendingDrag.handleIndex);
        }
      }
      return;
    }

    // During drag, use last known time + fresh price (snapped for handle drags)
    if (this._isDragging && this._lastKnownTime !== 0) {
      const rawPrice = this._series.coordinateToPrice(y as Coordinate);
      if (rawPrice !== null) {
        const price = this._dragType === 'handle'
          ? this._snapToOHLC(rawPrice as number, y)
          : rawPrice as number;
        this._updateDrag(this._lastKnownTime, price);
      }
    }
  }

  private _handleMouseUp(_e: MouseEvent): void {
    if (this._isDragging) {
      this._endDrag();
    } else if (this._mouseIsDown) {
      // Simple click (no drag)
      if (this._pendingDrag) {
        this._select(this._pendingDrag.drawingNo);
      } else {
        this._deselect();
      }
    }

    this._mouseIsDown = false;
    this._pendingDrag = null;
  }

  // === Crosshair Move ===

  private _handleCrosshairMove(params: MouseEventParams): void {
    if (!params.point) return;

    // Track time for drag
    if (params.time) {
      this._lastKnownTime = params.time as number;
    }

    // Track OHLC data for magnet snap
    this._updateLastOHLC(params);

    // During drag, update with fresh time/price (snapped for handle drags)
    if (this._isDragging && params.time) {
      const rawPrice = this._series.coordinateToPrice(params.point.y);
      if (rawPrice !== null) {
        const price = this._dragType === 'handle'
          ? this._snapToOHLC(rawPrice as number, params.point.y)
          : rawPrice as number;
        this._updateDrag(params.time as number, price);
      }
      return;
    }

    // Hover cursor updates (only when not pressing mouse)
    if (!this._mouseIsDown) {
      this._updateCursor(params.point.x, params.point.y);
    }
  }

  private _updateCursor(x: number, y: number): void {
    if (!this._container) return;

    if (this._selectedNo !== null) {
      const drawing = this._getDrawings().find((d) => d.userChartDrawingNo === this._selectedNo);
      if (drawing) {
        const handles = this._getHandlePixels(drawing);
        if (this._findNearestHandle(x, y, handles) !== null) {
          this._container.style.cursor = 'grab';
          return;
        }
        if (this._isNearDrawing(x, y, drawing)) {
          this._container.style.cursor = 'move';
          return;
        }
      }
    }

    const hit = this._findHit(x, y);
    this._container.style.cursor = hit ? 'pointer' : '';
  }

  // === Drag ===

  private _startDrag(type: 'handle' | 'body', drawing: UserChartDrawing, handleIndex: number): void {
    this._isDragging = true;
    this._dragType = type;
    this._dragHandleIndex = handleIndex;
    this._dragOriginalPoints = drawing.points.map((p) => ({ ...p }));
    this._lastDragPoints = drawing.points.map((p) => ({ ...p }));

    // Record start position in time/price space
    const startPrice = this._series.coordinateToPrice(this._mouseStartY as Coordinate);
    this._dragStartPrice = (startPrice as number) ?? 0;
    this._dragStartTime = this._lastKnownTime;

    this._chart.applyOptions({ handleScroll: false, handleScale: false });

    if (this._container) {
      this._container.style.cursor = type === 'handle' ? 'grabbing' : 'move';
    }
  }

  private _updateDrag(time: number, price: number): void {
    if (!this._isDragging || this._selectedNo === null) return;

    const primitive = this._primitiveMap.get(this._selectedNo);
    if (!primitive) return;

    const drawing = this._getDrawings().find((d) => d.userChartDrawingNo === this._selectedNo);

    // Set dragStartTime on first drag update
    if (this._dragStartTime === 0) {
      this._dragStartTime = time;
      this._dragStartPrice = price;
      return;
    }

    let newPoints: DrawingPoint[];

    if (this._dragType === 'handle') {
      newPoints = this._dragOriginalPoints.map((p) => ({ ...p }));

      if (drawing?.drawingType === 'HORIZONTAL_LINE') {
        // Only move Y (price), keep time fixed
        newPoints[0] = { ...newPoints[0], price };
      } else {
        // Standard handle move
        const idx = this._dragHandleIndex;
        if (idx >= 0 && idx < newPoints.length) {
          newPoints[idx] = { time, price };
        }
      }
    } else {
      // Body drag
      const timeDelta = time - this._dragStartTime;
      const priceDelta = price - this._dragStartPrice;

      if (drawing?.drawingType === 'HORIZONTAL_LINE') {
        // Only move Y (price), keep time fixed
        newPoints = this._dragOriginalPoints.map((p) => ({
          time: p.time,
          price: p.price + priceDelta,
        }));
      } else {
        newPoints = this._dragOriginalPoints.map((p) => ({
          time: p.time + timeDelta,
          price: p.price + priceDelta,
        }));
      }
    }

    this._lastDragPoints = newPoints;
    primitive.updatePoints(newPoints);
    this._handlesPrimitive?.setPoints(this._getHandlePointsFromDrawing(drawing, newPoints));
  }

  private _getHandlePointsFromDrawing(drawing: UserChartDrawing | undefined, points: DrawingPoint[]): DrawingPoint[] {
    if (!drawing) return points;
    switch (drawing.drawingType) {
      case 'HORIZONTAL_LINE':
        return points.slice(0, 1);
      case 'RAY':
        return points.slice(0, 2);
      default:
        return points;
    }
  }

  private async _endDrag(): Promise<void> {
    const drawingNo = this._selectedNo;
    this._isDragging = false;
    this._dragType = null;

    this._chart.applyOptions({ handleScroll: true, handleScale: true });

    if (this._container) {
      this._container.style.cursor = '';
    }

    if (drawingNo !== null) {
      const pointsChanged =
        JSON.stringify(this._lastDragPoints) !== JSON.stringify(this._dragOriginalPoints);
      if (pointsChanged) {
        try {
          await this._onUpdate(drawingNo, this._lastDragPoints);
          const drawing = this._getDrawings().find((d) => d.userChartDrawingNo === drawingNo);
          this._handlesPrimitive?.setPoints(this._getHandlePointsFromDrawing(drawing, this._lastDragPoints));
        } catch {
          // Restore original on error
          const primitive = this._primitiveMap.get(drawingNo);
          primitive?.updatePoints(this._dragOriginalPoints);
          const drawing = this._getDrawings().find((d) => d.userChartDrawingNo === drawingNo);
          this._handlesPrimitive?.setPoints(this._getHandlePointsFromDrawing(drawing, this._dragOriginalPoints));
        }
      }
    }
  }

  // === OHLC Snap ===

  private _updateLastOHLC(params: MouseEventParams): void {
    if (!params.seriesData) {
      this._lastOHLC = null;
      return;
    }
    const seriesData = params.seriesData.get(this._series);
    if (!seriesData) {
      this._lastOHLC = null;
      return;
    }
    const data = seriesData as unknown as Record<string, unknown>;
    if ('open' in data && 'high' in data && 'low' in data && 'close' in data) {
      this._lastOHLC = {
        open: data.open as number,
        high: data.high as number,
        low: data.low as number,
        close: data.close as number,
      };
    } else {
      this._lastOHLC = null;
    }
  }

  private _snapToOHLC(rawPrice: number, cursorY: number): number {
    const SNAP_THRESHOLD_PX = 15;
    if (!this._lastOHLC) return rawPrice;

    const candidates = [this._lastOHLC.open, this._lastOHLC.high, this._lastOHLC.low, this._lastOHLC.close];
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

  // === Keyboard ===

  private _handleKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this._isDragging) {
        // Cancel drag
        if (this._selectedNo !== null) {
          const primitive = this._primitiveMap.get(this._selectedNo);
          primitive?.updatePoints(this._dragOriginalPoints);
          const drawing = this._getDrawings().find((d) => d.userChartDrawingNo === this._selectedNo);
          this._handlesPrimitive?.setPoints(this._getHandlePointsFromDrawing(drawing, this._dragOriginalPoints));
        }
        this._isDragging = false;
        this._dragType = null;
        this._mouseIsDown = false;
        this._chart.applyOptions({ handleScroll: true, handleScale: true });
      } else {
        this._deselect();
      }
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && !this._isDragging) {
      if (this._selectedNo !== null) {
        const no = this._selectedNo;
        this._deselect();
        this._onDelete(no);
      }
    }
  }

  // === Hit Testing ===

  private _findHit(x: number, y: number): { drawingNo: number; handleIndex: number | null } | null {
    const drawings = this._getDrawings();
    for (const drawing of drawings) {
      const handles = this._getHandlePixels(drawing);
      const handleIndex = this._findNearestHandle(x, y, handles);
      if (handleIndex !== null) {
        return { drawingNo: drawing.userChartDrawingNo, handleIndex };
      }

      if (this._isNearDrawing(x, y, drawing)) {
        return { drawingNo: drawing.userChartDrawingNo, handleIndex: null };
      }
    }
    return null;
  }

  private _findNearestHandle(x: number, y: number, handles: PixelPoint[]): number | null {
    for (let i = 0; i < handles.length; i++) {
      const dx = x - handles[i].x;
      const dy = y - handles[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < HANDLE_HIT_RADIUS) {
        return i;
      }
    }
    return null;
  }

  /** Check if point is near the drawing (type-specific) */
  private _isNearDrawing(x: number, y: number, drawing: UserChartDrawing): boolean {
    switch (drawing.drawingType) {
      case 'HORIZONTAL_LINE':
        return this._isNearHorizontalLine(y, drawing);
      case 'RAY':
        return this._isNearRay(x, y, drawing);
      default:
        return this._isNearChannel(x, y, drawing);
    }
  }

  private _isNearHorizontalLine(y: number, drawing: UserChartDrawing): boolean {
    if (drawing.points.length < 1) return false;
    const py = this._series.priceToCoordinate(drawing.points[0].price);
    if (py === null) return false;
    return Math.abs(y - (py as number)) < LINE_HIT_DISTANCE;
  }

  private _isNearRay(x: number, y: number, drawing: UserChartDrawing): boolean {
    if (drawing.points.length < 2) return false;
    const timeScale = this._chart.timeScale();

    const p0x = timeScale.timeToCoordinate(drawing.points[0].time as unknown as Time);
    const p0y = this._series.priceToCoordinate(drawing.points[0].price);
    const p1x = timeScale.timeToCoordinate(drawing.points[1].time as unknown as Time);
    const p1y = this._series.priceToCoordinate(drawing.points[1].price);

    if (p0x === null || p0y === null || p1x === null || p1y === null) return false;

    const start = { x: p0x as number, y: p0y as number };
    const end = { x: p1x as number, y: p1y as number };

    // Extend ray to chart width
    const chartWidth = this._chart.timeScale().width();
    const extended = this._extendToX(start, end, chartWidth);

    return this._distToSegment(x, y, start, extended) < LINE_HIT_DISTANCE;
  }

  private _isNearChannel(x: number, y: number, drawing: UserChartDrawing): boolean {
    const lines = this._getChannelLinePixels(drawing);
    if (!lines) return false;

    return (
      this._distToSegment(x, y, lines.l1s, lines.l1e) < LINE_HIT_DISTANCE ||
      this._distToSegment(x, y, lines.l2s, lines.l2e) < LINE_HIT_DISTANCE ||
      this._isPointInQuad(x, y, lines.l1s, lines.l1e, lines.l2e, lines.l2s)
    );
  }

  private _getHandlePixels(drawing: UserChartDrawing): PixelPoint[] {
    const timeScale = this._chart.timeScale();
    const series = this._series;
    const handles: PixelPoint[] = [];

    switch (drawing.drawingType) {
      case 'HORIZONTAL_LINE': {
        if (drawing.points.length < 1) return handles;
        const py = series.priceToCoordinate(drawing.points[0].price);
        if (py !== null) {
          // Position handle at chart center X
          const chartWidth = this._chart.timeScale().width();
          handles.push({ x: chartWidth / 2, y: py as number });
        }
        return handles;
      }

      case 'RAY': {
        const p = drawing.points;
        if (p.length < 2) return handles;
        const p0x = timeScale.timeToCoordinate(p[0].time as unknown as Time);
        const p0y = series.priceToCoordinate(p[0].price);
        const p1x = timeScale.timeToCoordinate(p[1].time as unknown as Time);
        const p1y = series.priceToCoordinate(p[1].price);
        if (p0x !== null && p0y !== null) handles.push({ x: p0x as number, y: p0y as number });
        if (p1x !== null && p1y !== null) handles.push({ x: p1x as number, y: p1y as number });
        return handles;
      }

      default: {
        // PARALLEL_CHANNEL
        const p = drawing.points;
        if (p.length < 3) return handles;

        const p0x = timeScale.timeToCoordinate(p[0].time as unknown as Time);
        const p0y = series.priceToCoordinate(p[0].price);
        const p1x = timeScale.timeToCoordinate(p[1].time as unknown as Time);
        const p1y = series.priceToCoordinate(p[1].price);

        if (p0x !== null && p0y !== null) handles.push({ x: p0x as number, y: p0y as number });
        if (p1x !== null && p1y !== null) handles.push({ x: p1x as number, y: p1y as number });

        // Handle 2 at line 2's start point (pixel-space offset)
        const hp2x = timeScale.timeToCoordinate(p[2].time as unknown as Time);
        const hp2y = series.priceToCoordinate(p[2].price);
        if (p0x !== null && p0y !== null && p1x !== null && p1y !== null && hp2x !== null && hp2y !== null) {
          const hdx = (p1x as number) - (p0x as number);
          const ht = hdx === 0 ? 0 : ((hp2x as number) - (p0x as number)) / hdx;
          const hInterpY = (p0y as number) + ht * ((p1y as number) - (p0y as number));
          const hPixelOffsetY = (hp2y as number) - hInterpY;
          handles.push({ x: p0x as number, y: (p0y as number) + hPixelOffsetY });
        }

        return handles;
      }
    }
  }

  private _getChannelLinePixels(
    drawing: UserChartDrawing,
  ): { l1s: PixelPoint; l1e: PixelPoint; l2s: PixelPoint; l2e: PixelPoint } | null {
    const timeScale = this._chart.timeScale();
    const series = this._series;
    const p = drawing.points;
    if (p.length < 3) return null;

    const p0x = timeScale.timeToCoordinate(p[0].time as unknown as Time);
    const p0y = series.priceToCoordinate(p[0].price);
    const p1x = timeScale.timeToCoordinate(p[1].time as unknown as Time);
    const p1y = series.priceToCoordinate(p[1].price);

    if (p0x === null || p0y === null || p1x === null || p1y === null) return null;

    const lp2x = timeScale.timeToCoordinate(p[2].time as unknown as Time);
    const lp2y = series.priceToCoordinate(p[2].price);

    if (lp2x === null || lp2y === null) return null;

    const ldx = (p1x as number) - (p0x as number);
    const lt = ldx === 0 ? 0 : ((lp2x as number) - (p0x as number)) / ldx;
    const lInterpY = (p0y as number) + lt * ((p1y as number) - (p0y as number));
    const lPixelOffsetY = (lp2y as number) - lInterpY;

    return {
      l1s: { x: p0x as number, y: p0y as number },
      l1e: { x: p1x as number, y: p1y as number },
      l2s: { x: p0x as number, y: (p0y as number) + lPixelOffsetY },
      l2e: { x: p1x as number, y: (p1y as number) + lPixelOffsetY },
    };
  }

  private _extendToX(from: PixelPoint, to: PixelPoint, targetX: number): PixelPoint {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 0) return { x: targetX, y: to.y };
    const t = (targetX - from.x) / dx;
    return { x: targetX, y: from.y + dy * t };
  }

  private _isPointInQuad(
    px: number,
    py: number,
    a: PixelPoint,
    b: PixelPoint,
    c: PixelPoint,
    d: PixelPoint,
  ): boolean {
    const cross = (o: PixelPoint, a2: PixelPoint, p: { x: number; y: number }) =>
      (a2.x - o.x) * (p.y - o.y) - (a2.y - o.y) * (p.x - o.x);

    const pt = { x: px, y: py };
    const d1 = cross(a, b, pt);
    const d2 = cross(b, c, pt);
    const d3 = cross(c, d, pt);
    const d4 = cross(d, a, pt);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0 || d4 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0 || d4 > 0;

    return !(hasNeg && hasPos);
  }

  private _distToSegment(px: number, py: number, a: PixelPoint, b: PixelPoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2);

    let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = a.x + t * dx;
    const closestY = a.y + t * dy;
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  }
}
