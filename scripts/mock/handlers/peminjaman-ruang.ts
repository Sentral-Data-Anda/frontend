/**
 * Tiruan `/api/v1/loan-room` (be-sada cabang `fasilitas-gaps`, kontrak
 * docs/design/_contract-drafts/03-api-contract-fasilitas-section.md). Larik
 * `LOAN` milik berkas ini; `ROOM`, ibadah, dan event hanya dibaca lewat store.
 *
 *   MOCK_EMPTY=1                  → daftar kosong (404)
 *   MOCK_500=1                    → daftar menjawab 500
 *   MOCK_LOAN_SAVE_ERROR=500      → POST/PUT/DELETE menjawab 500
 *   MOCK_LOAN_SAVE_ERROR=race     → POST/PUT menjawab 409 constraint tanpa issues
 *   MOCK_BOOKING_500=1            → GET /loan-room/booking menjawab 500
 *   MOCK_CHECK_500=1              → POST /loan-room/check menjawab 500
 *   MOCK_BATCH_ERROR=row          → POST /loan-room/batch: baris indeks 1 bentrok
 *   MOCK_BATCH_ERROR=race         → POST /loan-room/batch menjawab 409 tanpa issues
 *   MOCK_BATCH_ERROR=500          → POST /loan-room/batch menjawab 500
 *
 * Saat handler pertama dipanggil ditambah satu peminjaman H+10 di Kelas Sekolah
 * Minggu (ruang nonaktif), supaya form ubah memperlihatkan "(nonaktif)".
 */
import { z } from "zod";

import { MENU } from "../../../src/config/menu";
import { addDays } from "../../../src/lib/date";
import { formatTimeRange } from "../../../src/lib/format";
import {
  bapelOf,
  clashesOf,
  clashMessage,
  isLive,
  isOverlap,
  jemaatOf,
  listLoans,
  LOAN,
  loanCodeOf,
  loanView,
  nextId,
  occupancyOf,
  roomOf,
  TODAY,
  type LoanRow,
} from "../fasilitas-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";

type Issue = { path: string; message: string };

const RACE =
  "Ruang Sudah Dipakai Pada Tanggal atau Jam yang Dipilih. Silakan Pilih Tanggal atau Jam Lain";

const MAX_ROWS = 26;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const failure = (status: number, error: string, path?: string) =>
  json(
    path
      ? { status, error, issues: [{ path, message: error }] }
      : { status, error },
    status,
  );

