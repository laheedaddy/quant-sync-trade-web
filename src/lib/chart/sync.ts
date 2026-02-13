import type { IChartApi, LogicalRange } from 'lightweight-charts';

export class ChartSyncManager {
  private charts = new Set<IChartApi>();
  private isSyncing = false;
  private lastRange: LogicalRange | null = null;

  register(chart: IChartApi) {
    this.charts.add(chart);

    const handler = (range: LogicalRange | null) => {
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

    chart.timeScale().subscribeVisibleLogicalRangeChange(handler);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      this.charts.delete(chart);
    };
  }

  /** Apply the current synced range to a specific chart (call after setting data) */
  applyCurrentRange(chart: IChartApi) {
    if (this.lastRange) {
      chart.timeScale().setVisibleLogicalRange(this.lastRange);
    }
  }
}
