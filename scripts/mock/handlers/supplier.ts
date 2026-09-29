/**
 * Tiruan `/api/v1/supplier` (be-sada `modules/supplier`, bentuk sesudah gap B12, B18) di atas larik
 * SUPPLIER store Inventaris; pemakaian dibaca lewat `supplierInUse` store Pengadaan.
 *
 *   MOCK_EMPTY=1                   → daftar kosong (404)
 *   MOCK_500=1                     → daftar menjawab 500
 *   MOCK_SUPPLIER_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 */
import { z } from "zod";

import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import { nextId, type SupplierRow } from "../inventaris-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import { SUPPLIER, isLive, supplierInUse } from "../pengadaan-store";

const NOT_FOUND = "Supplier Tidak Ditemukan";
const TAKEN = "Supplier Sudah Tersedia";
const IN_USE =
  "Supplier Tidak Dapat Dihapus Karena Terhubung dengan Data Pengadaan. Nonaktifkan Saja";

const optionalText = (label: string, max: number) =>
  z.preprocess(
    (value) =>
      value === undefined || value === null || value === "" ? null : value,
    z
      .string()
      .nullable()
      .refine((value) => value === null || value.trim().length <= max, {
        error: `${label} tidak boleh lebih dari ${max} karakter`,
      }),
  );

const schema = z.object({
  name: z
    .string({ error: "Mohon Lengkapi Nama Supplier" })
    .transform(collapseSpaces)
    .pipe(
      z.string().min(1, { error: "Mohon Lengkapi Nama Supplier" }).max(150, {
        error: "Nama Supplier tidak boleh lebih dari 150 karakter",
      }),
    ),
  contactPerson: optionalText("Nama Kontak", 100),
  phone: z
    .string({ error: "Mohon Lengkapi No Telepon" })
    .min(1, { error: "Mohon Lengkapi No Telepon" })
    .max(15, { error: "No Telepon tidak boleh lebih dari 15 angka" })
    .regex(/^\d+$/, { error: "No Telepon hanya boleh berisi angka" }),
  email: optionalText("Email", 150).refine(
    (value) => value === null || /^[^@\s]+@[^@\s]+$/.test(value),
    { error: "Format Email tidak valid" },
  ),
  address: optionalText("Alamat", 250),
  npwp: optionalText("NPWP", 25),
  bankName: optionalText("Nama Bank", 50),
  bankAccountNumber: optionalText("No Rekening", 30),
  bankAccountName: optionalText("Nama Pemilik Rekening", 100),
  isActive: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return true;
      if (value === "true") return true;
      if (value === "false") return false;

      return value;
    },
    z.boolean({ error: "Status Aktif harus bernilai true atau false" }),
  ),
});

type Input = z.infer<typeof schema>;

const view = (row: SupplierRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  contactPerson: row.contactPerson,
  phone: row.phone,
  email: row.email,
  address: row.address,
  npwp: row.npwp,
  bankName: row.bankName,
  bankAccountNumber: row.bankAccountNumber,
  bankAccountName: row.bankAccountName,
  isActive: row.isActive,
});

const byName = (a: SupplierRow, b: SupplierRow) =>
  a.name.localeCompare(b.name, "id");

const findRow = (code: string) =>
  SUPPLIER.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const taken = () =>
  json(
    { status: 409, error: TAKEN, issues: [{ path: "name", message: TAKEN }] },
    409,
  );

const isNameTaken = (name: string) =>
  SUPPLIER.some(
    (row) => isLive(row) && row.name.toLowerCase() === name.toLowerCase(),
  );

const parse = async (request: Request) => {
  const parsed = schema.safeParse(await readBody<unknown>(request));

  if (parsed.success) return { data: parsed.data, failure: null };

  const issues = parsed.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return {
    data: null,
    failure: json({ status: 400, error: issues[0].message, issues }, 400),
  };
};

const fieldsOf = (data: Input) => ({
  name: data.name,
  contactPerson: data.contactPerson?.trim() || null,
  phone: data.phone,
  email: data.email?.trim() || null,
  address: data.address?.trim() || null,
  npwp: data.npwp?.trim() || null,
  bankName: data.bankName?.trim() || null,
  bankAccountNumber: data.bankAccountNumber?.trim() || null,
  bankAccountName: data.bankAccountName?.trim() || null,
  isActive: data.isActive,
});

const matchesActive = (row: SupplierRow, isActive: string | null) =>
  isActive === "true"
    ? row.isActive
    : isActive === "false"
      ? !row.isActive
      : true;

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const supplierMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/supplier" && !path.startsWith("/supplier/")) return null;

  const code = path.match(/^\/supplier\/([^/]+)$/)?.[1];

  if (path !== "/supplier" && !code) return null;
  if (!can(MENU.SUPPLIER, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_SUPPLIER_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/supplier" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const isActive = url.searchParams.get("isActive");

    return list(
      SUPPLIER.filter(
        (row) =>
          isLive(row) &&
          matchesActive(row, isActive) &&
          [row.name, row.contactPerson, row.code, row.phone].some((value) =>
            value?.toLowerCase().includes(filter),
          ),
      )
        .sort(byName)
        .map(view),
      url,
      "Supplier",
      "Supplier",
    );
  }

  if (path === "/supplier" && method === "POST") {
    const parsed = await parse(request);
    if (parsed.failure) return parsed.failure;
    if (isNameTaken(parsed.data.name)) return taken();

    const id = nextId(SUPPLIER);
    const row: SupplierRow = {
      id,
      publicId: crypto.randomUUID(),
      code: `SUP-${String(id).padStart(4, "0")}`,
      ...fieldsOf(parsed.data),
      deletedAt: null,
    };
    SUPPLIER.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Supplier", data: view(row) },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = await parse(request);
    if (parsed.failure) return parsed.failure;

    const row = findRow(code);
    if (!row) return notFound();

    const isRenamed = parsed.data.name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(parsed.data.name)) return taken();

    Object.assign(row, fieldsOf(parsed.data));

    return json({
      status: 200,
      message: "Berhasil Memperbarui Supplier",
      data: view(row),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Supplier",
      data: view(row),
    });
  }

  if (method === "DELETE") {
    if (supplierInUse(row.id)) return json({ status: 400, error: IN_USE }, 400);

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Supplier",
      data: view(row),
    });
  }

  return null;
};
