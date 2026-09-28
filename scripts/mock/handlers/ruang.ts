/**
 * Tiruan `/api/v1/room` (be-sada `modules/room`, bentuk sesudah gap B1–B5, B7,
 * B19, B20) dari larik `ROOM` di fasilitas-store.
 *
 *   MOCK_EMPTY=1                 → daftar ruang kosong (404)
 *   MOCK_500=1                   → daftar ruang menjawab 500
 *   MOCK_ROOM_SAVE_ERROR=500     → POST/PUT/DELETE menjawab 500
 *   MOCK_ROOM_USAGE_500=1        → pemakaian ruang menjawab 500
 *   MOCK_ROOM_HAS_BARANG=1       → hapus ditolak karena ruang punya data barang
 */
import { MENU } from "../../../src/config/menu";
import {
  ROOM,
  TODAY,
  isLive,
  nextId,
  roomCodeOf,
  roomPhotoView,
  roomUsageOf,
  upcomingCountsOf,
  type RoomPhoto,
  type RoomRow,
} from "../fasilitas-store";
import { denied, json, list, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart } from "../media";

type Issue = { path: string; message: string };

type Kept = { publicId: string; showOnWebsite: boolean };

const MAX_DETAIL = 4;

const NOT_FOUND = "Ruang Tidak Ditemukan";

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const invalid = (issues: Issue[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const taken = () =>
  json(
    {
      status: 409,
      error: "Ruang Sudah Tersedia",
      issues: [{ path: "name", message: "Ruang Sudah Tersedia" }],
    },
    409,
  );

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const TRUE = ["true", "1", "on"];
const FALSE = ["false", "0", "off"];

const rowView = (row: RoomRow) => ({
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  capacity: row.capacity,
  isActive: row.isActive,
  mainImage: row.mainImage ? roomPhotoView(row.mainImage) : null,
});

const detailView = (row: RoomRow) => ({
  ...rowView(row),
  id: row.id,
  detailImage: row.detailImage.map(roomPhotoView),
});

const findRow = (code: string) =>
  ROOM.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const isNameTaken = (name: string, exceptId?: number) =>
  ROOM.some(
    (row) =>
      isLive(row) &&
      row.id !== exceptId &&
      row.name.toLowerCase() === name.toLowerCase(),
  );

const readKept = (raw: string): Kept[] | null => {
  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) &&
      parsed.every(
        (item) =>
          typeof item?.publicId === "string" &&
          typeof item?.showOnWebsite === "boolean",
      )
      ? (parsed as Kept[])
      : null;
  } catch {
    return null;
  }
};

const parse = (form: FormData, isUpdate: boolean) => {
  const issues: Issue[] = [];
  const rawName = form.get("name");
  const name = typeof rawName === "string" ? normalize(rawName) : "";
  const rawCapacity = form.get("capacity");
  const capacity = Number(rawCapacity);
  const rawActive = form.get("isActive");
  const active = typeof rawActive === "string" ? rawActive.toLowerCase() : "";
  const rawKeep = isUpdate ? form.get("keepFiles") : null;
  const kept = typeof rawKeep === "string" ? readKept(rawKeep) : null;

  if (typeof rawName !== "string") {
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Ruang" });
  } else if (name.length < 4) {
    issues.push({
      path: "name",
      message: "Nama Ruang harus memiliki setidaknya 4 karakter",
    });
  } else if (name.length > 100) {
    issues.push({
      path: "name",
      message: "Nama Ruang tidak boleh lebih dari 100 karakter",
    });
  }
  if (typeof rawCapacity !== "string" || rawCapacity.trim() === "") {
    issues.push({
      path: "capacity",
      message: "Mohon Lengkapi Kapasitas Ruang",
    });
  } else if (!Number.isInteger(capacity)) {
    issues.push({
      path: "capacity",
      message: "Kapasitas Ruang Harus Bilangan Bulat",
    });
  } else if (capacity < 1) {
    issues.push({
      path: "capacity",
      message: "Kapasitas Ruang minimal 1 orang",
    });
  }
  if (active && !TRUE.includes(active) && !FALSE.includes(active)) {
    issues.push({
      path: "isActive",
      message: "Status Aktif harus bernilai true atau false",
    });
  }
  if (typeof rawKeep === "string" && kept === null) {
    issues.push({
      path: "keepFiles",
      message: "Format Foto Yang Dipertahankan Tidak Valid",
    });
  } else if (kept && kept.length > MAX_DETAIL) {
    issues.push({ path: "keepFiles", message: "Foto Detail Ruang Maksimal 4" });
  }

  if (issues.length) return { failure: invalid(issues) };

  return {
    value: {
      name,
      capacity,
      // be-sada: isActive kosong dibaca `true`.
      isActive: !FALSE.includes(active),
      kept,
      mainFile: filesOf(form, "mainImage")[0] ?? null,
      files: filesOf(form, "image"),
    },
  };
};

