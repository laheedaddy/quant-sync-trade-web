import type { ISeriesPrimitive, Time } from 'lightweight-charts';
import type { DrawingPoint, DrawingStyle } from '@/types/chart';

export interface IDrawingPrimitive extends ISeriesPrimitive<Time> {
  updatePoints(points: DrawingPoint[]): void;
  updateStyle(style: DrawingStyle): void;
}
