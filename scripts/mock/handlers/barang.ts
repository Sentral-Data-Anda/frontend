/**
 * Tiruan `/api/v1/asset` (be-sada `modules/asset`, bentuk sesudah gap B2–B8,
 * B22–B25) dari larik `ASSET` di inventaris-store.
 *
 *   MOCK_EMPTY=1                 → daftar barang kosong (404)
 *   MOCK_500=1                   → daftar barang menjawab 500
 *   MOCK_ASSET_SAVE_ERROR=500    → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { bapelOf } from "../fasilitas-store";
import {
  ASSET,
  TODAY,
  assetCodeOf,
  assetStatusOf,
  assetView,
  hasPostedDepreciation,
  isLive,
  liveDisposalOf,
  nextId,
  roomRowOf,
  typeItemOf,
  type AcquisitionSource,
  type AssetCondition,
  type AssetPhoto,
  type AssetRow,
} from "../inventaris-store";
import { denied, json, list, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart } from "../media";

type Issue = { path: string; message: string };

type Kept = { publicId: string; showOnWebsite: boolean };

const MAX_DETAIL = 4;

const CONDITIONS: AssetCondition[] = [
  "BAIK",
  "RUSAK_RINGAN",
  "RUSAK_BERAT",
  "HILANG",
];

const SOURCES: AcquisitionSource[] = ["PURCHASE", "DONATION", "GRANT"];

const STATUS_PARAM: Record<string, string> = {
  aktif: "AKTIF",
  menunggu: "MENUNGGU_PELEPASAN",
  dilepas: "DILEPAS",
};

const DEPRECIATION_FIELDS = [
  "usefulLifeMonths",
  "salvageValue",
  "depreciationStartDate",
  "openingAccumulatedDepreciation",
  "openingAccumulatedAsOf",
] as const;

const NOT_FOUND = "Barang Tidak Ditemukan";

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const fail = (status: number, issues: Issue[]) =>
  json({ status, error: issues[0].message, issues }, status);

const formError = (error: string) => json({ status: 400, error }, 400);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const normalize = (text: string) => text.trim().replace(/\s+/g, " ");

const monthKey = (iso: string) => iso.slice(0, 7);

const findRow = (code: string) =>
  ASSET.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const detailView = (row: AssetRow) => {
  const view = assetView(row, true);
  const found = liveDisposalOf(row.id);

  return {
    ...view,
    disposal:
      view.disposal && found
        ? {
            ...view.disposal,
            approval: found.approval
              ? {
                  publicId: found.approval.publicId,
                  code: found.approval.code,
                  status: found.status,
                }
              : null,
          }
        : null,
    depreciation: view.depreciation
      ? {
          ...view.depreciation,
          openingAccumulated: view.depreciation.openingAccumulated ?? "0.00",
        }
      : null,
  };
};

const savedView = (row: AssetRow) => {
  const { depreciation: _depreciation, ...view } = assetView(row, true);

  return view;
};

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

const text = (form: FormData, key: string) => {
  const value = form.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const numberOf = (raw: string) => (raw === "" ? null : Number(raw));

const isDate = (raw: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw));

const parse = (form: FormData, isUpdate: boolean) => {
  const issues: Issue[] = [];
  const onIssue = (path: string, message: string) =>
    issues.push({ path, message });

  const name = normalize(text(form, "name"));
  const description = text(form, "description");
  const serialNumber = text(form, "serialNumber") || null;
  const rawCondition = text(form, "condition") || "BAIK";
  const rawSource = text(form, "acquisitionSource") || "PURCHASE";
  const donorName = normalize(text(form, "donorName")) || null;
  const warrantyUntil = text(form, "warrantyUntil") || null;
  const acquisitionDate = text(form, "acquisitionDate") || null;
  const acquisitionCost = numberOf(text(form, "acquisitionCost"));
  const isDepreciable = text(form, "isDepreciable") === "1";
  const usefulLifeMonths = numberOf(text(form, "usefulLifeMonths"));
  const salvageValue = numberOf(text(form, "salvageValue"));
  const depreciationStartDate = text(form, "depreciationStartDate") || null;
  const opening = numberOf(text(form, "openingAccumulatedDepreciation"));
  const rawAsOf = text(form, "openingAccumulatedAsOf");
  const asOf = rawAsOf ? `${monthKey(rawAsOf)}-01` : null;
  const typeId = Number(text(form, "typeId")) || null;
  const bapelId = Number(text(form, "bapelId")) || null;
  const roomId = Number(text(form, "roomId")) || null;
  const rawKeep = isUpdate ? form.get("keepFiles") : null;
  const kept = typeof rawKeep === "string" ? readKept(rawKeep) : null;

  if (!name) onIssue("name", "Mohon Lengkapi Nama Barang");
  else if (name.length < 4) {
    onIssue("name", "Nama Barang harus memiliki setidaknya 4 karakter");
  } else if (name.length > 150) {
    onIssue("name", "Nama Barang tidak boleh lebih dari 150 karakter");
  }
  if (!description) {
    onIssue("description", "Mohon Lengkapi Keterangan Barang");
  } else if (description.length > 250) {
    onIssue(
      "description",
      "Keterangan Barang tidak boleh lebih dari 250 karakter",
    );
  }
  if (serialNumber && serialNumber.length > 100) {
    onIssue("serialNumber", "Nomor Seri tidak boleh lebih dari 100 karakter");
  }
  if (!CONDITIONS.includes(rawCondition as AssetCondition)) {
    onIssue("condition", "Kondisi Barang Tidak Valid");
  }
  if (!SOURCES.includes(rawSource as AcquisitionSource)) {
    onIssue("acquisitionSource", "Sumber Perolehan Tidak Valid");
  }
  if (donorName && donorName.length > 150) {
    onIssue("donorName", "Nama Pemberi tidak boleh lebih dari 150 karakter");
  } else if (donorName && rawSource === "PURCHASE") {
    onIssue("donorName", "Nama Pemberi Hanya Untuk Donasi Atau Hibah");
  }
  if (acquisitionCost !== null && acquisitionCost < 0) {
    onIssue("acquisitionCost", "Harga Perolehan tidak boleh negatif");
  }
  if (warrantyUntil && !isDate(warrantyUntil)) {
    onIssue("warrantyUntil", "Garansi Sampai harus berupa tanggal yang valid");
  }

  if (isDepreciable) {
    if (acquisitionCost === null) {
      onIssue(
        "acquisitionCost",
        "Harga Perolehan wajib diisi untuk barang yang disusutkan",
      );
    }
    if (usefulLifeMonths === null) {
      onIssue(
        "usefulLifeMonths",
        "Masa Manfaat wajib diisi untuk barang yang disusutkan",
      );
    } else if (usefulLifeMonths < 1) {
      onIssue("usefulLifeMonths", "Masa Manfaat minimal 1 bulan");
    }
    if (!depreciationStartDate) {
      onIssue(
        "depreciationStartDate",
        "Tanggal Mulai Penyusutan wajib diisi untuk barang yang disusutkan",
      );
    }
    if (salvageValue !== null && salvageValue < 0) {
      onIssue("salvageValue", "Nilai Residu tidak boleh negatif");
    } else if (
      salvageValue !== null &&
      acquisitionCost !== null &&
      salvageValue > acquisitionCost
    ) {
      onIssue(
        "salvageValue",
        "Nilai Residu tidak boleh melebihi Harga Perolehan",
      );
    }
    if (opening !== null && asOf === null) {
      onIssue(
        "openingAccumulatedAsOf",
        "Bulan Akumulasi Penyusutan Awal wajib diisi bersama Akumulasi Penyusutan Awal",
      );
    } else if (opening === null && asOf !== null) {
      onIssue(
        "openingAccumulatedDepreciation",
        "Akumulasi Penyusutan Awal wajib diisi bersama Bulannya",
      );
    }
    if (opening !== null && opening < 0) {
      onIssue(
        "openingAccumulatedDepreciation",
        "Akumulasi Penyusutan Awal tidak boleh negatif",
      );
    } else if (
      opening !== null &&
      acquisitionCost !== null &&
      opening > acquisitionCost - (salvageValue ?? 0)
    ) {
      onIssue(
        "openingAccumulatedDepreciation",
        "Akumulasi Penyusutan Awal tidak boleh melebihi Harga Perolehan dikurangi Nilai Residu",
      );
    }
    if (asOf && depreciationStartDate) {
      if (monthKey(asOf) < monthKey(depreciationStartDate)) {
        onIssue(
          "openingAccumulatedAsOf",
          "Bulan Akumulasi Penyusutan Awal tidak boleh sebelum Bulan Mulai Penyusutan",
        );
      } else if (monthKey(asOf) >= monthKey(TODAY)) {
        onIssue(
          "openingAccumulatedAsOf",
          "Bulan Akumulasi Penyusutan Awal harus sebelum bulan berjalan",
        );
      }
    }
  } else {
    for (const field of DEPRECIATION_FIELDS) {
      if (text(form, field)) {
        onIssue(
          field,
          "Field penyusutan hanya boleh diisi untuk barang yang disusutkan",
        );
      }
    }
  }

  if (!typeId) onIssue("typeId", "Mohon Lengkapi Tipe Barang");
  if (!bapelId) onIssue("bapelId", "Mohon Lengkapi Badan Pelayanan");
  if (!roomId) onIssue("roomId", "Mohon Lengkapi Ruang");
  if (typeof rawKeep === "string" && kept === null) {
    onIssue("keepFiles", "Format Foto Yang Dipertahankan Tidak Valid");
  } else if (kept && kept.length > MAX_DETAIL) {
    onIssue("detailImage", "Foto Detail Barang Maksimal 4");
  }

  if (issues.length) return { failure: fail(400, issues) };

  return {
    value: {
      fields: {
        name,
        description,
        serialNumber,
        condition: rawCondition as AssetCondition,
        acquisitionSource: rawSource as AcquisitionSource,
        donorName,
        warrantyUntil,
        acquisitionDate,
        acquisitionCost,
        isDepreciable,
        usefulLifeMonths: isDepreciable ? usefulLifeMonths : null,
        salvageValue: isDepreciable ? salvageValue : null,
        depreciationStartDate: isDepreciable ? depreciationStartDate : null,
        openingAccumulatedDepreciation: isDepreciable ? opening : null,
        openingAccumulatedAsOf: isDepreciable ? asOf : null,
        typeId: typeId as number,
        bapelId: bapelId as number,
        roomId: roomId as number,
      },
      kept,
      mainFile: filesOf(form, "mainImage")[0] ?? null,
      files: filesOf(form, "image"),
    },
  };
};

type Fields = NonNullable<ReturnType<typeof parse>["value"]>["fields"];

const relationFailure = (fields: Fields, previousRoomId: number | null) => {
  const issues: Issue[] = [];

  if (!typeItemOf(fields.typeId)) {
    issues.push({ path: "typeId", message: "Tipe Barang Tidak Ditemukan" });
  }
  if (!bapelOf(fields.bapelId)) {
    issues.push({
      path: "bapelId",
      message: "Badan Pelayanan Tidak Ditemukan",
    });
  }

  const room = roomRowOf(fields.roomId);
  if (!room || room.deletedAt) {
    issues.push({ path: "roomId", message: "Ruang Tidak Ditemukan" });
  }
  if (issues.length) return fail(404, issues);

  if (!room?.isActive && fields.roomId !== previousRoomId) {
    return fail(400, [{ path: "roomId", message: "Ruang Tidak Aktif" }]);
  }

  return null;
};

const LOCKED = [
  ["acquisitionCost", "Harga Perolehan"],
  ["depreciationStartDate", "Tanggal Mulai Penyusutan"],
  ["isDepreciable", "Pilihan Disusutkan"],
  ["openingAccumulatedDepreciation", "Akumulasi Penyusutan Awal"],
  ["openingAccumulatedAsOf", "Bulan Akumulasi Penyusutan Awal"],
] as const;

const sameValue = (a: unknown, b: unknown) =>
  typeof a === "string" && typeof b === "string"
    ? a.slice(0, 10) === b.slice(0, 10)
    : a === b;

const lockFailure = (row: AssetRow, fields: Fields) => {
  const issues: Issue[] = [];

  if (fields.roomId !== row.roomId) {
    issues.push({
      path: "roomId",
      message: "Pindahkan Barang Lewat Siklus Aset",
    });
  }
  if (fields.bapelId !== row.bapelId) {
    issues.push({
      path: "bapelId",
      message: "Pindahkan Barang Lewat Siklus Aset",
    });
  }
  if (hasPostedDepreciation(row.id)) {
    for (const [field, label] of LOCKED) {
      if (!sameValue(fields[field], row[field])) {
        issues.push({
          path: field,
          message: `${label} Tidak Dapat Diubah Karena Sudah Disusutkan`,
        });
      }
    }
  }

  return issues.length ? fail(400, issues) : null;
};

const serialTaken = (serial: string | null, exceptId?: number) => {
  if (!serial) return null;

  const owner = ASSET.find(
    (row) =>
      isLive(row) &&
      row.id !== exceptId &&
      row.serialNumber?.toLowerCase() === serial.toLowerCase(),
  );

  return owner
    ? fail(409, [
        {
          path: "serialNumber",
          message: `Nomor Seri Sudah Dipakai ${owner.code}`,
        },
      ])
    : null;
};

const statusFailure = (row: AssetRow) => {
  const status = assetStatusOf(row.id);

  return status === "DILEPAS"
    ? formError("Barang Sudah Dilepas Dan Tidak Dapat Diubah")
    : status === "MENUNGGU_PELEPASAN"
      ? formError("Barang Sedang Menunggu Persetujuan Pelepasan")
      : null;
};

const storePhoto = async (file: File): Promise<AssetPhoto> => ({
  ...(await putMedia(file, "asset")),
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

const matches = (filter: string, ...values: (string | null)[]) =>
  !filter ||
  values.some((value) => value?.toLowerCase().includes(filter.toLowerCase()));

const listRows = (params: URLSearchParams) => {
  const filter = params.get("filter") ?? "";
  const numeric = (key: string) => Number(params.get(key)) || null;
  const typeId = numeric("typeId");
  const bapelId = numeric("bapelId");
  const roomId = numeric("roomId");
  const condition = params.get("condition") ?? "";
  const status = STATUS_PARAM[params.get("status") ?? ""] ?? "";
  const source = params.get("acquisitionSource") ?? "";
  const isDepreciableOnly = params.get("isDepreciable") === "1";

  return ASSET.filter(
    (row) =>
      isLive(row) &&
      matches(filter, row.code, row.name, row.serialNumber) &&
      (!typeId || row.typeId === typeId) &&
      (!bapelId || row.bapelId === bapelId) &&
      (!roomId || row.roomId === roomId) &&
      (!condition || row.condition === condition) &&
      (!status || assetStatusOf(row.id) === status) &&
      (!source || row.acquisitionSource === source) &&
      (!isDepreciableOnly || row.isDepreciable),
  )
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .map((row) => assetView(row));
};

export const barangMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/asset" && !path.startsWith("/asset/")) return null;

  const [, , code, sub] = path.split("/");
  if (sub !== undefined) return null;

  if (!can(MENU.BARANG, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_ASSET_SAVE_ERROR === "500") {
    return serverError();
  }

  if (!code && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    return list(listRows(url.searchParams), url, "Barang", "Barang");
  }

  if (!code && method === "POST") {
    const form = await readMultipart(request);
    if (form instanceof Response) return form;

    const parsed = parse(form, false);
    if (parsed.failure) return parsed.failure;

    const { fields, mainFile, files } = parsed.value;
    const failure =
      relationFailure(fields, null) ?? serialTaken(fields.serialNumber);
    if (failure) return failure;

    const id = nextId(ASSET);
    const row: AssetRow = {
      id,
      publicId: crypto.randomUUID(),
      code: assetCodeOf(fields.typeId, fields.bapelId),
      deletedAt: null,
      ...fields,
      mainImage: mainFile ? await storePhoto(mainFile) : null,
      detailImage: await Promise.all(files.map(storePhoto)),
    };

    ASSET.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Barang", data: savedView(row) },
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

    const { fields, kept, mainFile, files } = parsed.value;
    const isSerialChanged =
      (fields.serialNumber ?? "").toLowerCase() !==
      (row.serialNumber ?? "").toLowerCase();
    const failure =
      statusFailure(row) ??
      relationFailure(fields, row.roomId) ??
      lockFailure(row, fields) ??
      (isSerialChanged ? serialTaken(fields.serialNumber, row.id) : null);
    if (failure) return failure;

    const keptIds = kept?.map((item) => item.publicId) ?? [];
    if (
      keptIds.some(
        (id) => !row.detailImage.some((photo) => photo.publicId === id),
      )
    ) {
      return fail(400, [
        { path: "detailImage", message: "Foto Tidak Ditemukan" },
      ]);
    }

    const base = kept
      ? row.detailImage.filter((photo) => keptIds.includes(photo.publicId))
      : files.length
        ? []
        : row.detailImage;
    if (base.length + files.length > MAX_DETAIL) {
      return fail(400, [
        { path: "detailImage", message: "Foto Detail Barang Maksimal 4" },
      ]);
    }

    Object.assign(row, fields);
    if (mainFile) row.mainImage = await storePhoto(mainFile);
    row.detailImage = [...base, ...(await Promise.all(files.map(storePhoto)))];

    return json({
      status: 200,
      message: "Berhasil Memperbarui Barang",
      data: savedView(row),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Barang",
      data: detailView(row),
    });
  }

  if (method === "DELETE") {
    const failure =
      statusFailure(row) ??
      (hasPostedDepreciation(row.id)
        ? formError("Barang Sudah Disusutkan. Gunakan Pelepasan Di Siklus Aset")
        : null);
    if (failure) return failure;

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Barang",
      data: { code: row.code },
    });
  }

  return null;
};
