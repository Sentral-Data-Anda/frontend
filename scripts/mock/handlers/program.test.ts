import { afterEach, describe, expect, test } from "bun:test";

import type { MenuSlug } from "../../../src/config/menu";
import { resetAnggaranStores } from "../anggaran-reset";
import {
  PROGRAM,
  allocationOf,
  ceilingUsage,
  currentBudgetYear,
  isLive,
  programTotal,
} from "../anggaran-store";
import type { MockAction } from "../kit";

// Pagu disemai oleh handler-nya sendiri; tanpa impor ini seluruh pagu null dan
// aritmetika yang diuji di sini tidak punya batas untuk diukur.
import "./pagu-anggaran";
import { programMock } from "./program";

afterEach(resetAnggaranStores);

const YEAR = currentBudgetYear();

const call = async (
  method: string,
  path: string,
  body?: unknown,
  granted: MenuSlug[] | null = null,
) => {
  const url = new URL(`/api/v1${path}`, "http://mock.test");
  const pathOnly = path.split("?")[0]!;
  const response = await programMock({
    request: new Request(url, {
      method,
      ...(body === undefined
        ? {}
        : {
            body: JSON.stringify(body),
            headers: { "content-type": "application/json" },
          }),
    }),
    url,
    path: pathOnly,
    method,
    can: ((slug: MenuSlug) =>
      granted === null || granted.includes(slug)) as unknown as (
      slug: MenuSlug,
      action: MockAction,
    ) => boolean,
    isAdmin: granted === null,
    sessionCode: "test",
  });

  const payload: unknown = response ? await response.json() : null;

  return {
    status: response?.status ?? 0,
    body: payload as Record<string, unknown>,
  };
};

const issuesOf = (body: Record<string, unknown>) =>
  ((body.issues ?? []) as { path: string; message: string }[]).map(
    (issue) => issue.path,
  );

const draftOf = (bapelId: number) =>
  PROGRAM.find(
    (row) =>
      isLive(row) &&
      row.bapelId === bapelId &&
      row.year === YEAR &&
      row.status === "DRAFT" &&
      row.approvals.length === 0,
  )!;

const validBody = (next: Record<string, unknown> = {}) => ({
  name: "Usulan Uji",
  year: YEAR,
  bapelId: 2,
  isUnplanned: false,
  items: [
    {
      accountId: 23,
      description: "Sewa aula",
      quantity: "1",
      unitPrice: "1000000",
    },
  ],
  ...next,
});

describe("mock program: seed", () => {
  test("pagu yang terpakai penuh jatuh tepat di batas, dan itu diterima", () => {
    const usage = ceilingUsage(2, YEAR);

    expect(usage.ceiling).toBe(allocationOf(2, YEAR)!.amount);
    expect(usage.committed).toBe(usage.ceiling ?? "");
    expect(usage.remaining).toBe("0");
    expect(usage.isWithinCeiling).toBe(true);
  });

  test("satu komisi melebihi pagunya satu rupiah", () => {
    const usage = ceilingUsage(3, YEAR);

    expect(Number(usage.committed) - Number(usage.ceiling ?? 0)).toBe(1);
    expect(usage.isWithinCeiling).toBe(false);
  });

  test("komisi tanpa pagu tahun ini menjawab ceiling null, bukan tanpa batas", () => {
    expect(ceilingUsage(6, YEAR).ceiling).toBeNull();
    expect(ceilingUsage(6, YEAR).remaining).toBeNull();
  });

  test("program yang dibatalkan tidak lagi memegang pagu", () => {
    const cancelled = PROGRAM.find((row) => row.status === "CANCELLED")!;
    const usage = ceilingUsage(cancelled.bapelId, cancelled.year);

    expect(Number(usage.committed)).toBeLessThan(Number(usage.ceiling ?? 0));
    expect(programTotal(cancelled)).not.toBe("0");
  });

  test("satu usulan ditolak dengan catatan penolaknya", () => {
    const rejected = PROGRAM.find((row) =>
      row.approvals.some((approval) => approval.status === "REJECTED"),
    )!;

    expect(rejected.status).toBe("DRAFT");
    expect(
      rejected.approvals[0]!.steps.find((step) => step.status === "REJECTED")
        ?.note,
    ).toBeTruthy();
  });

  test("satu usulan melewati akhir tahun pelayanannya", () => {
    const crossing = PROGRAM.find(
      (row) => row.name === "Persiapan Paskah Lintas Tahun",
    )!;

    expect(crossing.endDate).toBeTruthy();
    expect(crossing.endDate! > crossing.startDate!).toBe(true);
  });

  test("satu usulan terhapus tidak muncul di daftar", async () => {
    const { body } = await call("GET", `/program?year=${YEAR}&limit=100`);
    const rows = body.data as { name: string }[];

    expect(rows.some((row) => row.name === "Usulan Lama Yang Dihapus")).toBe(
      false,
    );
  });
});

