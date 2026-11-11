import { describe, expect, test } from "bun:test";

import { PRISMA_MODELS } from "../../../../scripts/mock/handlers/activity-log";

import {
  ACTION_LABEL,
  actionKindFromServer,
  actionKindOf,
  exportQueryOf,
  filterSchemaOf,
  formatChangeValue,
  formatLogTime,
  isBeforeOnly,
  isOneSided,
  listChanges,
  listLogFilters,
  MODEL_LABEL,
  modelLabel,
  recordLinkOf,
  requestLogHref,
  toLogApiFilters,
} from "./model";

const labelOf = (log: Parameters<typeof actionKindOf>[0]) =>
  ACTION_LABEL[actionKindOf(log)];

describe("label aksi", () => {
  test("create → Tambah", () => {
    expect(labelOf({ action: "create", oldData: null, newData: {} })).toBe(
      "Tambah",
    );
  });

  test("delete → Hapus permanen", () => {
    expect(labelOf({ action: "delete", oldData: {}, newData: null })).toBe(
      "Hapus permanen",
    );
  });

  test("update dengan deletedAt terisi → Hapus", () => {
    expect(
      labelOf({
        action: "update",
        oldData: { deletedAt: null },
        newData: { deletedAt: "2026-09-01T02:00:00.000Z", deletedBy: 1 },
      }),
    ).toBe("Hapus");
  });

  test("update deletedAt null padahal sebelumnya terisi → Pulihkan", () => {
    expect(
      labelOf({
        action: "update",
        oldData: { deletedAt: "2026-08-01T02:00:00.000Z" },
        newData: { deletedAt: null },
      }),
    ).toBe("Pulihkan");
  });

  test("update biasa → Ubah, termasuk deletedAt null yang memang kosong", () => {
    expect(
      labelOf({
        action: "update",
        oldData: { name: "A" },
        newData: { name: "B" },
      }),
    ).toBe("Ubah");
    expect(
      labelOf({
        action: "update",
        oldData: { deletedAt: null },
        newData: { deletedAt: null },
      }),
    ).toBe("Ubah");
  });
});

describe("kind dari be-sada", () => {
  test("lima nilai kind dipetakan ke label aksi", () => {
    expect(
      (["create", "update", "hapus", "pulihkan", "delete"] as const).map(
        (kind) => ACTION_LABEL[actionKindFromServer(kind)],
      ),
    ).toEqual(["Tambah", "Ubah", "Hapus", "Pulihkan", "Hapus permanen"]);
  });

  test("operasi massal (A3) punya label sendiri, bukan jatuh ke Ubah", () => {
    expect(
      (["createMany", "updateMany", "deleteMany"] as const).map(
        (kind) => ACTION_LABEL[actionKindFromServer(kind)],
      ),
    ).toEqual(["Tambah massal", "Ubah massal", "Hapus permanen massal"]);
  });

  test("detail operasi massal berjudul label, bukan undefined", () => {
    expect(
      labelOf({ action: "deleteMany", oldData: null, newData: null }),
    ).toBe("Hapus permanen massal");
    expect(
      labelOf({
        action: "updateMany",
        oldData: null,
        newData: { status: "PAID" },
      }),
    ).toBe("Ubah massal");
  });
});

describe("label data", () => {
  test("setiap model schema (dari mock) punya label", () => {
    expect(PRISMA_MODELS.filter((model) => !MODEL_LABEL[model])).toEqual([]);
  });

  test("tidak ada label untuk model yang sudah tidak ada di schema", () => {
    expect(
      Object.keys(MODEL_LABEL).filter(
        (model) => !PRISMA_MODELS.includes(model),
      ),
    ).toEqual([]);
  });

  test("model yang belum dipetakan tampil apa adanya", () => {
    expect(modelLabel("ZoneChurch")).toBe("Wilayah");
    expect(modelLabel("ModelBaru")).toBe("ModelBaru");
  });
});

