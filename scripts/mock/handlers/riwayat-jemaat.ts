/**
 * Tiruan `/riwayat-jemaat` (be-sada `modules/riwayat_jemaat`). Jemaat = `ddl/jemaat` mock-dashboard.
 *
 *   MOCK_RIWAYAT_ERROR=validasi → simpan 400 dengan `issues[]` (mendarat di field)
 *   MOCK_RIWAYAT_ERROR=500      → simpan 500 (galat tingkat form)
 *   MOCK_RIWAYAT_ERROR=hapus    → hapus 500 (galat hapus di form ubah)
 *   MOCK_500=1                  → daftar riwayat 500
 *
 * 409 "Sudah Memiliki Riwayat" muncul alami: catat Baptis untuk Andreas Sitanggang.
 */
import { MENU } from "../../../src/config/menu";
import { ddlRows } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const TYPE_LABEL: Record<string, string> = {
  BAPTIS: "Baptis",
  SIDI: "Sidi",
  ATESTASI_MASUK: "Atestasi Masuk",
  ATESTASI_KELUAR: "Atestasi Keluar",
  MENINGGAL: "Meninggal",
};

const ONCE = ["BAPTIS", "SIDI", "MENINGGAL"];

type Jemaat = { id: number; code: string; name: string };

const jemaatOf = (code: string) =>
  ((ddlRows("jemaat", new URLSearchParams()) ?? []) as Jemaat[]).find(
    (jemaat) => jemaat.code.toLowerCase() === code.toLowerCase(),
  );

type Row = {
  seq: number;
  publicId: string;
  jemaatCode: string;
  type: string;
  date: string;
  certificateNumber: string | null;
  place: string | null;
};

const SEED: [number, string, string, string | null, string | null][] = [
  [1, "BAPTIS", "1990-06-17", "BPT/1990/014", "GKI Samanhudi"],
  [1, "SIDI", "2006-04-16", "SD/2006/031", "GKI Samanhudi"],
  [2, "ATESTASI_MASUK", "2019-02-03", "ATM/2019/002", "GKJ Jakarta Barat"],
  [3, "BAPTIS", "1995-12-24", null, null],
  [4, "BAPTIS", "1988-03-27", "BPT/1988/007", "GKI Kebayoran Baru"],
  [4, "SIDI", "2004-04-11", "SD/2004/019", "GKI Kebayoran Baru"],
  [5, "ATESTASI_KELUAR", "2024-08-04", "ATK/2024/005", "GPIB Immanuel Depok"],
  [6, "BAPTIS", "2001-05-20", "BPT/2001/022", null],
  [7, "MENINGGAL", "2025-11-09", null, "Bandung"],
  [8, "SIDI", "2012-04-08", "SD/2012/044", "GKI Samanhudi"],
  [9, "ATESTASI_MASUK", "2021-07-11", null, "HKBP Rawamangun"],
  [10, "BAPTIS", "2000-12-25", "BPT/2000/051", "GKI Samanhudi"],
  [11, "SIDI", "2015-03-29", null, null],
  [12, "BAPTIS", "1999-04-04", "BPT/1999/009", "GKI Samanhudi"],
];

const rows: Row[] = SEED.map(([jemaat, type, date, certificate, place], i) => ({
  seq: i + 1,
  publicId: `0b5f3c2e-7d41-4c6a-9e2f-${String(i + 1).padStart(12, "0")}`,
  jemaatCode: `JMT-${String(jemaat).padStart(4, "0")}`,
  type,
  date: `${date}T00:00:00.000Z`,
  certificateNumber: certificate,
  place,
}));

const present = (row: Row) => {
  const name = jemaatOf(row.jemaatCode)?.name ?? row.jemaatCode;

  return {
    id: row.publicId,
    type: row.type,
    typeLabel: TYPE_LABEL[row.type] ?? row.type,
    date: row.date,
    certificateNumber: row.certificateNumber,
    place: row.place,
    jemaat: { code: row.jemaatCode, name },
  };
};

type Body = {
  jemaatCode?: unknown;
  type?: unknown;
  date?: unknown;
  certificateNumber?: unknown;
  place?: unknown;
};

const optionalText = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : null;

// Urutan dan pesan sama dengan `riwayatJemaatSchema`; `date: null` lolos jadi 1970 (gap be-sada).
const issuesOf = (body: Body) => {
  const issues: { path: string; message: string }[] = [];
  const code =
    typeof body.jemaatCode === "string" ? body.jemaatCode.trim() : "";

  if (!code)
    issues.push({ path: "jemaatCode", message: "Mohon Lengkapi Jemaat" });
  if (typeof body.type !== "string" || !TYPE_LABEL[body.type]) {
    issues.push({
      path: "type",
      message:
        "Jenis Riwayat harus Baptis, Sidi, Atestasi Masuk, Atestasi Keluar atau Meninggal",
    });
  }
  if (
    body.date !== null &&
    Number.isNaN(new Date(body.date as string).getTime())
  ) {
    issues.push({ path: "date", message: "Mohon Lengkapi Tanggal" });
  }
  if ((optionalText(body.certificateNumber)?.trim().length ?? 0) > 50) {
    issues.push({
      path: "certificateNumber",
      message: "Nomor Sertifikat tidak boleh lebih dari 50 karakter",
    });
  }
  if ((optionalText(body.place)?.trim().length ?? 0) > 100) {
    issues.push({
      path: "place",
      message: "Tempat tidak boleh lebih dari 100 karakter",
    });
  }

  return issues;
};

