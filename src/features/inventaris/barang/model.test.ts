import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { applyServerError } from "@/lib/form-error";
import type { AttachmentValue } from "@/types/attachment";

import {
  EMPTY_ASSET_FORM,
  assetFormSchema,
  assetStatusOf,
  cycleListHref,
  isWarrantyOver,
  serverFieldError,
  toAssetForm,
  toAssetFormData,
  toFormError,
  usefulLifeOf,
  type AssetFormValues,
} from "./model";
import type { AssetDetail } from "./types";

const VALID: AssetFormValues = {
  ...EMPTY_ASSET_FORM,
  name: "Proyektor Epson",
  typeId: "1",
  description: "Proyektor utama.",
  roomId: "1",
  bapelId: "1",
};

const DEPRECIABLE: AssetFormValues = {
  ...VALID,
  acquisitionCost: "8500000",
  isDepreciable: "1",
  usefulLifeMonths: "48",
  salvageValue: "500000",
  depreciationStartDate: "2025-07-01",
};

const messagesOf = (values: AssetFormValues) => {
  const result = assetFormSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

const photo = (key: string, file: File | null = null): AttachmentValue => ({
  key,
  name: key,
  mimeType: "image/jpeg",
  url: `http://media.test/${key}`,
  showOnWebsite: false,
  file,
});

const DETAIL: AssetDetail = {
  id: 1,
  publicId: "a1",
  code: "AST_0004_0001-0001",
  name: "Toyota Innova",
  description: "Kendaraan pelayanan.",
  serialNumber: "BK 1234 AB",
  condition: "BAIK",
  acquisitionSource: "GRANT",
  donorName: "Sinode",
  acquisitionDate: "2018-01-01T00:00:00.000Z",
  acquisitionCost: "250000000.00",
  warrantyUntil: null,
  isDepreciable: true,
  salvageValue: "50000000.00",
  usefulLifeMonths: 96,
  depreciationStartDate: "2018-01-01T00:00:00.000Z",
  openingAccumulatedDepreciation: "195833333.34",
  openingAccumulatedAsOf: "2026-05-01T00:00:00.000Z",
  type: { id: 4, code: "TYP_ITM-0004", name: "Kendaraan" },
  bapel: { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  room: { id: 1, code: "RM-0001", name: "Gedung Gereja" },
  mainImage: null,
  detailImage: [],
  status: "AKTIF",
  disposal: null,
  depreciation: {
    openingAccumulated: "195833333.34",
    accumulated: "200000000.00",
    bookValue: "50000000.00",
    lastPeriod: { year: 2026, month: 8 },
  },
};

describe("assetStatusOf", () => {
  test("pelepasan mengalahkan kondisi; Aktif = kondisi", () => {
    expect(assetStatusOf({ status: "DILEPAS", condition: "BAIK" })).toBe(
      "DILEPAS",
    );
    expect(
      assetStatusOf({ status: "MENUNGGU_PELEPASAN", condition: "HILANG" }),
    ).toBe("MENUNGGU_PELEPASAN");
    expect(assetStatusOf({ status: "AKTIF", condition: "RUSAK_BERAT" })).toBe(
      "RUSAK_BERAT",
    );
  });
});

describe("skema", () => {
  test("wajib: nama ≥ 4, tipe, keterangan, ruang, badan pelayanan; foto opsional", () => {
    expect(messagesOf(EMPTY_ASSET_FORM)).toEqual({
      name: "Isi nama barang, minimal 4 karakter",
      typeId: "Pilih tipe barang",
      description: "Isi keterangan barang",
      roomId: "Pilih ruang",
      bapelId: "Pilih badan pelayanan",
    });
    expect(messagesOf(VALID)).toEqual({});
    expect(messagesOf({ ...VALID, name: "  a   b  " }).name).toBe(
      "Isi nama barang, minimal 4 karakter",
    );
    expect(messagesOf({ ...VALID, description: "   " }).description).toBe(
      "Isi keterangan barang",
    );
  });

  test("harga hanya angka (tidak negatif)", () => {
    expect(
      messagesOf({ ...VALID, acquisitionCost: "-5" }).acquisitionCost,
    ).toBe("Isi angka tanpa titik atau koma.");
  });

  test("disusutkan: harga, masa manfaat ≥ 1, bulan mulai wajib", () => {
    expect(messagesOf({ ...VALID, isDepreciable: "1" })).toEqual({
      acquisitionCost: "Isi harga perolehan untuk barang yang disusutkan",
      usefulLifeMonths: "Isi masa manfaat, minimal 1 bulan",
      depreciationStartDate: "Isi bulan mulai disusutkan",
    });
    expect(messagesOf({ ...DEPRECIABLE, usefulLifeMonths: "0" })).toEqual({
      usefulLifeMonths: "Isi masa manfaat, minimal 1 bulan",
    });
    expect(messagesOf(DEPRECIABLE)).toEqual({});
  });

  test("tidak disusutkan: field penyusutan tidak diperiksa", () => {
    expect(
      messagesOf({ ...DEPRECIABLE, isDepreciable: "0", salvageValue: "9e9" }),
    ).toEqual({ salvageValue: "Isi angka tanpa titik atau koma." });
    expect(
      messagesOf({ ...DEPRECIABLE, isDepreciable: "0", usefulLifeMonths: "" }),
    ).toEqual({});
  });

  test("residu ≤ harga", () => {
    expect(messagesOf({ ...DEPRECIABLE, salvageValue: "9000000" })).toEqual({
      salvageValue: "Nilai residu tidak boleh melebihi harga perolehan",
    });
  });

  test("akumulasi awal: berpasangan, ≤ harga − residu, bulan ≥ bulan mulai", () => {
    expect(
      messagesOf({ ...DEPRECIABLE, openingAccumulatedDepreciation: "100" }),
    ).toEqual({
      openingAccumulatedAsOf: "Isi akumulasi awal dan bulannya sekaligus",
    });
    expect(
      messagesOf({ ...DEPRECIABLE, openingAccumulatedAsOf: "2026-05-01" }),
    ).toEqual({
      openingAccumulatedDepreciation:
        "Isi akumulasi awal dan bulannya sekaligus",
    });
    expect(
      messagesOf({
        ...DEPRECIABLE,
        openingAccumulatedDepreciation: "8000001",
        openingAccumulatedAsOf: "2026-05-01",
      }),
    ).toEqual({
      openingAccumulatedDepreciation:
        "Akumulasi awal tidak boleh melebihi harga perolehan dikurangi nilai residu",
    });
    expect(
      messagesOf({
        ...DEPRECIABLE,
        openingAccumulatedDepreciation: "100",
        openingAccumulatedAsOf: "2025-06-01",
      }),
    ).toEqual({
      openingAccumulatedAsOf:
        "Bulan akumulasi awal tidak boleh sebelum bulan mulai disusutkan",
    });
    expect(
      messagesOf({
        ...DEPRECIABLE,
        openingAccumulatedDepreciation: "8000000",
        openingAccumulatedAsOf: "2025-07-01",
      }),
    ).toEqual({});
  });
});

describe("payload", () => {
  test("tambah tanpa disusutkan: field penyusutan dan nama pemberi tidak dikirim", () => {
    const body = toAssetFormData(
      {
        ...DEPRECIABLE,
        isDepreciable: "0",
        donorName: "Keluarga X",
        warrantyUntil: "2027-04-17",
        serialNumber: "  SN-1 ",
        openingAccumulatedDepreciation: "100",
        openingAccumulatedAsOf: "2026-05-01",
      },
      false,
    );

    expect(body.get("isDepreciable")).toBe("0");
    expect(
      toAssetFormData({ ...VALID, name: "  proyektor   EB-x51 " }, false).get(
        "name",
      ),
    ).toBe("proyektor EB-x51");
    expect(body.get("acquisitionCost")).toBe("8500000");
    expect(body.get("warrantyUntil")).toBe("2027-04-17");
    expect(body.get("serialNumber")).toBe("SN-1");
    expect(body.get("acquisitionSource")).toBe("PURCHASE");
    for (const field of [
      "donorName",
      "usefulLifeMonths",
      "salvageValue",
      "depreciationStartDate",
      "openingAccumulatedDepreciation",
      "openingAccumulatedAsOf",
      "keepFiles",
      "mainImage",
      "image",
    ]) {
      expect(body.has(field)).toBe(false);
    }
  });

  test("disusutkan + donasi: semua field dikirim, isDepreciable 1", () => {
    const body = toAssetFormData(
      {
        ...DEPRECIABLE,
        acquisitionSource: "DONATION",
        donorName: " Keluarga X ",
        openingAccumulatedDepreciation: "100",
        openingAccumulatedAsOf: "2026-05-01",
      },
      false,
    );

    expect(body.get("isDepreciable")).toBe("1");
    expect(body.get("donorName")).toBe("Keluarga X");
    expect(body.get("usefulLifeMonths")).toBe("48");
    expect(body.get("salvageValue")).toBe("500000");
    expect(body.get("depreciationStartDate")).toBe("2025-07-01");
    expect(body.get("openingAccumulatedDepreciation")).toBe("100");
    expect(body.get("openingAccumulatedAsOf")).toBe("2026-05-01");
  });

  test("ubah: keepFiles, foto baru berurutan, lokasi lama tetap, desimal terjaga", () => {
    const values = {
      ...toAssetForm(DETAIL),
      mainImage: [photo("main-new", new File(["m"], "utama.jpg"))],
      detailImage: [
        photo("d1"),
        photo("n1", new File(["a"], "a.jpg")),
        photo("d3"),
        photo("n2", new File(["b"], "b.jpg")),
      ],
    };
    const body = toAssetFormData(values, true);

    expect(JSON.parse(String(body.get("keepFiles")))).toEqual([
      { publicId: "d1", showOnWebsite: false },
      { publicId: "d3", showOnWebsite: false },
    ]);
    expect((body.get("mainImage") as File).name).toBe("utama.jpg");
    expect(body.getAll("image").map((file) => (file as File).name)).toEqual([
      "a.jpg",
      "b.jpg",
    ]);
    expect(body.get("roomId")).toBe("1");
    expect(body.get("bapelId")).toBe("1");
    expect(body.get("openingAccumulatedDepreciation")).toBe("195833333.34");
    expect(body.get("acquisitionCost")).toBe("250000000");
    expect(body.get("donorName")).toBe("Sinode");
  });

  test("ubah tanpa foto detail tersisa: keepFiles kosong tetap dikirim", () => {
    const body = toAssetFormData(VALID, true);

    expect(body.get("keepFiles")).toBe("[]");
  });
});

describe("galat server", () => {
  const collect = (error: unknown) => {
    const errors: Record<string, string> = {};
    const field = applyServerError(
      toFormError(error),
      (name, value) => {
        errors[name] = value.message ?? "";
      },
      serverFieldError,
    );

    return { field, errors };
  };

  test("relasi, ruang nonaktif, nomor seri → field", () => {
    expect(
      collect(
        new FetchError(404, "Tipe Barang Tidak Ditemukan", [
          { path: "typeId", message: "Tipe Barang Tidak Ditemukan" },
        ]),
      ),
    ).toEqual({
      field: "typeId",
      errors: { typeId: "Tipe Barang Tidak Ditemukan" },
    });
    expect(
      collect(
        new FetchError(400, "Ruang Tidak Aktif", [
          { path: "roomId", message: "Ruang Tidak Aktif" },
        ]),
      ).errors,
    ).toEqual({ roomId: "Ruang Tidak Aktif" });
    expect(
      collect(
        new FetchError(409, "Nomor Seri Sudah Dipakai AST_1", [
          { path: "serialNumber", message: "Nomor Seri Sudah Dipakai AST_1" },
        ]),
      ).field,
    ).toBe("serialNumber");
  });

  test("sudah dilepas / menunggu / lewat Siklus Aset / terkunci → tingkat form", () => {
    expect(
      collect(
        new FetchError(400, "Barang Sudah Dilepas Dan Tidak Dapat Diubah", []),
      ),
    ).toEqual({
      field: "root",
      errors: { root: "Barang Sudah Dilepas Dan Tidak Dapat Diubah" },
    });
    expect(
      collect(
        new FetchError(400, "Pindahkan Barang Lewat Siklus Aset", [
          { path: "roomId", message: "Pindahkan Barang Lewat Siklus Aset" },
          {
            path: "acquisitionCost",
            message:
              "Harga Perolehan Tidak Dapat Diubah Karena Sudah Disusutkan",
          },
        ]),
      ).field,
    ).toBe("root");
  });

  test("foto: keepFiles → detailImage; multer → tingkat form", () => {
    expect(
      collect(
        new FetchError(400, "Foto Tidak Ditemukan", [
          { path: "keepFiles", message: "Foto Tidak Ditemukan" },
        ]),
      ).errors,
    ).toEqual({ detailImage: "Foto Tidak Ditemukan" });
    expect(
      collect(new FetchError(415, "Unsupported file type", [])).errors,
    ).toEqual({ root: "Pilih foto JPG atau PNG." });
  });
});

test("isi form dari detail: bulan akumulasi awal YYYY-MM-01", () => {
  const values = toAssetForm(DETAIL);

  expect(values.openingAccumulatedAsOf).toBe("2026-05-01");
  expect(values.isDepreciable).toBe("1");
  expect(values.acquisitionSource).toBe("GRANT");
  expect(values.typeId).toBe("4");
});

test("tampilan kecil", () => {
  expect(usefulLifeOf(48)).toBe("48 bulan (4 tahun)");
  expect(usefulLifeOf(30)).toBe("30 bulan");
  expect(isWarrantyOver("2026-01-01T00:00:00.000Z", "2026-09-29")).toBe(true);
  expect(isWarrantyOver("2026-09-29T00:00:00.000Z", "2026-09-29")).toBe(false);
  expect(cycleListHref("mutasi", "AST_1-2")).toBe(
    "/inventaris/siklus-aset?jenis=pindah&search=AST_1-2",
  );
});
