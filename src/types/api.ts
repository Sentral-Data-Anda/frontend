export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ApiListResponse<T> = ApiResponse<T[]> & {
  totalData: number;
  totalPage: number;
};

export type ApiErrorBody = {
  status: number;
  error: string;
};