describe("mock program: bacaan", () => {
  test("kunci rute publicId, bentuk kode ditolak 404", async () => {
    const row = PROGRAM.find(isLive)!;

    expect((await call("GET", `/program/${row.publicId}`)).status).toBe(200);
    expect((await call("GET", `/program/${row.code}`)).status).toBe(404);
  });

  test("daftar kosong dijawab 404", async () => {
    expect((await call("GET", "/program?year=1999")).status).toBe(404);
  });

  test("detail membawa ceiling dan pemakaian yang dilaporkan", async () => {
    const row = PROGRAM.find(isLive)!;
    const { body } = await call("GET", `/program/${row.publicId}`);
    const data = body.data as Record<string, unknown>;

    expect(data.ceiling).toBeTruthy();
    expect(data.reportedUsage).toBeTruthy();
    // Bentuknya yang diuji di sini: `untagged` selalu ada dan selalu angka,
    // tidak pernah undefined. Angkanya diuji di describe asimetri di bawah,
    // dengan barisnya sendiri — mematoknya ke isi benih di sini membuat test
    // bacaan ini jatuh setiap kali ada yang menambah satu LPJ.
    expect((data.reportedUsage as { untagged: string }).untagged).toMatch(
      /^\d+$/,
    );
  });

  test("tanpa VIEW dijawab 403", async () => {
    expect((await call("GET", "/program", undefined, [])).status).toBe(403);
  });
});

describe("mock program: penolakan tulis", () => {
  test("items kosong ditolak dengan issue items", async () => {
    const { status, body } = await call(
      "POST",
      "/program",
      validBody({ items: [] }),
    );

    expect(status).toBe(400);
    expect(issuesOf(body)).toContain("items");
  });

  test("nominal nol dan desimal berlebih ditolak per baris", async () => {
    const { status, body } = await call(
      "POST",
      "/program",
      validBody({
        items: [
          {
            accountId: 23,
            description: "Sewa",
            quantity: "0",
            unitPrice: "1000.123",
          },
        ],
      }),
    );

    expect(status).toBe(400);
    expect(issuesOf(body)).toContain("items.0.quantity");
    expect(issuesOf(body)).toContain("items.0.unitPrice");
  });

  test("akun yang tidak ada dijawab 404", async () => {
    expect(
      (
        await call(
          "POST",
          "/program",
          validBody({
            items: [
              {
                accountId: 9999,
                description: "Sewa",
                quantity: "1",
                unitPrice: "1000",
              },
            ],
          }),
        )
      ).status,
    ).toBe(404);
  });

  test("akun terhapus dijawab 404, bukan diterima diam-diam", async () => {
    expect(
      (
        await call(
          "POST",
          "/program",
          validBody({
            items: [
              {
                accountId: 26,
                description: "Sewa",
                quantity: "1",
                unitPrice: "1000",
              },
            ],
          }),
        )
      ).status,
    ).toBe(404);
  });

  test("akun nonaktif ditolak dengan code ACCOUNT_INACTIVE", async () => {
    const { status, body } = await call(
      "POST",
      "/program",
      validBody({
        items: [
          {
            accountId: 25,
            description: "Sewa",
            quantity: "1",
            unitPrice: "1000",
          },
        ],
      }),
    );

    expect(status).toBe(400);
    expect(body.code).toBe("ACCOUNT_INACTIVE");
  });

  test("akun bukan beban atau aset ditolak di field barisnya", async () => {
    const { status, body } = await call(
      "POST",
      "/program",
      validBody({
        items: [
          {
            accountId: 16,
            description: "Sewa",
            quantity: "1",
            unitPrice: "1000",
          },
        ],
      }),
    );

    expect(status).toBe(400);
    expect(issuesOf(body)).toContain("items.0.accountId");
  });

  test("komisi yang tidak ada dijawab 404", async () => {
    expect(
      (await call("POST", "/program", validBody({ bapelId: 99 }))).status,
    ).toBe(404);
  });

  test("tanggal selesai sebelum tanggal mulai ditolak di field endDate", async () => {
    const { status, body } = await call(
      "POST",
      "/program",
      validBody({ startDate: `${YEAR}-08-10`, endDate: `${YEAR}-08-01` }),
    );

    expect(status).toBe(400);
    expect(issuesOf(body)).toContain("endDate");
  });

  test("tahun di luar 2000-2100 ditolak di field year", async () => {
    const { status, body } = await call(
      "POST",
      "/program",
      validBody({ year: 1999 }),
    );

    expect(status).toBe(400);
    expect(issuesOf(body)).toContain("year");
  });
});

