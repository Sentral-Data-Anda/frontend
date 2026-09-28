"use client";

import { useBirthdaysInRange, useLoanRoomsInRange } from "../../api";
import { addDaysKey, toDateKey, weekKeys } from "../../model";

export const useWeekBirthdays = () => {
  const days = weekKeys(new Date());
  return { days, query: useBirthdaysInRange(days) };
};

export const useUpcomingLoans = () => {
  const today = toDateKey(new Date());
  return { today, query: useLoanRoomsInRange(today, addDaysKey(today, 6)) };
};
