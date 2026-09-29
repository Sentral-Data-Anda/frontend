import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { addDays, todayJakarta } from "@/lib/date";
import type { AttachmentValue } from "@/types/attachment";

import {
  emptyRequestForm,
  lineTotalOf,
  requestFormSchema,
  toCopiedForm,
  toFormError,
  toRequestApiFilters,
  toRequestForm,
  toRequestFormData,
  type RequestFormValues,
} from "./model";
import type { PurchaseRequestDetail } from "./types";

const TODAY = todayJakarta();

const valid = (patch: Partial<RequestFormValues> = {}): RequestFormValues => ({
  ...emptyRequestForm(),
  bapelId: "2",
  purpose: "Retret pemuda",
  items: [{ name: "Matras", quantity: "2", estimatedUnitPrice: "85000" }],
  ...patch,
});

const issuesOf = (values: RequestFormValues) => {
  const result = requestFormSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

const attachment = (key: string, file: File | null): AttachmentValue => ({
  key,
  name: key,
  mimeType: "image/png",
  url: `blob:${key}`,
  showOnWebsite: false,
  file,
});

const DETAIL: PurchaseRequestDetail = {
  id: 9,
  publicId: "p9",
  code: "PRQ-2026-0009",
  status: "REJECTED",
  purpose: "Kaos seragam",
  neededDate: "2020-01-01T00:00:00.000Z",
  totalEstimatedIDR: "2850000",
  bapelId: 2,
  bapel: { publicId: "b2", code: "BP-2", name: "Komisi Pemuda" },
  requestedBy: { name: "Rina" },
  isRequestedByViewer: false,
  approval: {
    publicId: "a1",
    code: "PP-1",
    status: "REJECTED",
    note: "Nanti",
    isSubmittedByViewer: false,
  },
  createdAt: "2026-09-20T03:00:00.000Z",
  items: [
    {
      publicId: "i1",
      name: "Kaos",
      quantity: 30,
      estimatedUnitPrice: "95000.00",
    },
  ],
  orderedTotalIDR: "0",
  orders: [],
  attachments: [
    {
      publicId: "f1",
      name: "Penawaran",
      mimeType: "image/jpeg",
      size: 1,
      showOnWebsite: false,
      url: "http://media.test/f1",
    },
  ],
};

describe("requestFormSchema", () => {
  test("form lengkap lolos", () => {
    expect(issuesOf(valid())).toEqual({});
  });

  test("badan, keperluan, dan tanggal dibutuhkan", () => {
    expect(
      issuesOf(
        valid({
          bapelId: "",
          purpose: "   ",
          neededDate: addDays(TODAY, -1),
        }),
      ),
    ).toEqual({
      bapelId: "Pilih badan pelayanan",
      purpose: "Isi keperluan",
      neededDate: "Tanggal dibutuhkan tidak boleh sebelum hari ini",
    });
    expect(issuesOf(valid({ purpose: "a".repeat(251) }))).toEqual({
      purpose: "Keperluan maksimal 250 karakter",
    });
    expect(issuesOf(valid({ neededDate: TODAY }))).toEqual({});
  });

  test("baris: minimal satu, galat per field, maksimal 50", () => {
    expect(issuesOf(valid({ items: [] }))).toEqual({
      items: "Tambahkan minimal satu barang",
    });
    expect(
      issuesOf(
        valid({
          items: [
            { name: "A", quantity: "1", estimatedUnitPrice: "1" },
            { name: "", quantity: "0", estimatedUnitPrice: "" },
          ],
        }),
      ),
    ).toEqual({
      "items.1.name": "Isi nama barang",
      "items.1.quantity": "Isi jumlah, minimal 1",
      "items.1.estimatedUnitPrice": "Isi perkiraan harga satuan",
    });
    expect(
      issuesOf(
        valid({
          items: Array.from({ length: 51 }, () => ({
            name: "A",
            quantity: "1",
            estimatedUnitPrice: "1",
          })),
        }),
      ).items,
    ).toBe("Maksimal 50 barang per permintaan");
  });

  test("lampiran maksimal 3", () => {
    expect(
      issuesOf(
        valid({
          attachments: ["a", "b", "c", "d"].map((key) => attachment(key, null)),
        }),
      ),
    ).toEqual({ attachments: "Lampiran maksimal 3 berkas" });
  });
});

describe("hitungan dan payload", () => {
  test("total hanya menjumlah baris yang lengkap", () => {
    expect(
      lineTotalOf([
        { name: "A", quantity: "2", estimatedUnitPrice: "85000" },
        { name: "B", quantity: "", estimatedUnitPrice: "10000" },
        { name: "C", quantity: "3", estimatedUnitPrice: "1500" },
      ]),
    ).toBe(174500);
  });

  test("multipart: items JSON, nama dilebur, keepFiles hanya saat ubah", () => {
    const file = new File(["x"], "baru.png", { type: "image/png" });
    const values = valid({
      purpose: "  Retret   pemuda ",
      neededDate: TODAY,
      items: [
        {
          name: " Matras  gulung ",
          quantity: "2",
          estimatedUnitPrice: "85000",
        },
      ],
      attachments: [attachment("lama", null), attachment("baru", file)],
    });

    const created = toRequestFormData(values, false);
    expect(created.get("purpose")).toBe("Retret pemuda");
    expect(created.get("neededDate")).toBe(TODAY);
    expect(JSON.parse(String(created.get("items")))).toEqual([
      { name: "Matras gulung", quantity: 2, estimatedUnitPrice: 85000 },
    ]);
    expect(created.get("keepFiles")).toBeNull();
    expect(created.get("programId")).toBeNull();
    expect(created.getAll("image")).toHaveLength(1);

    const updated = toRequestFormData(values, true);
    expect(JSON.parse(String(updated.get("keepFiles")))).toEqual([
      { publicId: "lama" },
    ]);

    const cleared = toRequestFormData(valid(), true);
    expect(cleared.get("keepFiles")).toBe("[]");
  });

  test("isi awal ubah menormalkan desimal server; salin tanpa lampiran", () => {
    const edit = toRequestForm({ ...DETAIL, status: "DRAFT" });
    expect(edit.items[0]?.estimatedUnitPrice).toBe("95000");
    expect(edit.attachments).toHaveLength(1);

    const copy = toCopiedForm(DETAIL, "2026-09-29");
    expect(copy).toEqual({
      bapelId: "2",
      purpose: "Kaos seragam",
      neededDate: "",
      items: [{ name: "Kaos", quantity: "30", estimatedUnitPrice: "95000" }],
      attachments: [],
    });
    expect(
      toCopiedForm(
        { ...DETAIL, neededDate: "2026-10-05T00:00:00.000Z" },
        "2026-09-29",
      ).neededDate,
    ).toBe("2026-10-05");
  });

  test("galat image/keepFiles server jatuh ke field lampiran", () => {
    const mapped = toFormError(
      new FetchError(400, "Lampiran Maksimal 3", [
        { path: "image", message: "Lampiran Maksimal 3" },
        { path: "items.2.estimatedUnitPrice", message: "x" },
      ]),
    ) as FetchError;

    expect(mapped.issues.map((issue) => issue.path)).toEqual([
      "attachments",
      "items.2.estimatedUnitPrice",
    ]);
  });

  test("filter URL → query be-sada", () => {
    expect(
      toRequestApiFilters({ bulan: "2026-09", badan: "2", pengaju: "saya" }),
    ).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      bapelId: "2",
      requestedBy: "me",
    });
    expect(toRequestApiFilters({}).requestedBy).toBe("");
  });
});
