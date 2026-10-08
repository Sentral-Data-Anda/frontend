/** An account as a read brings it back: never the bare id on screen. */
export type TipeBarangAccount = {
  id: number;
  code: string;
  name: string;
};

export type TipeBarang = {
  publicId: string;
  code: string;
  name: string;
  /**
   * The three accounts a type sends its money to. Null is "belum diatur", and
   * depreciation then falls back to the keys in Setelan Akuntansi.
   */
  assetAccount: TipeBarangAccount | null;
  depreciationExpenseAccount: TipeBarangAccount | null;
  accumulatedDepreciationAccount: TipeBarangAccount | null;
};

export type TipeBarangPayload = {
  name: string;
  assetAccountId: number | null;
  depreciationExpenseAccountId: number | null;
  accumulatedDepreciationAccountId: number | null;
};
