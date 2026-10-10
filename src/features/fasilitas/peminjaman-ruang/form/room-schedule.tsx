"use client";

import { Button } from "@/components/common/control";
import { formatTimeRange } from "@/lib/format";

import { useRoomBooking } from "../api";
import { formatLoanDate, isClash } from "../model";

import { isTimeRange } from "./form-options";
import { ScheduleRow } from "./schedule-row";

interface PropTypes {
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  ownCode?: string;
}

export const RoomSchedule = (props: PropTypes) => {
  const { roomId, roomName, date, startTime, endTime, ownCode } = props;

  const booking = useRoomBooking(roomId, date);
  const items = (booking.data ?? []).filter(
    (item) => !(item.kind === "LOAN" && item.code === ownCode),
  );
  const slot = { startTime, endTime };
  const isSlot = isTimeRange(startTime, endTime);
  const clashCount = isSlot
    ? items.filter((item) => isClash(item, slot)).length
    : 0;
  const titleId = `room-schedule-${roomId}`;

  const onRetry = () => void booking.refetch();

  return (
    <section
      aria-labelledby={titleId}
      aria-busy={booking.isFetching || undefined}
      className="border-border bg-card rounded-control border"
    >
      <header className="border-border flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b px-3 py-2">
        <h3 id={titleId} className="text-body font-medium">
          {`Jadwal ${roomName || "ruang"}, ${formatLoanDate(date)}`}
        </h3>

        {isSlot && booking.isSuccess ? (
          <p
            aria-live="polite"
            className="text-muted-foreground text-caption tabular-nums"
          >
            {clashCount > 0
              ? `${formatTimeRange(startTime, endTime)} bentrok dengan ${clashCount} jadwal`
              : `${formatTimeRange(startTime, endTime)} masih kosong`}
          </p>
        ) : null}
      </header>

      {booking.isPending ? (
        <ol aria-label="Memuat jadwal ruang">
          {[0, 1].map((row) => (
            <li
              key={row}
              aria-hidden
              className="border-border grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3 border-t px-3 py-3 first:border-t-0"
            >
              <span className="bg-skeleton block h-3 w-20 animate-pulse rounded" />
              <span className="bg-skeleton block h-3 w-2/5 animate-pulse rounded" />
            </li>
          ))}
        </ol>
      ) : booking.isError ? (
        <div className="flex flex-wrap items-center gap-x-2 px-3 py-1.5">
          <p className="text-muted-foreground text-caption">
            Jadwal ruang belum bisa dimuat.
          </p>
          <Button
            type="button"
            variant="link"
            className="px-0"
            disabled={booking.isFetching}
            onClick={onRetry}
            isLoading={booking.isFetching}
          >
            {booking.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground px-3 py-2.5 text-caption">
          Ruang ini belum dipakai pada tanggal ini.
        </p>
      ) : (
        <ol>
          {items.map((item) => (
            <ScheduleRow
              key={`${item.kind}-${item.code}`}
              item={item}
              isClash={isSlot && isClash(item, slot)}
            />
          ))}
        </ol>
      )}
    </section>
  );
};
