/**
 * Tiruan `/report/jemaat/*` be-sada (report.route.ts). `type-gender` dan
 * `birth/:month` dijawab dev-mock.ts, kecuali saat flag di bawah aktif.
 *
 *   MOCK_EMPTY=1          → sebaran `[]`, incomplete & zone nol, birth 404
 *   MOCK_REPORT_500=1     → semua path laporan menjawab 500
 *   MOCK_REPORT_500=age   → hanya satu path (age, ethnic, type-gender, …) 500
 */
import { ZONE_CHURCHES } from "../../mock-dashboard";
import { denied, json, type MockHandler } from "../kit";

const OK = "Berhasil Mendapatkan Report";

// Urutan group-by be-sada tidak dijamin; sengaja diacak.
const GROUPS: Record<string, unknown[]> = {
  age: [
    { Umur: "<12", Count: 96 },
    { Umur: "12-17", Count: 118 },
    { Umur: "18-30", Count: 262 },
    { Umur: "30-50", Count: 391 },
    { Umur: ">50", Count: 287 },
  ],
  ethnic: [
    { Suku: "Jawa", Count: 236 },
    { Suku: "Batak Toba", Count: 412 },
    { Suku: "Minahasa", Count: 84 },
    { Suku: "Tionghoa", Count: 198 },
    { Suku: "Nias", Count: 18 },
    { Suku: "Sunda", Count: 121 },
    { Suku: "Batak Karo", Count: 41 },
    { Suku: "Ambon", Count: 63 },
  ],
  profession: [
    { Profession: "Guru", Count: 88 },
    { Profession: "Karyawan swasta", Count: 318 },
    { Profession: "Pensiunan", Count: 57 },
    { Profession: "Pelajar/Mahasiswa", Count: 241 },
    { Profession: "Wiraswasta", Count: 142 },
    { Profession: "Ibu rumah tangga", Count: 176 },
    { Profession: "Pegawai negeri sipil", Count: 64 },
    { Profession: "Tenaga kesehatan", Count: 39 },
    { Profession: "Buruh", Count: 27 },
    { Profession: "Pendeta", Count: 6 },
  ],
  "blood-type": [
    { bloodType: "A", Count: 311 },
    { bloodType: "O", Count: 402 },
    { bloodType: "AB", Count: 96 },
    { bloodType: "B", Count: 287 },
  ],
  "last-education": [
    { lastEducation: "SMA", Count: 356 },
    { lastEducation: "S1", Count: 318 },
    { lastEducation: "SD", Count: 88 },
    { lastEducation: "SMP", Count: 102 },
    { lastEducation: "SMK", Count: 97 },
    { lastEducation: "D3", Count: 84 },
    { lastEducation: "S2", Count: 61 },
    { lastEducation: "TIDAK_SEKOLAH", Count: 12 },
    { lastEducation: "S3", Count: 7 },
  ],
};

const INCOMPLETE = {
  total: 1290,
  birthDate: 58,
  lastEducation: 165,
  profession: 132,
};

// Wilayah 5 nonaktif dan nol; baris tanpa wilayah selalu terakhir.
const ZONE_COUNTS = [
  [312, 18, 96],
  [241, 11, 74],
  [198, 25, 63],
  [174, 9, 58],
  [0, 0, 0],
  [3, 21, 2],
];

const zoneRows = (isEmpty: boolean) =>
  ZONE_COUNTS.map(([anggota, simpatisan, keluarga], index) => {
    const id = index + 1;
    const isUnzoned = index === ZONE_COUNTS.length - 1;
    const counts = isEmpty
      ? { anggota: 0, simpatisan: 0, keluarga: 0 }
      : { anggota, simpatisan, keluarga };

    return isUnzoned
      ? {
          zoneChurchId: null,
          code: null,
          name: null,
          isActive: null,
          ...counts,
        }
      : {
          zoneChurchId: id,
          code: `ZC-${String(id).padStart(4, "0")}`,
          name: ZONE_CHURCHES[index] ?? "Wilayah V",
          isActive: id <= ZONE_CHURCHES.length,
          ...counts,
        };
  });

export const reportJemaatMock: MockHandler = ({ path, method, can }) => {
  const match = path.match(/^\/report\/jemaat\/([^/]+)(\/[^/]+)?$/);
  if (!match || method !== "GET") return null;

  const name = match[1];
  const failure = process.env.MOCK_REPORT_500;
  const isEmpty = Boolean(process.env.MOCK_EMPTY);

  if (!can("REPORT_JEMAAT", "VIEW")) return denied();
  if (failure === "1" || failure === name) {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }
  if (name === "birth" && isEmpty) {
    return json({ status: 404, error: "Report Tidak Ditemukan" }, 404);
  }
  if (name === "type-gender" && isEmpty) {
    return json({ status: 200, message: OK, data: [] });
  }
  if (name === "incomplete") {
    const data = isEmpty
      ? { total: 0, birthDate: 0, lastEducation: 0, profession: 0 }
      : INCOMPLETE;
    return json({ status: 200, message: OK, data });
  }

  if (name === "zone") {
    return json({ status: 200, message: OK, data: zoneRows(isEmpty) });
  }

  const rows = GROUPS[name];
  if (!rows) return null;

  const data =
    isEmpty && name === "age"
      ? rows.map((row) => ({ ...(row as object), Count: 0 }))
      : isEmpty
        ? []
        : rows;
  return json({ status: 200, message: OK, data });
};