const SAVE_FAILURE: Record<
  string,
  {
    status: number;
    error: string;
    issues?: { path: string; message: string }[];
  }
> = {
  validasi: {
    status: 400,
    error: "Nomor surat ditolak server",
    issues: [
      { path: "certificateNumber", message: "Nomor surat ditolak server" },
      { path: "place", message: "Tempat tidak dikenali server" },
    ],
  },
  "500": { status: 500, error: "Kesalahan server." },
};

const notFound = () =>
  json({ status: 404, error: "Riwayat Jemaat Tidak Ditemukan" }, 404);

// `existing` null = PUT ke id yang tidak ada: be-sada memvalidasi badan dulu, baru 404.
const save = async (request: Request, existing?: Row | null) => {
  const failure = SAVE_FAILURE[process.env.MOCK_RIWAYAT_ERROR ?? ""];
  if (failure) return json(failure, failure.status);

  const body = await readBody<Body>(request);
  const issues = issuesOf(body);

  if (issues.length > 0) {
    return json({ status: 400, error: issues[0].message, issues }, 400);
  }
  if (existing === null) return notFound();

  const jemaat = jemaatOf(String(body.jemaatCode).trim());
  if (!jemaat)
    return json({ status: 404, error: "Jemaat Tidak Ditemukan" }, 404);

  const type = String(body.type);
  const clash = rows.find(
    (row) =>
      ONCE.includes(type) &&
      row.jemaatCode === jemaat.code &&
      row.type === type &&
      row !== existing,
  );
  if (clash) {
    return json(
      {
        status: 409,
        error: `${jemaat.name} Sudah Memiliki Riwayat ${TYPE_LABEL[type]}`,
      },
      409,
    );
  }

  const date = body.date === null ? new Date(0) : new Date(body.date as string);
  const next: Row = {
    seq: existing?.seq ?? Math.max(0, ...rows.map((row) => row.seq)) + 1,
    publicId: existing?.publicId ?? crypto.randomUUID(),
    jemaatCode: jemaat.code,
    type,
    date: `${date.toISOString().slice(0, 10)}T00:00:00.000Z`,
    certificateNumber: optionalText(body.certificateNumber),
    place: optionalText(body.place),
  };

  if (existing) Object.assign(existing, next);
  else rows.push(next);

  const { id: _id, typeLabel: _label, ...data } = present(next);

  return json(
    {
      status: existing ? 200 : 201,
      message: existing
        ? "Berhasil Memperbarui Riwayat Jemaat"
        : "Berhasil Mencatat Riwayat Jemaat",
      data: {
        publicId: next.publicId,
        ...data,
        ...(existing ? { jemaatId: jemaat.id } : {}),
      },
    },
    existing ? 200 : 201,
  );
};

export const riwayatJemaatMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/riwayat-jemaat" && !path.startsWith("/riwayat-jemaat/")) {
    return null;
  }

  const id = path.split("/")[2];
  const action = {
    GET: "VIEW",
    POST: "CREATE",
    PUT: "UPDATE",
    DELETE: "DELETE",
  }[method] as "VIEW" | "CREATE" | "UPDATE" | "DELETE" | undefined;

  if (!action) return null;
  if (!can(MENU.RIWAYAT_JEMAAT, action)) return denied();

  if (!id && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const jemaatCode = (url.searchParams.get("jemaatCode") ?? "").toLowerCase();
    const type = url.searchParams.get("type") ?? "";

    const matched = [...rows]
      .sort((a, b) => b.date.localeCompare(a.date) || b.seq - a.seq)
      .map(present)
      .filter(
        (row) =>
          (!filter ||
            [row.certificateNumber, row.place, row.jemaat.name].some((text) =>
              text?.toLowerCase().includes(filter),
            )) &&
          (!jemaatCode || row.jemaat.code.toLowerCase() === jemaatCode) &&
          (!TYPE_LABEL[type] || row.type === type),
      );

    return list(matched, url, "Riwayat Jemaat", "Riwayat Jemaat");
  }

  if (!id && method === "POST") return save(request);

  const row = rows.find((candidate) => candidate.publicId === id);
  if (method === "GET") {
    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Riwayat Jemaat",
          data: present(row),
        })
      : notFound();
  }

  if (method === "PUT") return save(request, row ?? null);

  if (process.env.MOCK_RIWAYAT_ERROR === "hapus") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }
  if (!row) return notFound();

  rows.splice(rows.indexOf(row), 1);

  return json({ status: 200, message: "Berhasil Menghapus Riwayat Jemaat" });
};
