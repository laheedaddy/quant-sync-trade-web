import type { IChartApi, ISeriesApi, SeriesType, LogicalRange, MouseEventParams } from 'lightweight-charts';

interface ChartSeriesInfo {
  series: ISeriesApi<SeriesType>;
  dataMap: Map<number, number>;
}

export class ChartSyncManager {
  private charts = new Set<IChartApi>();
  private isSyncing = false;
  private lastRange: LogicalRange | null = null;

  // Crosshair sync
  private isCrosshairSyncing = false;
  private chartSeriesInfo = new Map<IChartApi, ChartSeriesInfo>();
  private crosshairTimeListeners: Array<(time: number | null) => void> = [];

  register(chart: IChartApi) {
    this.charts.add(chart);

    const rangeHandler = (range: LogicalRange | null) => {
      if (this.isSyncing || !range) return;
      this.lastRange = range;
      this.isSyncing = true;

      for (const other of this.charts) {
        if (other !== chart) {
          other.timeScale().setVisibleLogicalRange(range);
        }
      }

      this.isSyncing = false;
    };

    const crosshairHandler = (params: MouseEventParams) => {
      if (this.isCrosshairSyncing) return;
      this.isCrosshairSyncing = true;

      const time = params.time;

      // Notify time listeners (for legend value updates)
      const timeNum = time ? (time as number) : null;
      for (const listener of this.crosshairTimeListeners) {
        listener(timeNum);
      }

      if (time && timeNum) {
        for (const [otherChart, info] of this.chartSeriesInfo) {
          if (otherChart === chart) continue;
          try {
            const price = info.dataMap.get(timeNum);
            if (price != null) {
              otherChart.setCrosshairPosition(price, time, info.series);
            }
          } catch {
            // ignore errors from chart disposal race
          }
        }
      } else {
        for (const otherChart of this.charts) {
          if (otherChart === chart) continue;
          try {
            otherChart.clearCrosshairPosition();
          } catch {
            // ignore
          }
        }
      }

      this.isCrosshairSyncing = false;
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(rangeHandler);
    chart.subscribeCrosshairMove(crosshairHandler);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(rangeHandler);
      chart.unsubscribeCrosshairMove(crosshairHandler);
      this.charts.delete(chart);
      this.chartSeriesInfo.delete(chart);
    };
  }

  /** Register a chart's primary series + data map for crosshair position sync */
  setMainSeries(chart: IChartApi, series: ISeriesApi<SeriesType>, dataMap: Map<number, number>) {
    this.chartSeriesInfo.set(chart, { series, dataMap });
  }

  /** Subscribe to crosshair time changes (for legend value updates across charts) */
  onCrosshairTimeChange(listener: (time: number | null) => void) {
    this.crosshairTimeListeners.push(listener);
    return () => {
      this.crosshairTimeListeners = this.crosshairTimeListeners.filter((l) => l !== listener);
    };
  }

  /** Apply the current synced range to a specific chart (call after setting data) */
  applyCurrentRange(chart: IChartApi) {
    if (this.lastRange) {
      chart.timeScale().setVisibleLogicalRange(this.lastRange);
    }
  }
}
