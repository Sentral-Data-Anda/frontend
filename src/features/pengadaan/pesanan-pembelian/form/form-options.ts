import type { UseFormReturn } from "react-hook-form";

import type { OrderFormValues } from "../model";

export type OrderForm = UseFormReturn<OrderFormValues>;

export type RequestEstimate = {
  requestCode: string;
  totalEstimatedIDR: string;
  orderedTotalIDR: string;
};

export type RateState = {
  rate: number | null;
  rateDate: string | null;
};