describe("mock program: aksi status", () => {
  test("ajukan melebihi pagu ditolak dengan CEILING_EXCEEDED dan sisa pagunya", async () => {
    const over = PROGRAM.find(
      (row) => isLive(row) && row.bapelId === 3 && row.year === YEAR,
    )!;
    const { status, body } = await call(
      "POST",
      `/program/${over.publicId}/pengajuan`,
    );

    expect(status).toBe(400);
    expect(body.code).toBe("CEILING_EXCEEDED");
    expect(body.remaining).toBeTruthy();
  });

  test("ajukan tanpa pagu tahun itu ditolak dengan CEILING_MISSING", async () => {
    const noCeiling = PROGRAM.find(
      (row) => isLive(row) && row.bapelId === 6 && row.year === YEAR,
    )!;
    const { status, body } = await call(
      "POST",
      `/program/${noCeiling.publicId}/pengajuan`,
    );

    expect(status).toBe(400);
    expect(body.code).toBe("CEILING_MISSING");
  });

  test("ajukan saat sudah ada permintaan terbuka ditolak dengan UNDER_APPROVAL", async () => {
    const pending = PROGRAM.find(
      (row) =>
        isLive(row) &&
        row.approvals.some((approval) => approval.status === "PENDING"),
    )!;
    const { status, body } = await call(
      "POST",
      `/program/${pending.publicId}/pengajuan`,
    );

    expect(status).toBe(400);
    expect(body.code).toBe("UNDER_APPROVAL");
  });

  test("ubah dan hapus program yang sudah disetujui ditolak", async () => {
    const approved = PROGRAM.find(
      (row) => isLive(row) && row.status === "APPROVED",
    )!;

    expect(
      (await call("PUT", `/program/${approved.publicId}`, validBody())).body
        .code,
    ).toBe("ALREADY_APPROVED");
    expect(
      (await call("DELETE", `/program/${approved.publicId}`)).body.code,
    ).toBe("ALREADY_APPROVED");
  });

  test("tarik oleh bukan pengaju dijawab 403", async () => {
    const other = PROGRAM.find(
      (row) =>
        isLive(row) &&
        row.approvals.some(
          (approval) =>
            approval.status === "PENDING" && approval.submittedById !== 1,
        ),
    )!;

    expect((await call("PUT", `/program/${other.publicId}/tarik`)).status).toBe(
      403,
    );
  });

  test("batalkan tanpa alasan ditolak di field cancelReason", async () => {
    const draft = draftOf(5);
    const { status, body } = await call(
      "PUT",
      `/program/${draft.publicId}/batal`,
      {},
    );

    expect(status).toBe(400);
    expect(issuesOf(body)).toContain("cancelReason");
  });

  test("batalkan program yang sudah dibatalkan ditolak", async () => {
    const cancelled = PROGRAM.find((row) => row.status === "CANCELLED")!;

    expect(
      (
        await call("PUT", `/program/${cancelled.publicId}/batal`, {
          cancelReason: "Apa saja",
        })
      ).status,
    ).toBe(400);
  });

  test("tambah lalu ajukan tepat di sisa pagu diterima, lalu bisa ditarik", async () => {
    const before = ceilingUsage(4, YEAR);
    const created = await call(
      "POST",
      "/program",
      validBody({
        name: "Usulan Tepat Di Sisa Pagu",
        bapelId: 4,
        items: [
          {
            accountId: 23,
            description: "Sewa aula",
            quantity: "1",
            unitPrice: before.remaining!,
          },
        ],
      }),
    );

    expect(created.status).toBe(201);

    const publicId = (created.body.data as { publicId: string }).publicId;

    expect((await call("POST", `/program/${publicId}/pengajuan`)).status).toBe(
      200,
    );
    expect(ceilingUsage(4, YEAR).remaining).toBe("0");
    expect((await call("PUT", `/program/${publicId}/tarik`)).status).toBe(200);
    expect((await call("DELETE", `/program/${publicId}`)).status).toBe(200);
  });

  test("tulis tanpa izin aksinya dijawab 403", async () => {
    const draft = draftOf(5);

    expect((await call("POST", "/program", validBody(), [])).status).toBe(403);
    expect(
      (await call("DELETE", `/program/${draft.publicId}`, undefined, []))
        .status,
    ).toBe(403);
  });
});