describe("diff perubahan", () => {
  const audit = {
    id: 7,
    publicId: "x",
    createdBy: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: 2,
    updatedAt: "2026-09-01T00:00:00.000Z",
  };

  test("update hanya menampilkan kunci newData yang berubah", () => {
    const changes = listChanges({
      action: "update",
      oldData: { ...audit, name: "Andreas", phone: "0812", zoneChurchId: 2 },
      newData: {
        name: "Andreas",
        phone: "0813",
        zoneChurchId: 2,
        updatedBy: 3,
      },
    });

    expect(changes).toEqual([
      { field: "phone", before: "0812", after: "0813" },
    ]);
  });

  test("create: semua kunci newData, sebelum kosong", () => {
    const changes = listChanges({
      action: "create",
      oldData: null,
      newData: { name: "Perawat", createdBy: 1 },
    });

    expect(changes).toEqual([
      { field: "name", before: undefined, after: "Perawat" },
    ]);
  });

  test("delete: semua kunci oldData, sesudah kosong", () => {
    const changes = listChanges({
      action: "delete",
      oldData: { ...audit, roleInFamily: "ANAK" },
      newData: null,
    });

    expect(changes).toEqual([
      { field: "roleInFamily", before: "ANAK", after: undefined },
    ]);
  });

  test("kunci audit tersembunyi kecuali deletedAt", () => {
    const changes = listChanges({
      action: "update",
      oldData: { ...audit, deletedAt: null, deletedBy: null },
      newData: {
        deletedAt: "2026-09-02T01:00:00.000Z",
        deletedBy: 2,
        ...audit,
      },
    });

    expect(changes.map((change) => change.field)).toEqual(["deletedAt"]);
  });

  test("tulis bersarang dibandingkan dan tampil sebagai JSON", () => {
    const menuAccess = {
      deleteMany: {},
      create: [{ menuId: 3, action: ["VIEW"] }],
    };
    const [change] = listChanges({
      action: "update",
      oldData: { name: "Operator" },
      newData: { name: "Operator", menuAccess },
    });

    expect(change.field).toBe("menuAccess");
    expect(formatChangeValue(change.after)).toEqual({
      text: JSON.stringify(menuAccess, null, 2),
      isJson: true,
    });
  });
});

describe("nilai perubahan", () => {
  test("boolean Ya/Tidak, null dan kosong tanpa teks", () => {
    expect(formatChangeValue(true).text).toBe("Ya");
    expect(formatChangeValue(false).text).toBe("Tidak");
    expect(formatChangeValue(null).text).toBeNull();
    expect(formatChangeValue(undefined).text).toBeNull();
    expect(formatChangeValue("").text).toBeNull();
  });

  test("angka dan string apa adanya", () => {
    expect(formatChangeValue(3).text).toBe("3");
    expect(formatChangeValue("INACTIVE").text).toBe("INACTIVE");
  });

  test("tanggal ISO lewat formatDateTime; tengah malam UTC sebagai tanggal", () => {
    expect(formatChangeValue("2026-09-02T01:30:00.000Z").text).toMatch(
      /2 September 2026.+\d{2}\.\d{2}/,
    );
    expect(formatChangeValue("1990-05-12T00:00:00.000Z").text).toBe(
      "12 Mei 1990",
    );
  });
});

describe("filter", () => {
  test("periode → dateFrom/dateTo (hari WIB, inklusif)", () => {
    const today = "2026-09-27";

    expect(toLogApiFilters({ periode: "1" }, today)).toMatchObject({
      dateFrom: "2026-09-27",
      dateTo: "2026-09-27",
    });
    expect(toLogApiFilters({ periode: "7" }, today)).toMatchObject({
      dateFrom: "2026-09-21",
      dateTo: "2026-09-27",
    });
    expect(toLogApiFilters({ periode: "30" }, today)).toMatchObject({
      dateFrom: "2026-08-29",
      dateTo: "2026-09-27",
    });
    expect(toLogApiFilters({}, today)).toMatchObject({
      dateFrom: "",
      dateTo: "",
    });
  });

  test("aksi, data, pengguna → kunci be-sada", () => {
    expect(
      toLogApiFilters(
        { aksi: "update", data: "Jemaat", pengguna: "U-0002" },
        "2026-09-27",
      ),
    ).toMatchObject({
      action: "update",
      kind: "",
      model: "Jemaat",
      user: "U-0002",
    });
    expect(toLogApiFilters({ aksi: "hapus" }, "2026-09-27")).toMatchObject({
      action: "",
      kind: "hapus",
    });
  });

  test("SUPPORTED_FILTERS menyembunyikan filter dan opsi yang belum didukung", () => {
    const users = [{ value: "U-0002", label: "Debora Manurung" }];
    const onlyAction = listLogFilters(users, ["aksi"]);

    expect(onlyAction.map((filter) => filter.key)).toEqual(["aksi"]);
    expect(onlyAction[0].options.map((option) => option.label)).toEqual([
      "Semua",
      "Tambah",
      "Ubah",
    ]);
    expect(Object.keys(filterSchemaOf(["aksi"]))).toEqual([
      "aksi",
      "permintaan",
    ]);

    const all = listLogFilters(users, [
      "periode",
      "aksi",
      "aksiHapus",
      "data",
      "pengguna",
    ]);

    expect(all.map((filter) => filter.key)).toEqual([
      "periode",
      "aksi",
      "data",
      "pengguna",
    ]);
    expect(all[1].options.at(-1)?.label).toBe("Hapus");
  });
});

