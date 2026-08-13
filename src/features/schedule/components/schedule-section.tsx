import { Clock, MapPin } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { SectionTitle } from "@/components/common/section-title";
import { Card, CardContent } from "@/components/ui/card";

import { getSchedules } from "../services/schedule.service";
import type { WorshipSchedule } from "../types/schedule.types";

export async function ScheduleSection({
  withHeader = true,
}: {
  withHeader?: boolean;
}) {
  let items: WorshipSchedule[] = [];

  try {
    items = await getSchedules();
  } catch {
    items = [];
  }

  return (
    <div>
      {withHeader ? (
        <SectionTitle
          title="Jadwal Ibadah"
          subtitle="Mari beribadah bersama. Berikut jadwal ibadah rutin kami."
        />
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-primary">
                  {schedule.day}
                </p>
                <h3 className="text-lg font-semibold">{schedule.name}</h3>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" aria-hidden />
                  {schedule.time} WIB
                </p>
                {schedule.location ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" aria-hidden />
                    {schedule.location}
                  </p>
                ) : null}
                {schedule.note ? (
                  <p className="text-sm text-muted-foreground">
                    {schedule.note}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Jadwal belum tersedia"
          description="Jadwal ibadah akan tampil di sini setelah diperbarui."
        />
      )}
    </div>
  );
}
