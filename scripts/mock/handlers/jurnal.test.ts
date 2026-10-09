import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { JOURNAL_ENTRY, TODAY, journalOfSource } from "../keuangan-store";
import type { MockAction } from "../kit";

import { jurnalMock } from "./jurnal";

type Refusal = { code: string; reason: string; reasonCode: string };

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED = JOURNAL_ENTRY.map((row) => ({
  ...row,
  lines: row.lines.map((line) => ({ ...line })),
}));

afterEach(() => {
  JOURNAL_ENTRY.splice(
    0,
    JOURNAL_ENTRY.length,
    ...SEED.map((row) => ({
      ...row,
      lines: row.lines.map((line) => ({ ...line })),
    })),
  );
  delete process.env.MOCK_UNBALANCED;
  delete process.env.MOCK_PERIOD_CLOSED;
  delete process.env.MOCK_SETTING_EMPTY;
  delete process.env.MOCK_GATEWAY_GIFT;
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await jurnalMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const openMonth = () => TODAY;

const balanced = (entryDate = openMonth()) => ({
  entryDate,
  description: "Uji entri",
  lines: [
    { accountId: 2, debit: "500000", credit: "0" },
    { accountId: 14, debit: "0", credit: "500000" },
  ],
});

const draftOf = () => JOURNAL_ENTRY.find((row) => row.status === "DRAFT");

const postedOf = () =>
  JOURNAL_ENTRY.find(
    (row) => row.status === "POSTED" && row.reversalOfId === null,
  );

const rangeOf = () => {
  const from = `${TODAY.slice(0, 7)}-01`;
  const last = new Date(
    Date.UTC(Number(TODAY.slice(0, 4)), Number(TODAY.slice(5, 7)), 0),
  )
    .toISOString()
    .slice(0, 10);

  return { from, to: last };
};

describe("guard per aksi", () => {
  test("post memakai UPDATE, reverse memakai CREATE", async () => {
    const draft = draftOf();
    const posted = postedOf();
    const viewOnly = (_slug: string, action: MockAction) => action === "VIEW";

    expect(
      (
        await onCall(
          "POST",
          `/jurnal/${draft?.publicId}/post`,
          undefined,
          viewOnly,
        )
      )?.status,
    ).toBe(403);
    expect(
      (
        await onCall(
          "POST",
          `/jurnal/${posted?.publicId}/reverse`,
          { entryDate: TODAY, description: "Balik" },
          viewOnly,
        )
      )?.status,
    ).toBe(403);
  });

  test("posting-persembahan memakai CREATE jurnal", async () => {
    const response = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
      (slug, action) => slug === MENU.JOURNAL_ENTRY && action === "VIEW",
    );

    expect(response?.status).toBe(403);
  });
});

describe("bentuk bacaan", () => {
  test("daftar membawa lineCount dan totalDebit, tanpa baris", async () => {
    const response = await onCall("GET", "/jurnal?limit=100");
    const rows = response?.body.data as Record<string, unknown>[];

    expect(rows[0].lineCount).toBeNumber();
    expect(rows[0].totalDebit).toBeString();
    expect(rows[0].lines).toBeUndefined();
    expect(rows[0].sourceType).toBeString();
    expect(rows[0].isReversal).toBeBoolean();
  });

  test("bacaan satu entri membawa baris dengan publicId dan accountId", async () => {
    const draft = draftOf();
    const response = await onCall("GET", `/jurnal/${draft?.publicId}`);
    const data = response?.body.data as {
      lines: { publicId: string; accountId: number }[];
    };

    expect(data.lines[0].publicId).toStartWith("jln-");
    expect(data.lines[0].accountId).toBeNumber();
  });

  test("entri yang dibalik menandai kedua sisi dengan publicId", async () => {
    const reversal = JOURNAL_ENTRY.find((row) => row.reversalOfId !== null);
    const origin = JOURNAL_ENTRY.find(
      (row) => row.id === reversal?.reversalOfId,
    );
    const forward = await onCall("GET", `/jurnal/${reversal?.publicId}`);
    const backward = await onCall("GET", `/jurnal/${origin?.publicId}`);

    expect(
      (forward?.body.data as { reversalOf: { publicId: string } }).reversalOf
        .publicId,
    ).toBe(String(origin?.publicId));
    expect(
      (backward?.body.data as { reversedBy: { publicId: string } }).reversedBy
        .publicId,
    ).toBe(String(reversal?.publicId));
  });
});

describe("tulis entri", () => {
  test("POST selalu membuat DRAFT", async () => {
    const response = await onCall("POST", "/jurnal", balanced());

    expect(response?.status).toBe(201);
    expect((response?.body.data as { status: string }).status).toBe("DRAFT");
  });

  test("kurang dari dua baris ditolak di path lines", async () => {
    const response = await onCall("POST", "/jurnal", {
      ...balanced(),
      lines: [{ accountId: 2, debit: "1000", credit: "0" }],
    });

    expect(response?.body.issues?.[0].path).toBe("lines");
  });

  test("satu baris dua sisi ditolak di lines.<i>.debit", async () => {
    const response = await onCall("POST", "/jurnal", {
      ...balanced(),
      lines: [
        { accountId: 2, debit: "1000", credit: "1000" },
        { accountId: 14, debit: "0", credit: "1000" },
      ],
    });

    expect(response?.body.issues?.[0].path).toBe("lines.0.debit");
  });

  test("akun nonaktif ditolak dengan code ACCOUNT_INACTIVE", async () => {
    const response = await onCall("POST", "/jurnal", {
      ...balanced(),
      lines: [
        { accountId: 25, debit: "1000", credit: "0" },
        { accountId: 14, debit: "0", credit: "1000" },
      ],
    });

    expect(response?.status).toBe(400);
    expect(response?.body.code).toBe("ACCOUNT_INACTIVE");
  });

  test("periode tertutup ditolak dengan code PERIOD_CLOSED", async () => {
    process.env.MOCK_PERIOD_CLOSED = "1";

    const response = await onCall("POST", "/jurnal", balanced());

    expect(response?.body.code).toBe("PERIOD_CLOSED");
  });

  test("bulan tanpa periode ditolak dengan code PERIOD_NOT_OPEN", async () => {
    const response = await onCall("POST", "/jurnal", balanced("2019-05-10"));

    expect(response?.body.code).toBe("PERIOD_NOT_OPEN");
  });

  test("ubah dan hapus entri bukan DRAFT ditolak", async () => {
    const posted = postedOf();

    expect(
      (await onCall("PUT", `/jurnal/${posted?.publicId}`, balanced()))?.status,
    ).toBe(400);
    expect(
      (await onCall("DELETE", `/jurnal/${posted?.publicId}`))?.status,
    ).toBe(400);
  });

  test("hapus draf mengeluarkannya dari larik", async () => {
    const draft = draftOf();
    const before = JOURNAL_ENTRY.length;

    expect((await onCall("DELETE", `/jurnal/${draft?.publicId}`))?.status).toBe(
      200,
    );
    expect(JOURNAL_ENTRY.length).toBe(before - 1);
  });
});

describe("posting dan pembalikan", () => {
  test("draf tidak seimbang tidak bisa diposting", async () => {
    const created = await onCall("POST", "/jurnal", {
      ...balanced(),
      lines: [
        { accountId: 2, debit: "500000", credit: "0" },
        { accountId: 14, debit: "0", credit: "450000" },
      ],
    });
    const publicId = (created?.body.data as { publicId: string }).publicId;
    const response = await onCall("POST", `/jurnal/${publicId}/post`);

    expect(response?.status).toBe(400);
    expect(response?.body.error).toContain("Seimbang");
  });

  test("draf seimbang diposting dan mencatat siapa yang memposting", async () => {
    const created = await onCall("POST", "/jurnal", balanced());
    const publicId = (created?.body.data as { publicId: string }).publicId;
    const response = await onCall("POST", `/jurnal/${publicId}/post`);
    const data = response?.body.data as {
      status: string;
      postedBy: { name: string } | null;
    };

    expect(data.status).toBe("POSTED");
    expect(data.postedBy).not.toBeNull();
  });

  test("sisi dibandingkan sebagai desimal, bukan float", async () => {
    const created = await onCall("POST", "/jurnal", {
      ...balanced(),
      lines: [
        { accountId: 2, debit: "0.10", credit: "0" },
        { accountId: 3, debit: "0.20", credit: "0" },
        { accountId: 14, debit: "0", credit: "0.30" },
      ],
    });
    const publicId = (created?.body.data as { publicId: string }).publicId;

    expect((await onCall("POST", `/jurnal/${publicId}/post`))?.status).toBe(
      200,
    );
  });

  test("pembalikan memakai tanggal yang dikirim, bukan tanggal entri asli", async () => {
    const posted = postedOf();
    const response = await onCall(
      "POST",
      `/jurnal/${posted?.publicId}/reverse`,
      { entryDate: TODAY, description: "Balik uji" },
    );
    const data = response?.body.data as {
      entryDate: string;
      isReversal: boolean;
      sourceType: string;
    };

    expect(response?.status).toBe(201);
    expect(data.entryDate.slice(0, 10)).toBe(TODAY);
    expect(data.isReversal).toBe(true);
    expect(data.sourceType).toBe("MANUAL");
  });

  test("entri pembalik tidak dapat dibalik", async () => {
    const reversal = JOURNAL_ENTRY.find((row) => row.reversalOfId !== null);
    const response = await onCall(
      "POST",
      `/jurnal/${reversal?.publicId}/reverse`,
      { entryDate: TODAY, description: "Balik lagi" },
    );

    expect(response?.status).toBe(400);
    expect(response?.body.error).toContain("Pembalik");
  });
});

describe("posting persembahan", () => {
  test("dryRun=1 menjawab 200 dan tidak menulis apa pun", async () => {
    const before = JOURNAL_ENTRY.length;
    const response = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
    );

    expect(response?.status).toBe(200);
    expect(JOURNAL_ENTRY.length).toBe(before);
  });

  test("pratinjau dan posting sungguhan melaporkan angka yang sama", async () => {
    const preview = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
    );
    const real = await onCall("POST", "/jurnal/posting-persembahan", rangeOf());
    const previewData = preview?.body.data as {
      posted: number;
      refused: Refusal[];
    };
    const realData = real?.body.data as { posted: number; refused: Refusal[] };

    expect(real?.status).toBe(201);
    expect(realData.posted).toBe(previewData.posted);
    expect(realData.refused.map((row) => row.reasonCode)).toEqual(
      previewData.refused.map((row) => row.reasonCode),
    );
  });

  test("tekan kedua melewati yang sudah dibukukan, bukan menggandakannya", async () => {
    await onCall("POST", "/jurnal/posting-persembahan", rangeOf());

    const again = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
    );
    const data = again?.body.data as { posted: number; skipped: number };

    expect(data.posted).toBe(0);
    expect(data.skipped).toBeGreaterThan(0);
  });

  test("entri batch ditulis lewat pintu bersama: satu entri per persembahan", async () => {
    // Hanya entri yang dibuat tekan ini — seed boleh memuat persembahan yang
    // sudah dibalik, dan itu bukan urusan test ini.
    const before = new Set(JOURNAL_ENTRY.map((row) => row.id));

    await onCall("POST", "/jurnal/posting-persembahan", rangeOf());

    const written = JOURNAL_ENTRY.filter((row) => !before.has(row.id));
    const ids = written.map((row) => row.sourceId);

    expect(written.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of written) {
      expect(row.sourceType).toBe("PERSEMBAHAN");
      expect(journalOfSource("PERSEMBAHAN", row.sourceId as number)).toBe(row);
      expect(row.status).toBe("POSTED");
      expect(row.lines).toHaveLength(2);
    }
  });

  test("dryRun yang tidak terbaca ditolak 400, tidak jadi posting sungguhan", async () => {
    const before = JOURNAL_ENTRY.length;
    const response = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=yes",
      rangeOf(),
    );

    expect(response?.status).toBe(400);
    expect(response?.body.issues?.[0].path).toBe("dryRun");
    expect(JOURNAL_ENTRY.length).toBe(before);
  });

  test("tipe tanpa akun ditolak per baris dengan reasonCode-nya", async () => {
    const response = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
    );
    const data = response?.body.data as { refused: Refusal[] };

    expect(data.refused.map((row) => row.reasonCode)).toContain(
      "OFFERING_TYPE_NO_ACCOUNT",
    );
    expect(data.refused[0].code).toStartWith("PSB-");
  });

  test("MOCK_GATEWAY_GIFT menolak satu baris gateway tanpa membatalkan batch", async () => {
    process.env.MOCK_GATEWAY_GIFT = "1";

    const response = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
    );
    const data = response?.body.data as { posted: number; refused: Refusal[] };

    expect(response?.status).toBe(200);
    expect(data.posted).toBeGreaterThan(0);
    expect(data.refused.map((row) => row.reasonCode)).toContain(
      "SETTING_EMPTY",
    );
  });

  test("MOCK_SETTING_EMPTY menolak setiap baris dengan SETTING_EMPTY", async () => {
    process.env.MOCK_SETTING_EMPTY = "1";

    const response = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
    );
    const data = response?.body.data as { posted: number; refused: Refusal[] };

    expect(data.posted).toBe(0);
    expect(
      data.refused.every((row) =>
        ["SETTING_EMPTY", "OFFERING_TYPE_NO_ACCOUNT"].includes(row.reasonCode),
      ),
    ).toBe(true);
  });

  test("MOCK_PERIOD_CLOSED menolak per baris dengan PERIOD_CLOSED", async () => {
    process.env.MOCK_PERIOD_CLOSED = "1";

    const response = await onCall(
      "POST",
      "/jurnal/posting-persembahan?dryRun=1",
      rangeOf(),
    );
    const data = response?.body.data as { refused: Refusal[] };

    expect(data.refused.map((row) => row.reasonCode)).toContain(
      "PERIOD_CLOSED",
    );
  });

  test("rentang lebih dari 31 hari ditolak", async () => {
    const response = await onCall("POST", "/jurnal/posting-persembahan", {
      from: "2026-01-01",
      to: "2026-03-01",
    });

    expect(response?.status).toBe(400);
    expect(response?.body.issues?.[0].path).toBe("to");
  });

  test("to sebelum from ditolak", async () => {
    const response = await onCall("POST", "/jurnal/posting-persembahan", {
      from: "2026-03-10",
      to: "2026-03-01",
    });

    expect(response?.body.issues?.[0].path).toBe("to");
  });
});
