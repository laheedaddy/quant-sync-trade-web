const STORAGE_KEY = 'qs-recent-symbols';
const MAX_ITEMS = 10;

export interface RecentSymbol {
  symbol: string;
  stockName: string;
  exchangeShortName: string;
}

export function getRecentSymbols(): RecentSymbol[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentSymbol[];
  } catch {
    return [];
  }
}

export function addRecentSymbol(item: RecentSymbol): void {
  const list = getRecentSymbols().filter((s) => s.symbol !== item.symbol);
  list.unshift(item);
  if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full — ignore
  }
}
