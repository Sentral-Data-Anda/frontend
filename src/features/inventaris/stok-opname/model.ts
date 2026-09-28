import { z } from "zod";

import { optionsOf } from "@/components/common/control";
import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { monthRange, toDateInput, todayJakarta } from "@/lib/date";
import { formatNumber } from "@/lib/format";

import {
  OPNAME_STATUS_LABEL,
  type OpnameDetail,
  type OpnamePayload,
  type OpnameRoom,
  type StockItemOption,
} from "./types";

export const OPNAME_LIST_PATH = menuHref(MENU.INVENTARIS, MENU.STOK_OPNAME);

export const OPNAME_CREATE_PATH = createHref(MENU.INVENTARIS, MENU.STOK_OPNAME);

export const opnameHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.STOK_OPNAME, code);

export const opnameEditHref = (code: string) =>
  editHref(MENU.INVENTARIS, MENU.STOK_OPNAME, code);

export const stockItemHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG_PERSEDIAAN, code);

export const WHOLE_CHURCH = "Seluruh gereja";

export const STATUS_OPTIONS = optionsOf(OPNAME_STATUS_LABEL);

export const roomNameOf = (room: OpnameRoom | null) =>
  room?.name ?? WHOLE_CHURCH;

export function toOpnameApiFilters(filters: Record<string, string>) {
  const { startDate, endDate } = monthRange(filters.bulan ?? "");

  return { roomId: filters.ruang ?? "", startDate, endDate };
}

export const differenceLabel = (difference: number) => {
  if (difference === 0) return "Sesuai";

  return difference > 0
    ? `+${formatNumber(difference)}`
    : `−${formatNumber(-difference)}`;
};

export const differenceTone = (difference: number) => {
  if (difference === 0) return "text-muted-foreground";

  return difference > 0 ? "text-success" : "text-destructive";
};

export const quantityOf = (quantity: number, unit: string) =>
  `${formatNumber(quantity)} ${unit}`;

export type CountLine = {
  stockItemId: string;
  code: string;
  name: string;
  unit: string;
  systemQuantity: number;
  physicalQuantity: string;
  note: string;
};

export const differenceOf = (
  line: Pick<CountLine, "physicalQuantity" | "systemQuantity">,
) =>
  line.physicalQuantity === ""
    ? null
    : Number(line.physicalQuantity) - line.systemQuantity;

export const countSummaryOf = (lines: readonly CountLine[]) => {
  const differences = lines.map(differenceOf);

  return {
    total: lines.length,
    different: differences.filter((value) => value !== null && value !== 0)
      .length,
    unfilled: differences.filter((value) => value === null).length,
  };
};

export const toCountLine = (row: StockItemOption): CountLine => ({
  stockItemId: String(row.id),
  code: row.code,
  name: row.name,
  unit: row.unit.name,
  systemQuantity: row.quantity,
  physicalQuantity: "",
  note: "",
});

export const stockItemHintOf = (row: StockItemOption) =>
  `${row.code} · stok ${quantityOf(row.quantity, row.unit.name)}`;

const NOTE_MAX = 250;

const NOTE_TOO_LONG = `Catatan maksimal ${NOTE_MAX} karakter`;

export const opnameFormSchema = z
  .object({
    opnameDate: z.string(),
    roomId: z.string(),
    note: z.string(),
    items: z.array(
      z.object({
        stockItemId: z.string(),
        code: z.string(),
        name: z.string(),
        unit: z.string(),
        systemQuantity: z.number(),
        physicalQuantity: z.string(),
        note: z.string(),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.opnameDate) {
      addIssue(["opnameDate"], "Isi tanggal opname");
    } else if (values.opnameDate > todayJakarta()) {
      addIssue(["opnameDate"], "Tanggal opname tidak boleh di masa depan");
    }

    if (values.note.trim().length > NOTE_MAX) {
      addIssue(["note"], NOTE_TOO_LONG);
    }

    if (values.items.length === 0) {
      addIssue(["items"], "Tambahkan minimal satu barang yang dihitung");
    }

    const firstRowOf = new Map<string, number>();

    values.items.forEach((line, index) => {
      const first = firstRowOf.get(line.stockItemId);

      if (first === undefined) firstRowOf.set(line.stockItemId, index);
      else {
        addIssue(
          ["items", index, "stockItemId"],
          `Barang sudah ada di baris ${first + 1}`,
        );
      }

      if (!/^\d+$/.test(line.physicalQuantity)) {
        addIssue(["items", index, "physicalQuantity"], "Isi jumlah fisik");
      }

      const difference = differenceOf(line);

      if (difference !== null && difference !== 0 && !line.note.trim()) {
        addIssue(["items", index, "note"], "Tulis alasan selisih");
      } else if (line.note.trim().length > NOTE_MAX) {
        addIssue(["items", index, "note"], NOTE_TOO_LONG);
      }
    });
  });

export type OpnameFormValues = z.infer<typeof opnameFormSchema>;

export const emptyOpnameForm = (): OpnameFormValues => ({
  opnameDate: todayJakarta(),
  roomId: "",
  note: "",
  items: [],
});

export const toOpnameForm = (detail: OpnameDetail): OpnameFormValues => ({
  opnameDate: toDateInput(detail.opnameDate),
  roomId: detail.roomId === null ? "" : String(detail.roomId),
  note: detail.note ?? "",
  items: detail.items.map((item) => ({
    stockItemId: String(item.stockItemId),
    code: item.stockItem.code,
    name: item.stockItem.name,
    unit: item.stockItem.unit.name,
    systemQuantity: item.systemQuantity,
    physicalQuantity: String(item.physicalQuantity),
    note: item.note ?? "",
  })),
});

export const toOpnamePayload = (values: OpnameFormValues): OpnamePayload => ({
  opnameDate: values.opnameDate,
  roomId: values.roomId ? Number(values.roomId) : null,
  note: values.note.trim() || null,
  items: values.items.map((line) => ({
    stockItemId: Number(line.stockItemId),
    physicalQuantity: Number(line.physicalQuantity),
    note: line.note.trim() || null,
  })),
});

export const noteIssueRowsOf = (issues: readonly { path: string }[]) =>
  new Set(
    issues.flatMap((issue) => {
      const match = /^items\.(\d+)\.note$/.exec(issue.path);

      return match ? [Number(match[1])] : [];
    }),
  );