const storePhoto = async (file: File): Promise<RoomPhoto> => ({
  ...(await putMedia(file, "room")),
  publicId: crypto.randomUUID(),
});

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

const DELETE_BLOCKERS = [
  ["loans", "Peminjaman"],
  ["events", "Event"],
  ["ibadah", "Ibadah"],
] as const;

export const ruangMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/room" && !path.startsWith("/room/")) return null;

  const [, , code, sub] = path.split("/");
  if (sub !== undefined && sub !== "usage") return null;
  if (sub === "usage" && method !== "GET") return null;

  if (!can(MENU.RUANG, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_ROOM_SAVE_ERROR === "500") {
    return serverError();
  }

  if (!code && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const active = (url.searchParams.get("isActive") ?? "").toLowerCase();

    return list(
      ROOM.filter(isLive)
        .filter((row) => row.name.toLowerCase().includes(filter))
        .filter(
          (row) =>
            (!TRUE.includes(active) || row.isActive) &&
            (!FALSE.includes(active) || !row.isActive),
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(rowView),
      url,
      "Ruang",
      "Ruang",
    );
  }

  if (!code && method === "POST") {
    const form = await readMultipart(request);
    if (form instanceof Response) return form;

    const parsed = parse(form, false);
    if (parsed.failure) return parsed.failure;

    const { name, capacity, isActive, mainFile, files } = parsed.value;
    if (isNameTaken(name)) return taken();

    const id = nextId(ROOM);
    const row: RoomRow = {
      id,
      publicId: crypto.randomUUID(),
      code: roomCodeOf(),
      name,
      capacity,
      isActive,
      deletedAt: null,
      mainImage: mainFile ? await storePhoto(mainFile) : null,
      detailImage: await Promise.all(files.map(storePhoto)),
    };

    ROOM.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Ruang", data: detailView(row) },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const form = await readMultipart(request);
    if (form instanceof Response) return form;

    const parsed = parse(form, true);
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return notFound();

    const { name, capacity, isActive, kept, mainFile, files } = parsed.value;
    const isRenamed = name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(name, row.id)) return taken();

    const keptIds = kept?.map((item) => item.publicId) ?? [];
    if (
      keptIds.some(
        (id) => !row.detailImage.some((photo) => photo.publicId === id),
      )
    ) {
      return invalid([
        { path: "detailImage", message: "Foto Tidak Ditemukan" },
      ]);
    }

    const base = kept
      ? row.detailImage.filter((photo) => keptIds.includes(photo.publicId))
      : files.length
        ? []
        : row.detailImage;
    if (base.length + files.length > MAX_DETAIL) {
      return invalid([
        { path: "detailImage", message: "Foto Detail Ruang Maksimal 4" },
      ]);
    }

    row.name = name;
    row.capacity = capacity;
    row.isActive = isActive;
    if (mainFile) row.mainImage = await storePhoto(mainFile);
    row.detailImage = [...base, ...(await Promise.all(files.map(storePhoto)))];

    return json({
      status: 200,
      message: "Berhasil Memperbarui Ruang",
      data: detailView(row),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (sub === "usage") {
    if (process.env.MOCK_ROOM_USAGE_500) return serverError();

    const rows = roomUsageOf(row.id, TODAY, 30).map((item) => ({
      ...item,
      date: item.date.slice(0, 10),
    }));

    return rows.length
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Pemakaian Ruang",
          data: rows,
        })
      : json({ status: 404, error: "Pemakaian Ruang Tidak Ditemukan" }, 404);
  }

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Ruang",
      data: detailView(row),
    });
  }

  if (method === "DELETE") {
    if (process.env.MOCK_ROOM_HAS_BARANG) {
      return json(
        {
          status: 400,
          error:
            "Ruang Tidak Dapat Dihapus Karena Terhubung dengan Data Barang",
        },
        400,
      );
    }

    const counts = upcomingCountsOf(row.id, TODAY);
    const blocker = DELETE_BLOCKERS.find(([key]) => counts[key] > 0);

    if (blocker) {
      const [key, label] = blocker;
      const error = `Ruang Tidak Dapat Dihapus Karena Masih Memiliki ${counts[key]} ${label} Mendatang`;

      return json({ status: 400, error }, 400);
    }

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Ruang",
      data: detailView(row),
    });
  }

  return null;
};
