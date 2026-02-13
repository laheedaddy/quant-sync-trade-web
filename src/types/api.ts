export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  isSuccess: boolean;
  timestamp: string;
  path: string;
  data: {
    result: T;
    totalCount?: number;
  };
}
