/** Tipe response umum API — sesuaikan dengan kontrak API sebenarnya. */
export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};
