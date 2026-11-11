import { useDashboardUmum } from "../../api";
import { addDaysKey, toDateKey, weekKeys } from "../../model";

export const useWeekDashboard = () => {
  const days = weekKeys(new Date());

  return { days, query: useDashboardUmum(days[0], days[6]) };
};

export const useWeekBirthdays = () => {
  const { days, query } = useWeekDashboard();

  return {
    days,
    query: { ...query, data: query.data?.birthdays ?? [] },
  };
};

export const useUpcomingLoans = () => {
  const today = toDateKey(new Date());
  const query = useDashboardUmum(today, addDaysKey(today, 6));

  return {
    today,
    query: { ...query, data: query.data?.loans ?? [] },
  };
};
