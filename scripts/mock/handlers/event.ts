/**
 * Tiruan `/api/v1/event` (be-sada `kegiatan-gaps`, 03-api-contract §Kegiatan).
 * Juga menjawab `/event?startDate&endDate&isPublish=1` yang dibaca Beranda.
 *
 *   MOCK_EMPTY=1                → daftar kosong (404 "Event Tidak Ditemukan")
 *   MOCK_500=1                  → daftar menjawab 500
 *   MOCK_EVENT_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { ROOM_ROWS } from "../../mock-dashboard";
import {
  EVENT,
  bapelOf,
  eventCodeOf,
  eventView,
  holdersOf,
  isLive,
  listEvents,
  nextId,
  replaceAttachments,
  type EventRow,
} from "../kegiatan-store";
import { denied, json, list, type MockAction, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart } from "../media";

type Issue = { path: string; message: string };

const NOT_FOUND = "Event Tidak Ditemukan";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const failure = (status: number, error: string, issues?: Issue[]) =>
  json(issues ? { status, error, issues } : { status, error }, status);

const invalid = (issues: Issue[]) => failure(400, issues[0].message, issues);

const isOn = (value: string) => ["1", "true", "on"].includes(value);

const isFilterDate = (value: string | null) =>
  value === null || !Number.isNaN(new Date(value).getTime());

const findEvent = (code: string) =>
  EVENT.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

type Parsed = Omit<EventRow, "id" | "publicId" | "code" | "deletedAt">;

function parseEvent(
  form: FormData,
  isCreate: boolean,
): { issues: Issue[]; value?: Parsed } {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const issues: Issue[] = [];
  const onIssue = (path: string, message: string) =>
    issues.push({ path, message });

  const name = text("name");
  const description = text("description");
  const isIndoorRaw = text("isIndoor");
  const capacityRaw = text("capacity");
  const startDate = text("startDate");
  const endDate = text("endDate");
  const startTime = text("startTime");
  const endTime = text("endTime");
  const bapelId = Number(text("bapelId"));
  const urlForm = text("urlForm");

  if (!name) onIssue("name", "Mohon Lengkapi Nama Event");
  else if (name.length < 4) {
    onIssue("name", "Nama Event harus memiliki setidaknya 4 karakter");
  } else if (name.length > 150) {
    onIssue("name", "Nama Event tidak boleh lebih dari 150 karakter");
  }
  if (!description) onIssue("description", "Mohon Lengkapi Deskripsi Event");
  else if (description.length < 10) {
    onIssue(
      "description",
      "Deskripsi Event harus memiliki setidaknya 10 karakter",
    );
  } else if (description.length > 250) {
    onIssue(
      "description",
      "Deskripsi Event tidak boleh lebih dari 250 karakter",
    );
  }
  if (!isIndoorRaw) {
    onIssue(
      "isIndoor",
      "Mohon Pilih Tempat Event (Di Gereja / Di Luar Gereja)",
    );
  }
  if (!capacityRaw) onIssue("capacity", "Mohon Lengkapi Kapasitas Event");
  else if (!Number.isInteger(Number(capacityRaw))) {
    onIssue("capacity", "Kapasitas Event Harus Bilangan Bulat");
  } else if (Number(capacityRaw) < 1) {
    onIssue("capacity", "Kapasitas Event minimal 1 orang");
  }
  if (!DATE.test(startDate)) {
    onIssue("startDate", "Mohon Lengkapi Tanggal Mulai Event");
  }
  if (!DATE.test(endDate)) {
    onIssue("endDate", "Mohon Lengkapi Tanggal Akhir Event");
  }
  if (!startTime) onIssue("startTime", "Mohon Lengkapi Jam Mulai Event");
  else if (!TIME.test(startTime)) {
    onIssue("startTime", "Format Jam Mulai Event harus HH:mm (contoh: 09:00)");
  }
  if (endTime && !TIME.test(endTime)) {
    onIssue("endTime", "Format Jam Selesai Event harus HH:mm (contoh: 12:00)");
  }
  if (!bapelId) onIssue("bapelId", "Mohon Lengkapi Bapel");
  if (urlForm.length > 150) {
    onIssue("urlForm", "Url Form tidak boleh lebih dari 150 karakter");
  }
  if (isCreate && filesOf(form, "mainImage").length === 0) {
    onIssue("image", "Mohon Lengkapi Foto Utama");
  }
  if (issues.length > 0) return { issues };

  const isIndoor = isOn(isIndoorRaw);
  const isPaid = isOn(text("isPaid"));
  const roomId = Number(text("roomId")) || null;
  const location = text("location");
  const price = text("price");

  if (isIndoor && !roomId) onIssue("roomId", "Mohon Lengkapi Lokasi Ruangan");
  if (!isIndoor) {
    if (!location) onIssue("location", "Mohon Lengkapi Lokasi");
    else if (location.length < 4) {
      onIssue("location", "Lokasi harus memiliki setidaknya 4 karakter");
    } else if (location.length > 100) {
      onIssue("location", "Lokasi tidak boleh lebih dari 100 karakter");
    }
  }
  if (isPaid && !price) {
    onIssue("price", "Mohon Lengkapi Jumlah Pembayaran Event");
  } else if (isPaid && Number(price) < 1) {
    onIssue("price", "Jumlah pembayaran event minimal Rp1");
  }
  if (endDate < startDate) {
    onIssue("endDate", "Tanggal Selesai Tidak Boleh Sebelum Tanggal Mulai");
  }
  if (startDate === endDate && endTime && endTime <= startTime) {
    onIssue("endTime", "Jam Selesai Harus Setelah Jam Mulai");
  }
  if (issues.length > 0) return { issues };

  return {
    issues,
    value: {
      name,
      description,
      bapelId,
      isIndoor,
      roomId: isIndoor ? roomId : null,
      location: isIndoor ? null : location,
      capacity: Number(capacityRaw),
      isPaid,
      price: isPaid ? Number(price).toFixed(2) : null,
      startDate,
      endDate,
      startTime,
      endTime: endTime || null,
      urlForm: urlForm || null,
      isPublish: isOn(text("isPublish")),
    },
  };
}

const relationError = (value: Parsed) => {
  if (!bapelOf(value.bapelId)) {
    return failure(404, "Badan Pelayanan Tidak Ditemukan", [
      { path: "bapelId", message: "Badan Pelayanan Tidak Ditemukan" },
    ]);
  }
  if (value.roomId && !ROOM_ROWS.some((row) => row.id === value.roomId)) {
    return failure(404, "Ruang Tidak Ditemukan", [
      { path: "roomId", message: "Ruang Tidak Ditemukan" },
    ]);
  }

  return null;
};

const rawOf = (row: EventRow) => {
  const { deletedAt: _deletedAt, ...rest } = row;

  return {
    ...rest,
    startDate: `${row.startDate}T00:00:00.000Z`,
    endDate: `${row.endDate}T00:00:00.000Z`,
    programId: null,
  };
};

const storeImage = async (form: FormData, row: EventRow) => {
  const [file] = filesOf(form, "mainImage");
  if (!file) return;

  const stored = await putMedia(file, "event");

  replaceAttachments("Event", row.id, [
    {
      publicId: crypto.randomUUID(),
      ownerType: "Event",
      ownerId: row.id,
      showOnWebsite: false,
      ...stored,
    },
  ]);
};

const sortRows = (rows: ReturnType<typeof listEvents>, isDesc: boolean) =>
  [...rows].sort((a, b) => {
    const order =
      a.startDate.localeCompare(b.startDate) ||
      (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
      a.id - b.id;

    return isDesc ? -order : order;
  });

async function create(request: Request) {
  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parseEvent(form, true);
  if (!parsed.value) return invalid(parsed.issues);

  const rejected = relationError(parsed.value);
  if (rejected) return rejected;

  const year = new Date().getFullYear().toString();
  const sequence =
    EVENT.filter(
      (row) =>
        row.bapelId === parsed.value?.bapelId && row.code.includes(`-${year}-`),
    ).length + 1;
  const id = nextId(EVENT);
  const row: EventRow = {
    id,
    publicId: crypto.randomUUID(),
    code: eventCodeOf(parsed.value.bapelId, sequence),
    deletedAt: null,
    ...parsed.value,
  };

  EVENT.push(row);
  await storeImage(form, row);

  return json(
    { status: 201, message: "Berhasil Membuat Event", data: rawOf(row) },
    201,
  );
}

async function update(request: Request, code: string) {
  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parseEvent(form, false);
  if (!parsed.value) return invalid(parsed.issues);

  const row = findEvent(code);
  if (!row) return failure(404, NOT_FOUND);

  const rejected = relationError(parsed.value);
  if (rejected) return rejected;

  const holders = holdersOf(row.id);

  if (parsed.value.capacity < holders) {
    const message = `Kapasitas Tidak Boleh Kurang Dari ${holders} Pendaftar`;

    return failure(400, message, [{ path: "capacity", message }]);
  }
  if (
    holders > 0 &&
    (parsed.value.isPaid !== row.isPaid ||
      Number(parsed.value.price ?? 0) !== Number(row.price ?? 0))
  ) {
    const message = `Status Berbayar Dan Harga Tidak Dapat Diubah Karena Sudah Ada ${holders} Pendaftar`;

    return failure(400, message, [{ path: "isPaid", message }]);
  }

  Object.assign(row, parsed.value);
  await storeImage(form, row);

  return json({
    status: 200,
    message: "Berhasil Memperbarui Event",
    data: rawOf(row),
  });
}

function remove(code: string) {
  const row = findEvent(code);
  if (!row) return failure(404, NOT_FOUND);

  const holders = holdersOf(row.id);

  if (holders > 0) {
    return failure(
      400,
      `Event Tidak Dapat Dihapus Karena Sudah Memiliki ${holders} Pendaftar`,
    );
  }

  row.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: "Berhasil Menghapus Event",
    data: rawOf(row),
  });
}

function readList(url: URL) {
  const params = url.searchParams;

  if (!isFilterDate(params.get("startDate"))) {
    return failure(400, "Tanggal Mulai Filter Tidak Valid", [
      { path: "startDate", message: "Tanggal Mulai Filter Tidak Valid" },
    ]);
  }
  if (!isFilterDate(params.get("endDate"))) {
    return failure(400, "Tanggal Akhir Filter Tidak Valid", [
      { path: "endDate", message: "Tanggal Akhir Filter Tidak Valid" },
    ]);
  }

  const rows = sortRows(listEvents(params), params.get("order") === "desc");

  return list(rows, url, "Event", "Event");
}

const ACTION: Record<string, MockAction> = {
  GET: "VIEW",
  POST: "CREATE",
  PUT: "UPDATE",
  DELETE: "DELETE",
};

export const eventMock: MockHandler = (ctx) => {
  const match = /^\/event(?:\/([^/]+))?$/.exec(ctx.path);
  const action = ACTION[ctx.method];

  if (!match || !action) return null;
  if (!ctx.can(MENU.EVENT, action)) return denied();

  const code = match[1] ? decodeURIComponent(match[1]) : null;

  if (ctx.method !== "GET" && process.env.MOCK_EVENT_SAVE_ERROR === "500") {
    return failure(500, "Kesalahan server.");
  }

  if (ctx.method === "GET" && !code) {
    if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

    return readList(ctx.url);
  }
  if (ctx.method === "GET" && code) {
    const row = findEvent(code);

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Event",
          data: eventView(row),
        })
      : failure(404, NOT_FOUND);
  }
  if (ctx.method === "POST" && !code) return create(ctx.request);
  if (ctx.method === "PUT" && code) return update(ctx.request, code);
  if (ctx.method === "DELETE" && code) return remove(code);

  return null;
};
