export type AssetRegisterRow = {
  publicId: string;
  code: string;
  name: string;
  type: { id: number; name: string };
  bapel: { id: number; code: string; name: string };
  acquisitionDate: string | null;
  acquisitionCost: string;
  isDepreciable: boolean;
  accumulated: string;
  bookValue: string;
};

export type AssetRegister = {
  date: string;
  rows: AssetRegisterRow[];
  /** Jumlah halaman yang sedang dibuka, bukan jumlah seluruh register. */
  pageTotals: {
    acquisitionCost: string;
    accumulated: string;
    bookValue: string;
  };
  totalData: number;
  totalPage: number;
};
