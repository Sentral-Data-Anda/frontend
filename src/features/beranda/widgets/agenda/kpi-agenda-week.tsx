"use client";

import { KpiCell } from "@/components/common/dashboard";

import { useWeekAgenda } from "./data";

export function KpiAgendaWeek() {
  const { ibadah, events, isEventShown } = useWeekAgenda();
  const isLoading = ibadah.isPending || (isEventShown && events.isPending);
  const count = (ibadah.data?.length ?? 0) + (events.data?.length ?? 0);

  return (
    <KpiCell
      label="Agenda minggu ini"
      value={`${count} acara`}
      hint={isEventShown ? "Ibadah & kegiatan" : "Ibadah"}
      isLoading={isLoading}
    />
  );
}
