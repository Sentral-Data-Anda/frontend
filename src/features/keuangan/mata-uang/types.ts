export type LatestRate = {
  rate: string;
  rateDate: string;
};

export type Currency = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  latestRate: LatestRate | null;
};

export type CurrencyPayload = {
  code: string;
  name: string;
  symbol: string;
};

export type RateSource = "AUTO" | "MANUAL";

export type Rate = {
  id: number;
  publicId: string;
  currencyCode: string;
  rateDate: string;
  rate: string;
  source: RateSource;
  currency: { publicId: string; code: string; name: string } | null;
};

export type RatePayload = {
  currencyCode: string;
  rateDate: string;
  rate: string;
  source: "MANUAL";
};
