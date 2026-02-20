export interface WatchlistGroup {
  userWatchlistGroupNo: number;
  groupName: string;
  displayOrder: number;
  items: WatchlistItem[];
}

export interface WatchlistItem {
  userWatchlistItemNo: number;
  symbol: string;
  stockName: string;
  exchange: string;
  displayOrder: number;
}

export interface CreateWatchlistGroupRequest {
  groupName: string;
}

export interface UpdateWatchlistGroupRequest {
  groupName?: string;
  displayOrder?: number;
}

export interface AddWatchlistItemRequest {
  symbol: string;
}

export interface MoveWatchlistItemRequest {
  targetGroupNo: number;
}