describe("tautan rekaman", () => {
  test("jemaat dengan kode → daftar jemaat dicari dengan kode", () => {
    expect(
      recordLinkOf({
        model: "Jemaat",
        oldData: { code: "JMT-0004" },
        newData: {},
      }),
    ).toEqual({
      menu: "DAFTAR_JEMAAT",
      href: "/kejemaatan/daftar-jemaat?search=JMT-0004",
    });
  });

  test("tanpa kode atau tanpa layar → tanpa tautan", () => {
    expect(
      recordLinkOf({ model: "Jemaat", oldData: null, newData: { name: "A" } }),
    ).toBeNull();
    expect(
      recordLinkOf({
        model: "Profession",
        oldData: null,
        newData: { code: "P" },
      }),
    ).toBeNull();
  });
});

describe("waktu log di daftar", () => {
  test("tanggal pendek + jam WIB, termasuk dini hari yang berganti tanggal", () => {
    expect(formatLogTime("2026-09-27T05:36:00.000Z")).toBe("27 Sep 2026 12.36");
    expect(formatLogTime("2026-09-26T20:36:00.000Z")).toBe("27 Sep 2026 03.36");
    expect(formatLogTime("bukan-tanggal")).toBe("-");
  });
});

describe("sisi diff", () => {
  test("create/delete satu sisi, update dua sisi", () => {
    expect(isOneSided("create")).toBe(true);
    expect(isOneSided("delete")).toBe(true);
    expect(isOneSided("update")).toBe(false);
  });

  test("ubah massal dua sisi: be-sada kini mencatat 'sebelum' per rekaman", () => {
    expect(isOneSided("updateMany")).toBe(false);
    expect(
      listChanges({
        action: "updateMany",
        oldData: { id: 1, status: "PENDING", amount: 10 },
        newData: { status: "PAID" },
      }),
    ).toEqual([{ field: "status", before: "PENDING", after: "PAID" }]);
  });

  test("hapus massal menampilkan keadaan terakhir rekaman", () => {
    expect(isBeforeOnly("deleteMany")).toBe(true);
    expect(
      listChanges({
        action: "deleteMany",
        oldData: { id: 1, name: "A" },
        newData: null,
      }),
    ).toEqual([{ field: "name", before: "A", after: undefined }]);
  });

  test("catatan bacaan satu sisi", () => {
    for (const action of ["view", "export", "archive"] as const) {
      expect(isOneSided(action), action).toBe(true);
    }
  });
});

describe("operasi massal dan bacaan", () => {
  test("ubah massal yang menulis deletedAt → Hapus, sama dengan be-sada", () => {
    expect(
      labelOf({
        action: "updateMany",
        oldData: { deletedAt: null },
        newData: { deletedAt: "2026-09-01T02:00:00.000Z" },
      }),
    ).toBe("Hapus");
    expect(actionKindFromServer("hapus")).toBe("softDelete");
  });

  test("lihat, ekspor, dan arsip punya label sendiri", () => {
    expect(
      (["view", "export", "archive"] as const).map(
        (kind) => ACTION_LABEL[actionKindFromServer(kind)],
      ),
    ).toEqual(["Lihat", "Ekspor", "Arsipkan"]);
  });

  test("catatan Lihat menaut ke catatan log yang dibuka", () => {
    expect(
      recordLinkOf({
        model: "ActivityLog",
        recordId: "77",
        oldData: null,
        newData: null,
      })?.href,
    ).toBe("/settings/activity-log/77");
  });
});

describe("ekspor dan permintaan", () => {
  test("ekspor membawa filter dan pencarian daftar, tanpa halaman", () => {
    const query = new URLSearchParams(
      exportQueryOf(
        { periode: "7", aksi: "hapus", data: "Jemaat", permintaan: "req-1" },
        "128",
        "2026-09-27",
      ),
    );

    expect(Object.fromEntries(query)).toEqual({
      dateFrom: "2026-09-21",
      dateTo: "2026-09-27",
      kind: "hapus",
      model: "Jemaat",
      requestId: "req-1",
      filter: "128",
    });
  });

  test("tautan satu permintaan membuka daftar tersaring requestId", () => {
    expect(requestLogHref("a b")).toBe(
      "/settings/activity-log?permintaan=a%20b",
    );
    expect(
      toLogApiFilters({ permintaan: "req-9" }, "2026-09-27"),
    ).toMatchObject({ requestId: "req-9" });
    expect(Object.keys(filterSchemaOf(["aksi"]))).toEqual([
      "aksi",
      "permintaan",
    ]);
  });
});
