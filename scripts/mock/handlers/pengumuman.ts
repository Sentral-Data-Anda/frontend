/**
 * Tiruan `/api/v1/pengumuman` (be-sada modul `pengumuman`, cabang `kegiatan-gaps`).
 * `/pengumuman/feed` dijawab `pengumuman-feed.ts` (terdaftar lebih dulu).
 *
 *   MOCK_EMPTY=1                     → daftar 404 "Pengumuman Tidak Ditemukan"
 *   MOCK_500=1                       → daftar menjawab 500
 *   MOCK_PENGUMUMAN_SAVE_ERROR=500   → POST/PUT menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_STATUSES,
} from "../../../src/lib/announcement";
import {
  ANNOUNCEMENT,
  announcementCodeOf,
  announcementView,
  attachmentsOf,
  bapelOf,
  isLive,
  nextId,
  replaceAttachments,
  type AnnouncementRow,
} from "../kegiatan-store";
import { denied, json, list, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart, type AttachmentRow } from "../media";

type Issue = { path: string; message: string };

type Kept = { publicId: string; showOnWebsite: boolean };

const MAX_FILES = 4;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const failed = (issues: Issue[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const notFound = () =>
  json({ status: 404, error: "Pengumuman Tidak Ditemukan" }, 404);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const isDate = (value: string) =>
  DATE.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

const textOf = (form: FormData, field: string) => {
  const value = form.get(field);

  return typeof value === "string" ? value : "";
};

const flagOf = (value: string) => ["1", "true", "on"].includes(value);

const byListOrder = (a: AnnouncementRow, b: AnnouncementRow) =>
  Number(b.isPinned) - Number(a.isPinned) ||
  b.publishDate.localeCompare(a.publishDate) ||
  b.id - a.id;

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

const validate = (form: FormData) => {
  const issues: Issue[] = [];
  const title = textOf(form, "title").trim();
  const publishDate = textOf(form, "publishDate");
  const expiryDate = textOf(form, "expiryDate");
  const keepFiles = form.get("keepFiles");

  if (!title) {
    issues.push({ path: "title", message: "Mohon Lengkapi Judul Pengumuman" });
  } else if (title.length < 4) {
    issues.push({
      path: "title",
      message: "Judul Pengumuman harus memiliki setidaknya 4 karakter",
    });
  } else if (title.length > 200) {
    issues.push({
      path: "title",
      message: "Judul Pengumuman tidak boleh lebih dari 200 karakter",
    });
  }
  if (!textOf(form, "content").trim()) {
    issues.push({ path: "content", message: "Mohon Lengkapi Isi Pengumuman" });
  }
  if (
    !(ANNOUNCEMENT_CATEGORIES as readonly string[]).includes(
      textOf(form, "category"),
    )
  ) {
    issues.push({
      path: "category",
      message: "Kategori Pengumuman tidak dikenali",
    });
  }
  if (!isDate(publishDate)) {
    issues.push({
      path: "publishDate",
      message: "Tanggal Terbit harus berupa tanggal yang valid",
    });
  }
  if (expiryDate && !isDate(expiryDate)) {
    issues.push({
      path: "expiryDate",
      message: "Tanggal Berakhir harus berupa tanggal yang valid",
    });
  } else if (expiryDate && isDate(publishDate) && expiryDate < publishDate) {
    issues.push({
      path: "expiryDate",
      message: "Tanggal Berakhir tidak boleh lebih awal dari Tanggal Terbit",
    });
  }
  if (typeof keepFiles === "string" && readKept(keepFiles) === null) {
    issues.push({
      path: "keepFiles",
      message: "Format Lampiran Yang Dipertahankan Tidak Valid",
    });
  }

  return issues;
};

const fieldsOf = (form: FormData) => {
  const expiryDate = textOf(form, "expiryDate");
  const bapelId = Number(textOf(form, "bapelId")) || null;

  return {
    category: textOf(form, "category"),
    title: textOf(form, "title").trim(),
    content: textOf(form, "content").trim(),
    publishDate: textOf(form, "publishDate"),
    expiryDate: expiryDate || null,
    isPublished: flagOf(textOf(form, "isPublished")),
    isPinned: flagOf(textOf(form, "isPinned")),
    bapelId,
  };
};

const uploadsOf = async (form: FormData): Promise<AttachmentRow[]> => {
  const flags = form.getAll("showOnWebsite");

  return Promise.all(
    filesOf(form, "image").map(async (file, index) => ({
      ...(await putMedia(file, "announcement")),
      publicId: crypto.randomUUID(),
      ownerType: "Announcement" as const,
      ownerId: 0,
      showOnWebsite: flagOf(String(flags[index] ?? "")),
    })),
  );
};

const listAnnouncements = (url: URL) => {
  const filter = (url.searchParams.get("filter") ?? "").trim().toLowerCase();
  const category = url.searchParams.get("category") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const isCategory = (ANNOUNCEMENT_CATEGORIES as readonly string[]).includes(
    category,
  );
  const isStatus = (ANNOUNCEMENT_STATUSES as readonly string[]).includes(
    status,
  );

  return list(
    ANNOUNCEMENT.filter(isLive)
      .filter((row) => row.title.toLowerCase().includes(filter))
      .filter((row) => !isCategory || row.category === category)
      .filter((row) => !bapelId || row.bapelId === bapelId)
      .sort(byListOrder)
      .map(announcementView)
      .filter((row) => !isStatus || row.status === status),
    url,
    "Pengumuman",
    "Pengumuman",
  );
};

const save = async (form: FormData, row: AnnouncementRow | null) => {
  const fields = fieldsOf(form);
  const keepRaw = form.get("keepFiles");
  const kept = typeof keepRaw === "string" ? readKept(keepRaw) : null;
  const current = row ? attachmentsOf("Announcement", row.id) : [];

  if (fields.bapelId !== null && !bapelOf(fields.bapelId)) {
    return json(
      {
        status: 404,
        error: "Badan Pelayanan Tidak Ditemukan",
        issues: [
          { path: "bapelId", message: "Badan Pelayanan Tidak Ditemukan" },
        ],
      },
      404,
    );
  }
  if (
    row &&
    kept &&
    kept.some(
      (item) => !current.some((file) => file.publicId === item.publicId),
    )
  ) {
    return failed([
      {
        path: "keepFiles",
        message: "Lampiran Yang Dipertahankan Tidak Ditemukan",
      },
    ]);
  }

  const uploads = await uploadsOf(form);
  const retained =
    row && kept
      ? current
          .filter((file) =>
            kept.some((item) => item.publicId === file.publicId),
          )
          .map((file) => ({
            ...file,
            showOnWebsite: kept.find((item) => item.publicId === file.publicId)!
              .showOnWebsite,
          }))
      : uploads.length
        ? []
        : current;

  if (retained.length + uploads.length > MAX_FILES) {
    return failed([
      { path: "listImage", message: "Lampiran Tidak Boleh Lebih Dari 4 File" },
    ]);
  }

  const target =
    row ??
    ({
      id: nextId(ANNOUNCEMENT),
      publicId: crypto.randomUUID(),
      code: announcementCodeOf(nextId(ANNOUNCEMENT)),
      deletedAt: null,
      ...fields,
    } satisfies AnnouncementRow);

  Object.assign(target, fields);
  if (!row) ANNOUNCEMENT.push(target);

  replaceAttachments("Announcement", target.id, [
    ...retained,
    ...uploads.map((file) => ({ ...file, ownerId: target.id })),
  ]);

  return json(
    {
      status: row ? 200 : 201,
      message: row
        ? "Berhasil Memperbarui Pengumuman"
        : "Berhasil Membuat Pengumuman",
      data: announcementView(target),
    },
    row ? 200 : 201,
  );
};

export const pengumumanMock: MockHandler = async (ctx) => {
  const { request, url, path, method, can } = ctx;

  if (path !== "/pengumuman" && !path.startsWith("/pengumuman/")) return null;

  const code = decodeURIComponent(path.slice("/pengumuman/".length));
  const action =
    method === "POST"
      ? "CREATE"
      : method === "PUT"
        ? "UPDATE"
        : method === "DELETE"
          ? "DELETE"
          : "VIEW";

  if (!can(MENU.PENGUMUMAN, action)) return denied();

  if (path === "/pengumuman" && method === "GET") {
    return process.env.MOCK_500 ? serverError() : listAnnouncements(url);
  }

  if (
    (method === "POST" || method === "PUT") &&
    process.env.MOCK_PENGUMUMAN_SAVE_ERROR === "500"
  ) {
    return serverError();
  }

  if (path === "/pengumuman" && method === "POST") {
    const form = await readMultipart(request);
    if (form instanceof Response) return form;

    const issues = validate(form);

    return issues.length ? failed(issues) : save(form, null);
  }

  const row = ANNOUNCEMENT.filter(isLive).find((item) =>
    method === "GET"
      ? item.code === code
      : item.code.toLowerCase() === code.toLowerCase(),
  );

  if (method === "GET") {
    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Pengumuman",
          data: announcementView(row),
        })
      : notFound();
  }

  if (method === "PUT") {
    const form = await readMultipart(request);
    if (form instanceof Response) return form;

    const issues = validate(form);
    if (issues.length) return failed(issues);

    return row ? save(form, row) : notFound();
  }

  if (method === "DELETE") {
    if (!row) return notFound();

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Pengumuman",
      data: announcementView(row),
    });
  }

  return null;
};
