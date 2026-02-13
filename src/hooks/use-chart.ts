'use client';

import { useRef, useEffect, useCallback } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
} from 'lightweight-charts';
import { createChartTheme } from '@/lib/chart/theme';

interface UseChartOptions {
  autoResize?: boolean;
}

export function useChart(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: UseChartOptions,
) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      ...createChartTheme(),
      width: container.clientWidth,
      height: container.clientHeight,
      autoSize: true,
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (options?.autoResize !== false) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      seriesMapRef.current.clear();
      chart.remove();
      chartRef.current = null;
    };
  }, [containerRef, options?.autoResize]);

  const getChart = useCallback(() => chartRef.current, []);

  const addSeries = useCallback(
    (id: string, series: ISeriesApi<SeriesType>) => {
      seriesMapRef.current.set(id, series);
    },
    [],
  );

  const removeSeries = useCallback((id: string) => {
    const series = seriesMapRef.current.get(id);
    if (series && chartRef.current) {
      chartRef.current.removeSeries(series);
      seriesMapRef.current.delete(id);
    }
  }, []);

  const getSeries = useCallback((id: string) => {
    return seriesMapRef.current.get(id);
  }, []);

  const clearAllSeries = useCallback(() => {
    if (!chartRef.current) return;
    for (const [, series] of seriesMapRef.current) {
      chartRef.current.removeSeries(series);
    }
    seriesMapRef.current.clear();
  }, []);

  return { getChart, addSeries, removeSeries, getSeries, clearAllSeries };
}
