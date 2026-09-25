"use client";

import { useBirthdaysInRange, usePendingLoanRooms } from "../../api";
import { addDaysKey, toDateKey, weekKeys } from "../../model";

export const useWeekBirthdays = () => {
  const days = weekKeys(new Date());
  return { days, query: useBirthdaysInRange(days) };
};

export const usePendingLoans = () => {
  const today = toDateKey(new Date());
  return usePendingLoanRooms(today, addDaysKey(today, 30));
};