const invalid = (issues: Issue[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const issuesOf = (error: z.ZodError, prefix = "") =>
  error.issues.map((issue) => ({
    path: `${prefix}${issue.path.join(".")}`,
    message: issue.message,
  }));

const requiredId = (message: string) =>
  z
    .number({ error: message })
    .int({ error: message })
    .positive({ error: message });

const time = (label: string, example: string) =>
  z
    .string({ error: `Mohon Lengkapi ${label}` })
    .min(1, { error: `Mohon Lengkapi ${label}` })
    .regex(TIME, {
      error: `Format ${label} harus HH:mm (contoh: ${example})`,
    });

const endAfterStart = {
  error: "Jam Selesai harus setelah Jam Mulai Pemakaian",
  path: ["endTime"],
};

const loanSchema = z
  .object({
    date: z
      .string({ error: "Mohon Lengkapi Tanggal Pemakaian" })
      .regex(DATE, { error: "Mohon Lengkapi Tanggal Pemakaian" }),
    startTime: time("Jam Mulai", "07:00"),
    endTime: time("Jam Selesai", "09:00"),
    purpose: z
      .string({ error: "Mohon Lengkapi Tujuan Pemakaian" })
      .trim()
      .min(1, {
        error: "Tujuan Pemakaian harus memiliki setidaknya 1 karakter",
      })
      .max(150, {
        error: "Tujuan Pemakaian tidak boleh lebih dari 150 karakter",
      }),
    jemaatId: requiredId("Mohon Lengkapi Peminjam"),
    roomId: requiredId("Mohon Lengkapi Ruang"),
    bapelId: z
      .union([z.literal(""), z.number()], {
        error: "Badan Pelayanan Tidak Valid",
      })
      .nullish()
      .transform((value) => (typeof value === "number" ? value : null))
      .refine(
        (value) => value === null || (Number.isInteger(value) && value > 0),
        {
          error: "Badan Pelayanan Tidak Valid",
        },
      ),
  })
  .refine((body) => body.endTime > body.startTime, endAfterStart);

type LoanInput = z.infer<typeof loanSchema>;

const checkSchema = z
  .object({
    roomId: requiredId("Mohon Lengkapi Ruang"),
    startTime: time("Jam Mulai", "07:00"),
    endTime: time("Jam Selesai", "09:00"),
    dates: z
      .array(z.string().regex(DATE, { error: "Format Tanggal Tidak Valid" }), {
        error: "Mohon Lengkapi Tanggal Peminjaman",
      })
      .min(1, { error: "Mohon Lengkapi Tanggal Peminjaman" })
      .max(MAX_ROWS, { error: "Maksimal 26 Tanggal Dalam Satu Kali Periksa" }),
  })
  .refine((body) => body.endTime > body.startTime, endAfterStart);

const notFound = () => failure(404, "Peminjaman Tidak Ditemukan");

const findLoan = (code: string) =>
  LOAN.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const relationIssue = (input: LoanInput, current?: LoanRow): Issue | null => {
  const isChanged = <K extends "jemaatId" | "roomId" | "bapelId">(key: K) =>
    !current || current[key] !== input[key];

  if (isChanged("jemaatId") && !jemaatOf(input.jemaatId)) {
    return { path: "jemaatId", message: "Jemaat Tidak Ditemukan" };
  }

  const room = roomOf(input.roomId);

  if (isChanged("roomId") && !room) {
    return { path: "roomId", message: "Ruang Tidak Ditemukan" };
  }
  if (isChanged("roomId") && room && !room.isActive) {
    return { path: "roomId", message: "Ruang Tidak Aktif" };
  }
  if (
    isChanged("bapelId") &&
    input.bapelId !== null &&
    !bapelOf(input.bapelId)
  ) {
    return { path: "bapelId", message: "Badan Pelayanan Tidak Ditemukan" };
  }

  return null;
};

const clashOf = (input: LoanInput, excludeCode?: string) =>
  clashesOf({ ...input, excludeCode })[0];

const fieldsOf = (input: LoanInput) => ({
  date: input.date,
  startTime: input.startTime,
  endTime: input.endTime,
  purpose: input.purpose,
  roomId: input.roomId,
  bapelId: input.bapelId,
  jemaatId: input.jemaatId,
});

const insert = (input: LoanInput) => {
  const id = nextId(LOAN);
  const row: LoanRow = {
    id,
    publicId: `00000000-0000-4000-d000-${String(id).padStart(12, "0")}`,
    code: loanCodeOf(input.roomId, input.bapelId, input.date.slice(0, 4)),
    deletedAt: null,
    ...fieldsOf(input),
  };

  LOAN.push(row);

  return row;
};

const statusFor = (issue: Issue) =>
  issue.message.endsWith("Tidak Ditemukan") ? 404 : 400;

const save = async (request: Request, code?: string) => {
  const parsed = loanSchema.safeParse(await readBody<unknown>(request));

  if (!parsed.success) return invalid(issuesOf(parsed.error));

  const current = code === undefined ? undefined : findLoan(code);

  if (code !== undefined && !current) return notFound();

  const input = parsed.data;
  const relation = relationIssue(input, current);

  if (relation)
    return failure(statusFor(relation), relation.message, relation.path);

  const clash = clashOf(input, current?.code);

  if (clash) return failure(409, clashMessage(clash), "startTime");
  if (process.env.MOCK_LOAN_SAVE_ERROR === "race") return failure(409, RACE);

  if (current) {
    Object.assign(current, fieldsOf(input));

    return json({
      status: 200,
      message: "Berhasil Memperbarui Peminjaman",
      data: loanView(current, true),
    });
  }

  return json(
    {
      status: 201,
      message: "Berhasil Membuat Peminjaman",
      data: loanView(insert(input), true),
    },
    201,
  );
};

const booking = (params: URLSearchParams) => {
  const roomId = Number(params.get("roomId")) || 0;
  const date = params.get("date") ?? "";
  const issues = [
    ...(roomId > 0
      ? []
      : [{ path: "roomId", message: "Mohon Pilih Ruang dan Tanggal" }]),
    ...(DATE.test(date)
      ? []
      : [{ path: "date", message: "Mohon Pilih Ruang dan Tanggal" }]),
  ];

  if (issues.length > 0) return invalid(issues);
  if (process.env.MOCK_BOOKING_500) return failure(500, "Kesalahan server.");

  const data = occupancyOf(roomId, date);

  return data.length === 0
    ? failure(404, "Jadwal Ruang Tidak Ditemukan")
    : json({ status: 200, message: "Berhasil Mendapatkan Jadwal Ruang", data });
};

const check = async (request: Request) => {
  if (process.env.MOCK_CHECK_500) return failure(500, "Kesalahan server.");

  const parsed = checkSchema.safeParse(await readBody<unknown>(request));

  if (!parsed.success) return invalid(issuesOf(parsed.error));

  const { roomId, startTime, endTime, dates } = parsed.data;
  const room = roomOf(roomId);

  if (!room) return failure(404, "Ruang Tidak Ditemukan", "roomId");
  if (!room.isActive) return failure(400, "Ruang Tidak Aktif", "roomId");

  return json({
    status: 200,
    message: "Berhasil Memeriksa Jadwal Ruang",
    data: dates.map((date) => ({
      date,
      clashes: clashesOf({ roomId, date, startTime, endTime }).map(
        ({ kind, code, name, startTime: start, endTime: end }) => ({
          kind,
          code,
          name,
          startTime: start,
          endTime: end,
        }),
      ),
    })),
  });
};

const batch = async (request: Request) => {
  const body = await readBody<{ rows?: unknown }>(request);

  if (!Array.isArray(body?.rows) || body.rows.length === 0) {
    return failure(400, "Mohon Lengkapi Tanggal Peminjaman", "rows");
  }
  if (body.rows.length > MAX_ROWS) {
    return failure(
      400,
      "Maksimal 26 Peminjaman Dalam Satu Kali Simpan",
      "rows",
    );
  }

  const parsed = body.rows.map((row) => loanSchema.safeParse(row));
  const zodIssues = parsed.flatMap((result, index) =>
    result.success ? [] : issuesOf(result.error, `rows.${index}.`),
  );

  if (zodIssues.length > 0) return invalid(zodIssues);

  const inputs = parsed.flatMap((result) =>
    result.success ? [result.data] : [],
  );
  const relationIssues = inputs.flatMap((input, index) => {
    const issue = relationIssue(input);

    return issue ? [{ ...issue, path: `rows.${index}.${issue.path}` }] : [];
  });

  if (relationIssues.length > 0) return invalid(relationIssues);

  const clashIssues = inputs.flatMap((input, index) => {
    const earlier = inputs.findIndex(
      (other, at) =>
        at < index &&
        other.roomId === input.roomId &&
        other.date === input.date &&
        isOverlap(other, input),
    );
    const clash = clashOf(input);
    const message =
      earlier >= 0
        ? `Bentrok Dengan Baris ${earlier + 1}`
        : clash
          ? clashMessage(clash)
          : process.env.MOCK_BATCH_ERROR === "row" && index === 1
            ? `Ruang Sudah Dipakai Event Rapat Mendadak Pukul ${formatTimeRange(input.startTime, input.endTime)}`
            : null;

    return message ? [{ path: `rows.${index}.startTime`, message }] : [];
  });

  if (clashIssues.length > 0) return invalid(clashIssues);
  if (process.env.MOCK_BATCH_ERROR === "race") return failure(409, RACE);

  const codes = inputs.map((input) => insert(input).code);

  return json(
    {
      status: 201,
      message: `Berhasil Membuat ${codes.length} Peminjaman`,
      data: { codes },
    },
    201,
  );
};

const actionOf = (method: string, path: string): MockAction =>
  method === "GET"
    ? "VIEW"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : path === "/loan-room" ||
            path === "/loan-room/check" ||
            path === "/loan-room/batch"
          ? "CREATE"
          : "VIEW";

const INACTIVE_ROOM = 5;

let isSeeded = false;

const seedInactiveRoomLoan = () => {
  if (isSeeded) return;

  isSeeded = true;
  insert({
    date: addDays(TODAY, 10),
    startTime: "16:00",
    endTime: "17:30",
    purpose: "Kelas persiapan sidi",
    roomId: INACTIVE_ROOM,
    bapelId: 4,
    jemaatId: 5,
  });
};

export const peminjamanRuangMock: MockHandler = async (ctx) => {
  const { request, url, path, method, can } = ctx;

  if (path !== "/loan-room" && !path.startsWith("/loan-room/")) return null;

  seedInactiveRoomLoan();
  if (!can(MENU.PEMINJAMAN_RUANG, actionOf(method, path))) return denied();

  const isSingleWrite =
    method !== "GET" && !/^\/loan-room\/(check|batch)$/.test(path);

  if (isSingleWrite && process.env.MOCK_LOAN_SAVE_ERROR === "500") {
    return failure(500, "Kesalahan server.");
  }

  if (path === "/loan-room" && method === "GET") {
    if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

    return list(listLoans(url.searchParams), url, "Peminjaman", "Peminjaman");
  }
  if (path === "/loan-room" && method === "POST") return save(request);
  if (path === "/loan-room/booking" && method === "GET") {
    return booking(url.searchParams);
  }
  if (path === "/loan-room/check" && method === "POST") return check(request);
  if (path === "/loan-room/batch" && method === "POST") {
    if (process.env.MOCK_BATCH_ERROR === "500") {
      return failure(500, "Kesalahan server.");
    }

    return batch(request);
  }

  const code = decodeURIComponent(path.slice("/loan-room/".length));

  if (method === "PUT") return save(request, code);

  const row = findLoan(code);

  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Peminjaman",
      data: loanView(row, true),
    });
  }
  if (method === "DELETE") {
    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Peminjaman",
      data: loanView(row, true),
    });
  }

  return null;
};
