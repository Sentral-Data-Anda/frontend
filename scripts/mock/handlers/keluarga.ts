/**
 * Tiruan be-sada `/keluarga` (docs/design/kejemaatan/keluarga.md).
 *
 *   MOCK_KELUARGA_500=1                         → daftar keluarga menjawab 500
 *   MOCK_KELUARGA_SAVE_ERROR=wilayah|validasi|500 → simpan keluarga gagal dengan jawaban itu
 *
 * Hapus keluarga yang masih punya anggota aktif menjawab 400 seperti be-sada;
 * keluarga tanpa anggota (mis. "Keluarga Halim") bisa dihapus.
 */
import { MENU } from "../../../src/config/menu";
import { ZONE_CHURCHES } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Member = {
  id: string;
  role: "KEPALA_KELUARGA" | "PASANGAN" | "ANAK";
  jemaatCode: string | null;
  name: string;
  gender: "L" | "P" | null;
  birthDate: string | null;
  startedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  endNote: string | null;
};

type KeluargaRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  provincesCode: string;
  regenciesCode: string;
  districtsCode: string;
  villagesCode: string;
  address: string;
  zoneChurchId: number | null;
  worshipsHere: boolean;
  members: Member[];
};

type KeluargaBody = Partial<
  Pick<
    KeluargaRow,
    | "name"
    | "provincesCode"
    | "regenciesCode"
    | "districtsCode"
    | "villagesCode"
    | "address"
    | "zoneChurchId"
    | "worshipsHere"
  >
>;

const SURNAMES = [
  "Sitanggang",
  "Kusuma",
  "Wijaya",
  "Manurung",
  "Panggabean",
  "Halim",
  "Saragih",
  "Nainggolan",
  "Hutagalung",
  "Simorangkir",
  "Tampubolon",
  "Tanuwijaya",
];

const ADDRESSES = [
  ["32", "3273", "327301", "3273011001", "Jl. Cijerah No. 12, RT 03 RW 05"],
  ["36", "3671", "367101", "3671011002", "Jl. Rawa Buntu Utara Blok C2 No. 7"],
] as const;

const member = (
  keluargaId: number,
  index: number,
  role: Member["role"],
  name: string,
  extra: Partial<Member> = {},
): Member => ({
  id: `00000000-0000-4000-8000-${String(keluargaId * 100 + index).padStart(12, "0")}`,
  role,
  jemaatCode: null,
  name,
  gender: role === "PASANGAN" ? "P" : "L",
  birthDate: `19${70 + index * 7}-0${index + 1}-15T00:00:00.000Z`,
  startedAt: "2015-06-01T00:00:00.000Z",
  endedAt: null,
  endReason: null,
  endNote: null,
  ...extra,
});

const membersOf = (id: number, surname: string): Member[] => {
  if (surname === "Halim") return [];

  return [
    member(id, 0, "KEPALA_KELUARGA", `Yosua ${surname}`),
    member(id, 1, "PASANGAN", `Ruth ${surname}`),
    ...(id % 3 === 0 ? [] : [member(id, 2, "ANAK", `Samuel ${surname}`)]),
    ...(id % 2 === 0
      ? [
          member(id, 3, "ANAK", `Debora ${surname}`, {
            gender: "P",
            endedAt: "2024-02-10T00:00:00.000Z",
            endReason: "MENIKAH",
          }),
        ]
      : []),
  ];
};

