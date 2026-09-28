import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { MediaThumb, OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  EVENT_LIST_PATH,
  eventStatusOf,
  formatEventDates,
  formatEventTime,
  formatEventWhen,
  isFull,
  placeOf,
  priceLabel,
} from "../model";
import type { ChurchEvent } from "../types";

import { EventStatusBadge } from "./event-status";

const editHrefOf = (event: ChurchEvent) =>
  editHref(MENU.KEGIATAN, MENU.EVENT, event.code);

const saveFocus = (event: ChurchEvent) =>
  saveListFocus(EVENT_LIST_PATH, event.code);

const labelOf = (event: ChurchEvent) => `Ubah ${event.name}`;

const metaOf = (event: ChurchEvent) =>
  [formatEventWhen(event), placeOf(event)].filter(Boolean).join(" · ");

const thumbOf = (event: ChurchEvent) => (
  <MediaThumb src={event.image?.url ?? null} alt={`Foto ${event.name}`} />
);

const quotaCell = (event: ChurchEvent) => (
  <span
    className={cn(
      "block truncate tabular-nums",
      isFull(event) && "font-medium",
    )}
    title={`${event.registeredCount} dari ${event.capacity} kursi terisi`}
  >
    {isFull(event) ? "Penuh" : `${event.registeredCount}/${event.capacity}`}
  </span>
);

interface PropTypes {
  event: ChurchEvent;
  isCanUpdate?: boolean;
}

export const EventListItemRow = (props: PropTypes) => {
  const { event, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={event.code}
      leading={thumbOf(event)}
      title={event.name}
      meta={metaOf(event)}
      trailing={
        <>
          {eventStatusOf(event) === "UPCOMING" ? null : (
            <EventStatusBadge event={event} />
          )}

          {isCanUpdate ? (
            <Link
              href={editHrefOf(event)}
              onClick={() => saveFocus(event)}
              aria-label={labelOf(event)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
            </Link>
          ) : null}
        </>
      }
    />
  );
};

export function eventTable(isCanUpdate: boolean): DataTableConfig<ChurchEvent> {
  return {
    columns: [
      {
        key: "name",
        header: "Event",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.3fr)",
        cell: (event) => (
          <span className="flex min-w-0 items-center gap-3">
            {thumbOf(event)}
            <span className="min-w-0">
              <span className="block truncate font-medium" title={event.name}>
                {event.name}
              </span>
              <span className="text-muted-foreground block truncate text-caption">
                {event.code}
              </span>
            </span>
          </span>
        ),
      },
      {
        key: "when",
        header: "Waktu",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (event) => (
          <span className="min-w-0 tabular-nums">
            <span className="block truncate">
              {formatEventDates(event.startDate, event.endDate)}
            </span>
            <span className="text-muted-foreground block truncate text-caption">
              {formatEventTime(event) ?? "Jam belum diisi"}
            </span>
          </span>
        ),
      },
      {
        key: "place",
        header: "Tempat",
        width: "minmax(0,1.4fr)",
        narrowWidth: "minmax(0,1.3fr)",
        cell: (event) => (
          <OptionalText text={placeOf(event)} empty="Tanpa tempat" />
        ),
      },
      {
        key: "bapel",
        header: "Badan pelayanan",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (event) => (
          <span className="block truncate" title={event.bapel.name}>
            {event.bapel.name}
          </span>
        ),
      },
      {
        key: "price",
        header: "Biaya",
        width: "minmax(0,0.9fr)",
        isSecondary: true,
        cell: (event) => (
          <span className="block truncate tabular-nums">
            {priceLabel(event)}
          </span>
        ),
      },
      {
        key: "quota",
        header: "Kuota",
        width: "minmax(0,0.8fr)",
        narrowWidth: "minmax(0,0.8fr)",
        cell: quotaCell,
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (event) => <EventStatusBadge event={event} />,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
