interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errorMessage?: string;
  status?: number;
  totalCount?: number;
}

export const zat: <T = any>(
  url: string,
  body?: any,
  method?: string,
  queryParams?: Record<string, any> | null
) => Promise<ApiResponse<T>>;