const store: KeluargaRow[] = SURNAMES.map((surname, index) => {
  const id = index + 1;
  const [provincesCode, regenciesCode, districtsCode, villagesCode, address] =
    ADDRESSES[index % 2];

  return {
    id,
    publicId: `10000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    code: `KK-${String(id).padStart(4, "0")}`,
    name: `Keluarga ${surname}`,
    provincesCode,
    regenciesCode,
    districtsCode,
    villagesCode,
    address,
    zoneChurchId: index % 5 === 4 ? null : (index % ZONE_CHURCHES.length) + 1,
    worshipsHere: index % 6 !== 5,
    members: membersOf(id, surname),
  };
});

const isLive = (row: Member) => row.endedAt === null;

const toResponse = ({ members, ...row }: KeluargaRow) => {
  const zoneName = row.zoneChurchId
    ? ZONE_CHURCHES[row.zoneChurchId - 1]
    : undefined;

  return {
    ...row,
    zoneChurch: zoneName
      ? {
          id: row.zoneChurchId,
          code: `ZON-${row.zoneChurchId}`,
          name: zoneName,
        }
      : null,
    _count: { members: members.filter(isLive).length },
  };
};

const findByCode = (code: string) =>
  store.find((row) => row.code.toLowerCase() === code.toLowerCase());

const notFound = () =>
  json({ status: 404, error: "Keluarga Tidak Ditemukan" }, 404);

const SAVE_ERROR: Record<
  string,
  {
    status: number;
    error: string;
    issues?: { path: string; message: string }[];
  }
> = {
  wilayah: { status: 404, error: "Wilayah Gereja Tidak Ditemukan" },
  validasi: {
    status: 400,
    error: "Nama Keluarga tidak boleh lebih dari 100 karakter",
    issues: [
      {
        path: "name",
        message: "Nama Keluarga tidak boleh lebih dari 100 karakter",
      },
      { path: "address", message: "Mohon Lengkapi Alamat" },
    ],
  },
  "500": { status: 500, error: "Kesalahan server." },
};

const REQUIRED: [keyof KeluargaBody, string][] = [
  ["name", "Mohon Lengkapi Nama Keluarga"],
  ["provincesCode", "Mohon Lengkapi Provinsi"],
  ["regenciesCode", "Mohon Lengkapi Kabupaten"],
  ["districtsCode", "Mohon Lengkapi Kecamatan"],
  ["villagesCode", "Mohon Lengkapi Kelurahan"],
  ["address", "Mohon Lengkapi Alamat"],
];

const validate = (body: KeluargaBody) => {
  const failure = SAVE_ERROR[process.env.MOCK_KELUARGA_SAVE_ERROR ?? ""];

  if (failure) return json(failure, failure.status);

  const issues = REQUIRED.filter(
    ([field]) => !String(body[field] ?? "").trim(),
  ).map(([path, message]) => ({ path, message }));

  if (issues.length > 0) {
    return json({ status: 400, error: issues[0].message, issues }, 400);
  }

  if (body.zoneChurchId && !ZONE_CHURCHES[body.zoneChurchId - 1]) {
    return json({ status: 404, error: "Wilayah Gereja Tidak Ditemukan" }, 404);
  }

  return null;
};

const applyBody = (row: KeluargaRow, body: KeluargaBody) => {
  Object.assign(row, {
    name: body.name?.trim(),
    provincesCode: body.provincesCode,
    regenciesCode: body.regenciesCode,
    districtsCode: body.districtsCode,
    villagesCode: body.villagesCode,
    address: body.address?.trim(),
    zoneChurchId: body.zoneChurchId || null,
    worshipsHere: body.worshipsHere ?? true,
  });
};

export const keluargaMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  const match = /^\/keluarga(?:\/([^/]+))?$/.exec(path);

  if (!match) return null;

  const code = match[1] ? decodeURIComponent(match[1]) : undefined;
  const action = {
    GET: "VIEW",
    POST: "CREATE",
    PUT: "UPDATE",
    DELETE: "DELETE",
  } as const;
  const needed = action[method as keyof typeof action];

  if (!needed || !can(MENU.KELUARGA, needed)) return denied();

  if (!code && method === "GET") {
    if (process.env.MOCK_KELUARGA_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const rows = store
      .filter(
        (row) =>
          !filter ||
          row.name.toLowerCase().includes(filter) ||
          row.code.toLowerCase().includes(filter),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toResponse);

    return list(rows, url, "Keluarga", "Keluarga");
  }

  if (!code && method === "POST") {
    const body = await readBody<KeluargaBody>(request);
    const rejected = validate(body);

    if (rejected) return rejected;

    const id = Math.max(0, ...store.map((row) => row.id)) + 1;
    const row: KeluargaRow = {
      id,
      publicId: crypto.randomUUID(),
      code: `KK-${String(id).padStart(4, "0")}`,
      name: "",
      provincesCode: "",
      regenciesCode: "",
      districtsCode: "",
      villagesCode: "",
      address: "",
      zoneChurchId: null,
      worshipsHere: true,
      members: [],
    };

    applyBody(row, body);
    store.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Keluarga",
        data: toResponse(row),
      },
      201,
    );
  }

  const row = code ? findByCode(code) : undefined;

  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Keluarga",
      data: toResponse(row),
    });
  }

  if (method === "PUT") {
    const body = await readBody<KeluargaBody>(request);
    const rejected = validate(body);

    if (rejected) return rejected;

    applyBody(row, body);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Keluarga",
      data: toResponse(row),
    });
  }

  const liveMembers = row.members.filter(isLive).length;

  if (liveMembers > 0) {
    return json(
      {
        status: 400,
        error: `Keluarga Tidak Dapat Dihapus Karena Masih Memiliki ${liveMembers} Anggota Aktif`,
      },
      400,
    );
  }

  store.splice(store.indexOf(row), 1);

  return json({
    status: 200,
    message: "Berhasil Menghapus Keluarga",
    data: toResponse(row),
  });
};
