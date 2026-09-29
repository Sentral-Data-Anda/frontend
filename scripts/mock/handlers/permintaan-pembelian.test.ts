import { afterEach, describe, expect, test } from "bun:test";

import type { MockAction } from "../kit";
import { PURCHASE_REQUEST, TODAY } from "../pengadaan-store";

import { permintaanPembelianMock } from "./permintaan-pembelian";

const SNAPSHOT = structuredClone(PURCHASE_REQUEST);

afterEach(() => {
  PURCHASE_REQUEST.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  delete process.env.MOCK_PR_NO_WORKFLOW;
});

type Body = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data: Record<string, unknown> & Record<string, unknown>[];
};

const onCall = async (
  input: string,
  init: { method?: string; body?: FormData } = {},
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const method = init.method ?? "GET";
  const request = new Request(url, { method });
  const { body } = init;
  // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
  if (body) request.formData = async () => body;

  const response = (await permintaanPembelianMock({
    request,
    url,
    path: url.pathname,
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Body };
};

const formOf = (fields: Record<string, string>, files: File[] = []) => {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  for (const file of files) body.append("image", file, file.name);

  return body;
};

const VALID = {
  bapelId: "2",
  purpose: "  Perlengkapan   retret ",
  items: JSON.stringify([
    { name: "Matras", quantity: 2, estimatedUnitPrice: 85000 },
  ]),
};

const png = (name: string) => new File(["x"], name, { type: "image/png" });

const codeOfStatus = (status: string, isMine?: boolean) =>
  PURCHASE_REQUEST.find(
    (row) =>
      row.status === status &&
      (isMine === undefined || (row.requestedBy === 1) === isMine),
  )?.code ?? "";

describe("daftar dan detail", () => {
  test("daftar membawa itemCount tanpa items; filter status/saya", async () => {
    const all = await onCall("/permintaan-pembelian?limit=100");

    expect(all.body.data[0].itemCount).toBeNumber();
    expect("items" in all.body.data[0]).toBe(false);

    const drafts = await onCall("/permintaan-pembelian?status=DRAFT");
    expect(drafts.body.data.every((row) => row.status === "DRAFT")).toBe(true);

    const mine = await onCall("/permintaan-pembelian?requestedBy=me&limit=100");
    expect(
      mine.body.data.every((row) => row.isRequestedByViewer === true),
    ).toBe(true);

    const none = await onCall("/permintaan-pembelian?filter=zzz");
    expect(none.status).toBe(404);
    expect(none.body.error).toBe("Permintaan Pembelian Tidak Ditemukan");
  });

  test("detail tanpa peka huruf besar; tanpa VIEW 403", async () => {
    const code = codeOfStatus("DRAFT");
    const detail = await onCall(`/permintaan-pembelian/${code.toLowerCase()}`);

    expect(detail.body.data.code).toBe(code);
    expect(
      (detail.body.data.attachments as unknown as { name: string }[]).map(
        (item) => item.name,
      ),
    ).toEqual(["Penawaran Toko Musik"]);
    expect(
      (detail.body.data.items as unknown as { estimatedUnitPrice: string }[])[0]
        ?.estimatedUnitPrice,
    ).toBe("1250000");
    expect(
      (await onCall(`/permintaan-pembelian/${code}`, {}, () => false)).status,
    ).toBe(403);
  });
});

describe("simpan", () => {
  test("POST multipart membuat Draf dengan keperluan dilebur", async () => {
    const saved = await onCall("/permintaan-pembelian", {
      method: "POST",
      body: formOf(VALID, [png("penawaran.png")]),
    });

    expect(saved.status).toBe(201);
    expect(saved.body.data.status).toBe("DRAFT");
    expect(saved.body.data.purpose).toBe("Perlengkapan retret");
    expect(saved.body.data.totalEstimatedIDR).toBe("170000");
    expect(
      (saved.body.data.attachments as unknown as { name: string }[]).map(
        (item) => item.name,
      ),
    ).toEqual(["penawaran"]);
  });

  test("galat zod memakai path items.<i>.<field>", async () => {
    const saved = await onCall("/permintaan-pembelian", {
      method: "POST",
      body: formOf({
        bapelId: "",
        purpose: "",
        neededDate: "2000-01-01",
        items: JSON.stringify([
          { name: "A", quantity: 1, estimatedUnitPrice: 1 },
          { name: "", quantity: 0, estimatedUnitPrice: "" },
        ]),
      }),
    });

    expect(saved.status).toBe(400);
    expect(saved.body.issues?.map((issue) => issue.path)).toEqual([
      "bapelId",
      "purpose",
      "neededDate",
      "items.1.name",
      "items.1.quantity",
      "items.1.estimatedUnitPrice",
    ]);
  });

  test("lampiran ke-4 ditolak di image", async () => {
    const code = codeOfStatus("DRAFT");
    const saved = await onCall(`/permintaan-pembelian/${code}`, {
      method: "PUT",
      body: formOf(VALID, [png("a.png"), png("b.png"), png("c.png")]),
    });

    expect(saved.status).toBe(400);
    expect(saved.body.issues?.[0]).toEqual({
      path: "image",
      message: "Lampiran Maksimal 3",
    });
  });

  test("PUT keepFiles [] menghapus lampiran lama", async () => {
    const code = codeOfStatus("DRAFT");
    const saved = await onCall(`/permintaan-pembelian/${code}`, {
      method: "PUT",
      body: formOf({ ...VALID, keepFiles: "[]", neededDate: TODAY }),
    });

    expect(saved.status).toBe(200);
    expect(saved.body.data.attachments).toHaveLength(0);
  });

  test("Ditolak dan Menunggu tidak bisa diubah atau dihapus", async () => {
    const rejected = await onCall(
      `/permintaan-pembelian/${codeOfStatus("REJECTED")}`,
      { method: "DELETE" },
    );
    expect(rejected.body.error).toBe(
      "Permintaan Pembelian Ini Sudah Ditolak. Ajukan Ulang Sebagai Permintaan Baru",
    );

    const pending = await onCall(
      `/permintaan-pembelian/${codeOfStatus("PENDING_APPROVAL")}`,
      { method: "PUT", body: formOf(VALID) },
    );
    expect(pending.body.error).toContain("Sedang Menunggu Persetujuan");
  });

  test("hapus Draf mengembalikan publicId dan code", async () => {
    const code = codeOfStatus("DRAFT");
    const removed = await onCall(`/permintaan-pembelian/${code}`, {
      method: "DELETE",
    });

    expect(removed.body.data.code).toBe(code);
    expect((await onCall(`/permintaan-pembelian/${code}`)).status).toBe(404);
  });
});

describe("ajukan dan tarik", () => {
  test("ajukan Draf → Menunggu; tarik oleh pengaju → Draf", async () => {
    const code = codeOfStatus("DRAFT", true);
    const submitted = await onCall(`/permintaan-pembelian/${code}/pengajuan`, {
      method: "POST",
    });

    expect(submitted.status).toBe(201);
    expect(
      (await onCall(`/permintaan-pembelian/${code}`)).body.data.status,
    ).toBe("PENDING_APPROVAL");

    const again = await onCall(`/permintaan-pembelian/${code}/pengajuan`, {
      method: "POST",
    });
    expect(again.body.error).toBe("Permintaan Pembelian Ini Sudah Diajukan");

    const withdrawn = await onCall(`/permintaan-pembelian/${code}/tarik`, {
      method: "PUT",
    });
    expect(withdrawn.body.data.status).toBe("DRAFT");
  });

  test("tanpa alur → 400 dan tetap Draf", async () => {
    process.env.MOCK_PR_NO_WORKFLOW = "1";
    const code = codeOfStatus("DRAFT");
    const submitted = await onCall(`/permintaan-pembelian/${code}/pengajuan`, {
      method: "POST",
    });

    expect(submitted.body.error).toBe(
      "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
    );
  });

  test("ajukan permintaan Menunggu → Sudah Diajukan", async () => {
    const submitted = await onCall(
      `/permintaan-pembelian/${codeOfStatus("PENDING_APPROVAL")}/pengajuan`,
      { method: "POST" },
    );

    expect(submitted.status).toBe(400);
    expect(submitted.body.error).toBe(
      "Permintaan Pembelian Ini Sudah Diajukan",
    );
  });

  test("tarik oleh bukan pengaju → 403", async () => {
    const withdrawn = await onCall(
      `/permintaan-pembelian/${codeOfStatus("PENDING_APPROVAL", false)}/tarik`,
      { method: "PUT" },
    );

    expect(withdrawn.status).toBe(403);
    expect(withdrawn.body.error).toBe(
      "Hanya Pengaju Yang Dapat Menarik Permintaan Ini",
    );
  });
});
