export interface StockSearchResult {
  stockNo: number;
  symbol: string;
  stockName: string;
  exchange: string;
  exchangeShortName: string;
  stockType: string;
  stockNameLocal: string | null;
  sector: string | null;
  logoUrl: string | null;
  isActive: boolean;
  isDelete: boolean;
}
