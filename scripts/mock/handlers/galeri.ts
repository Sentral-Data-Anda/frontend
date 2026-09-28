/**
 * Tiruan `/api/v1/gallery` (be-sada `modules/gallery`, bentuk sesudah gap B1/B13/B18)
 * dari larik `GALLERY` + lampiran `Gallery` di kegiatan-store.
 *
 *   MOCK_EMPTY=1                    → daftar album kosong (404)
 *   MOCK_500=1                      → daftar album menjawab 500
 *   MOCK_GALERI_SAVE_ERROR=500      → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import {
  GALLERY,
  bapelOf,
  galleryCodeOf,
  galleryView,
  isLive,
  nextId,
  replaceAttachments,
  type GalleryRow,
} from "../kegiatan-store";
import { denied, json, list, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart, type AttachmentRow } from "../media";

type Issue = { path: string; message: string };

const NOT_FOUND = "Album Tidak Ditemukan";

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const taken = () => json({ status: 409, error: "Album Sudah Tersedia" }, 409);

const bapelMissing = () =>
  json(
    {
      status: 404,
      error: "Badan Pelayanan Tidak Ditemukan",
      issues: [{ path: "bapelId", message: "Badan Pelayanan Tidak Ditemukan" }],
    },
    404,
  );

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const findRow = (code: string) =>
  GALLERY.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const isNameTaken = (name: string, exceptId?: number) =>
  GALLERY.some(
    (row) =>
      isLive(row) &&
      row.id !== exceptId &&
      row.name.toLowerCase() === name.toLowerCase(),
  );

const isTrue = (value: FormDataEntryValue | null) =>
  value === "1" || value === "true" || value === "on";

const parse = (form: FormData, isCreate: boolean) => {
  const issues: Issue[] = [];
  const rawName = form.get("name");
  const name = typeof rawName === "string" ? normalize(rawName) : "";
  const bapelId = Number(form.get("bapelId"));
  const files = filesOf(form, "image");

  if (typeof rawName !== "string") {
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Album" });
  } else if (name.length < 4) {
    issues.push({
      path: "name",
      message: "Nama Album harus memiliki setidaknya 4 karakter",
    });
  } else if (name.length > 100) {
    issues.push({
      path: "name",
      message: "Nama Album tidak boleh lebih dari 100 karakter",
    });
  }
  if (!Number.isInteger(bapelId) || bapelId < 1) {
    issues.push({ path: "bapelId", message: "Mohon Lengkapi Bapel" });
  }
  if (isCreate && files.length === 0) {
    issues.push({
      path: "listImage",
      message: "Album setidaknya memiliki 1 File Foto",
    });
  }

  if (issues.length) {
    return {
      failure: json({ status: 400, error: issues[0].message, issues }, 400),
    };
  }

  return {
    value: {
      name,
      bapelId,
      isPublish: isTrue(form.get("isPublish")),
      files,
      flags: form.getAll("showOnWebsite").map(isTrue),
    },
  };
};

const storePhotos = async (
  row: GalleryRow,
  files: File[],
  flags: boolean[],
) => {
  const rows: AttachmentRow[] = [];

  for (const [index, file] of files.entries()) {
    const stored = await putMedia(file, "gallery");

    rows.push({
      ...stored,
      publicId: crypto.randomUUID(),
      ownerType: "Gallery",
      ownerId: row.id,
      showOnWebsite: flags[index] ?? false,
    });
  }

  replaceAttachments("Gallery", row.id, rows);
};

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const galeriMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/gallery" && !path.startsWith("/gallery/")) return null;

  const code = path.match(/^\/gallery\/([^/]+)$/)?.[1];

  if (!can(MENU.GALERI, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_GALERI_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/gallery" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const bapelId = Number(url.searchParams.get("bapelId")) || null;

    return list(
      GALLERY.filter(isLive)
        .filter((row) => row.name.toLowerCase().includes(filter))
        .filter((row) => bapelId === null || row.bapelId === bapelId)
        .sort((a, b) => b.id - a.id)
        .map(galleryView),
      url,
      "Album",
      "Album",
    );
  }

  if (path === "/gallery" && method === "POST") {
    const form = await readMultipart(request);
    if (form instanceof Response) return form;

    const parsed = parse(form, true);
    if (parsed.failure) return parsed.failure;

    const { name, bapelId, isPublish, files, flags } = parsed.value;
    if (isNameTaken(name)) return taken();
    if (!bapelOf(bapelId)) return bapelMissing();

    const sequence =
      GALLERY.filter((row) => row.bapelId === bapelId).length + 1;
    const row: GalleryRow = {
      id: nextId(GALLERY),
      publicId: crypto.randomUUID(),
      code: galleryCodeOf(bapelId, sequence),
      name,
      isPublish,
      bapelId,
      deletedAt: null,
    };

    GALLERY.push(row);
    await storePhotos(row, files, flags);

    return json(
      { status: 201, message: "Berhasil Membuat Album", data: row },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const form = await readMultipart(request);
    if (form instanceof Response) return form;

    const parsed = parse(form, false);
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return notFound();

    const { name, bapelId, isPublish, files, flags } = parsed.value;
    if (!bapelOf(bapelId)) return bapelMissing();

    const isRenamed = name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(name, row.id)) return taken();

    row.name = name;
    row.bapelId = bapelId;
    row.isPublish = isPublish;
    if (files.length) await storePhotos(row, files, flags);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Album",
      data: row,
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Album",
      data: galleryView(row),
    });
  }

  if (method === "DELETE") {
    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Album",
      data: row,
    });
  }

  return null;
};
