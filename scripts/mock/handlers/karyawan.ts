/**
 * Tiruan `/api/v1/karyawan` (be-sada modul `karyawan`, gelombang 0 `65f07f6`)
 * dan `GET /ddl/karyawan` (be-sada `dropdown_list`, `9b94577`).
 * Kunci path `code` (`KRY-0001`), cocok tanpa peduli huruf besar-kecil, dan
 * respons tulis berbentuk sama dengan respons baca — `include: { jemaat }` di
 * `create`/`updateById` sudah mendarat di be-sada, jadi di sini pun ikut.
 *
 *   MOCK_500=1                      → daftar karyawan menjawab 500
 *   MOCK_EMPTY=1                    → daftar kosong (404, lewat `list`)
 *   MOCK_FAIL_PAGE=3                → halaman 3 daftar menjawab 500
 *   MOCK_KARYAWAN_SAVE_ERROR=500    → simpan menjawab 500 (galat tingkat form)
 *                              =tanggal  → 400 tanggal berhenti lebih awal
 *                              =jemaat   → 404 "Jemaat Tidak Ditemukan"
 *                              =duplikat → 409 jemaat sudah punya karyawan aktif
 *                                          (bentuk permintaan BE S30; be-sada
 *                                          belum mengirimnya hari ini)
 *   MOCK_DDL_EMPTY=1                → /ddl/karyawan kosong (404)
 *   MOCK_KARYAWAN_DELETE_ERROR=1    → hapus menjawab 409 masih dipakai
 *                                     (bentuk permintaan BE S20)
 *
 * Kolom audit TIDAK dikembalikan: `karyawan` sudah masuk `AUDITED_MODELS`.
 * Nol nominal gaji di berkas ini — gaji hidup di Kontrak dan Penggajian.
 */
import { MENU } from "../../../src/config/menu";
import { DDL_JEMAAT } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type EmploymentStatus = "ACTIVE" | "RESIGNED" | "TERMINATED";

type Row = {
  id: number;
  publicId: string;
  code: string;
  jemaatId: number | null;
  jemaat: { id: number; code: string; name: string } | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  position: string;
  joinDate: string;
  resignDate: string | null;
  status: EmploymentStatus;
};

type Body = {
  jemaatId?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  position?: unknown;
  joinDate?: unknown;
  resignDate?: unknown;
  status?: unknown;
};

const STATUSES: EmploymentStatus[] = ["ACTIVE", "RESIGNED", "TERMINATED"];

const jemaatOf = (id: number | null) =>
  id === null ? null : (DDL_JEMAAT.find((row) => row.id === id) ?? null);

const toRow = (
  id: number,
  name: string,
  position: string,
  phone: string,
  joinDate: string,
  extra: Partial<Row> = {},
): Row => ({
  id,
  publicId: `karyawan-${id}`,
  code: `KRY-${String(id).padStart(4, "0")}`,
  jemaatId: null,
  jemaat: null,
  name,
  phone,
  email: null,
  address: null,
  position,
  joinDate: `${joinDate}T00:00:00.000Z`,
  resignDate: null,
  status: "ACTIVE",
  ...extra,
});

const withJemaat = (id: number) => ({
  jemaatId: id,
  jemaat: jemaatOf(id),
});

/**
 * Satu-satunya roster karyawan di mock, dan `/ddl/karyawan` di bawah
 * menyajikannya: dulu berkas ini dan `komponen-payroll.ts` menyemai dua roster
 * dengan id yang sama tapi orang yang berbeda, jadi KRY-0001 adalah orang yang
 * berlainan tergantung menu mana yang dibuka.
 */
export const KARYAWAN: Row[] = [
  toRow(1, "Andreas Sitanggang", "Koster", "081234567801", "2019-03-01", {
    ...withJemaat(1),
    email: "andreas.sitanggang@gereja.or.id",
    address: "Jl. Lengkong Gudang No. 12, Serpong",
  }),
  toRow(
    2,
    "Debora Manurung",
    "Administrasi Kantor",
    "081234567802",
    "2021-07-12",
    {
      ...withJemaat(4),
      email: "debora.manurung@gereja.or.id",
      address: "Jl. Rawa Buntu Raya No. 45, Serpong",
    },
  ),
  toRow(
    3,
    "Gideon Tampubolon",
    "Petugas Keamanan",
    "081234567803",
    "2022-01-17",
    {
      ...withJemaat(7),
    },
  ),
  toRow(
    4,
    "Hanna Simorangkir",
    "Pengasuh Sekolah Minggu",
    "081234567804",
    "2023-02-06",
    { ...withJemaat(8), email: "hanna.simorangkir@gereja.or.id" },
  ),
  toRow(
    5,
    "Kevin Nainggolan",
    "Operator Multimedia",
    "081234567805",
    "2024-08-05",
  ),
  toRow(
    6,
    "Lidya Hutagalung",
    "Bendahara Kantor",
    "081234567806",
    "2018-05-02",
    {
      ...withJemaat(12),
      position: "Staf Keuangan",
      status: "RESIGNED",
      resignDate: "2025-12-31T00:00:00.000Z",
    },
  ),
  toRow(
    7,
    "Immanuel Saragih",
    "Petugas Kebersihan",
    "081234567807",
    "2020-09-14",
    {
      ...withJemaat(9),
      status: "TERMINATED",
      resignDate: "2024-06-30T00:00:00.000Z",
    },
  ),
  // Baris terpanjang TANPA SPASI, sengaja: pedoman §7.3 diukur dengan ini,
  // bukan dengan teks contoh yang punya spasi di tempat yang nyaman.
  toRow(
    8,
    "Fransiskawatihalimsitumorangnainggolanpanggabeansimorangkirtampubolon",
    "Sekretarisjemaatbidangpelayananumumdanadministrasipersuratankantorgerejapusatcabangutama",
    "081234567808",
    "2025-01-06",
    {
      ...withJemaat(6),
      email:
        "fransiskawatihalimsitumorangnainggolanpanggabean@gerejapusatcabang.or.id",
      address:
        "Jalanrayaserpongkomplekspermatahijauperumahanblokcnomorseratusduapuluhtigarukuntetanggaempatrukunwargasembilankelurahanlengkonggudang",
    },
  ),
];

const SEED: Row[] = KARYAWAN.map((row) => ({ ...row }));

/** Benih dimiliki modul yang menyemainya (pedoman §7.2), bukan berkas test. */
export const resetKaryawanRows = () =>
  KARYAWAN.splice(0, KARYAWAN.length, ...SEED.map((row) => ({ ...row })));

const invalid = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const asText = (value: unknown) => (typeof value === "string" ? value : "");

const validate = (body: Body) => {
  const name = asText(body.name).trim();
  if (!name) return invalid("name", "Mohon Lengkapi Nama Karyawan");
  if (name.length > 150) {
    return invalid("name", "Nama Karyawan tidak boleh lebih dari 150 karakter");
  }

  const phone = asText(body.phone);
  if (!phone) return invalid("phone", "Mohon Lengkapi No Handphone");
  if (!/^\d+$/.test(phone)) {
    return invalid("phone", "No Handphone hanya boleh berisi angka");
  }
  if (phone.length > 15) {
    return invalid("phone", "No Handphone tidak boleh lebih dari 15 angka");
  }

  const email = body.email === null ? "" : asText(body.email);
  if (email && !/^[^@\s]+@[^@\s]+$/.test(email)) {
    return invalid("email", "Format Email tidak valid");
  }
  if (email.length > 150) {
    return invalid("email", "Email tidak boleh lebih dari 150 karakter");
  }

  const address = body.address === null ? "" : asText(body.address);
  if (address.trim().length > 250) {
    return invalid("address", "Alamat tidak boleh lebih dari 250 karakter");
  }

  const position = asText(body.position).trim();
  if (!position) return invalid("position", "Mohon Lengkapi Jabatan");
  if (position.length > 100) {
    return invalid("position", "Jabatan tidak boleh lebih dari 100 karakter");
  }

  if (!isIsoDate(body.joinDate)) {
    return invalid("joinDate", "Mohon Lengkapi Tanggal Bergabung");
  }
  if (body.resignDate !== null && body.resignDate !== undefined) {
    if (!isIsoDate(body.resignDate)) {
      return invalid(
        "resignDate",
        "Tanggal Berhenti harus berupa tanggal yang valid",
      );
    }
    if (body.resignDate < body.joinDate) {
      return json(
        {
          status: 400,
          error:
            "Tanggal Berhenti Tidak Boleh Lebih Awal Dari Tanggal Bergabung",
        },
        400,
      );
    }
  }

  if (
    body.status !== undefined &&
    !STATUSES.includes(body.status as EmploymentStatus)
  ) {
    return invalid(
      "status",
      "Status Karyawan harus bernilai ACTIVE, RESIGNED atau TERMINATED",
    );
  }

  if (body.jemaatId !== null && body.jemaatId !== undefined) {
    if (!Number.isInteger(body.jemaatId)) {
      return invalid("jemaatId", "Jemaat harus berupa angka");
    }
    if (!jemaatOf(body.jemaatId as number)) {
      return json({ status: 404, error: "Jemaat Tidak Ditemukan" }, 404);
    }
  }

  return null;
};

const SAVE_ERROR: Record<string, { status: number; error: string }> = {
  "500": { status: 500, error: "Kesalahan server." },
  tanggal: {
    status: 400,
    error: "Tanggal Berhenti Tidak Boleh Lebih Awal Dari Tanggal Bergabung",
  },
  jemaat: { status: 404, error: "Jemaat Tidak Ditemukan" },
  duplikat: {
    status: 409,
    error: "Jemaat Ini Sudah Terdaftar Sebagai Karyawan Aktif",
  },
};

const saveFailure = () => {
  const failure = SAVE_ERROR[process.env.MOCK_KARYAWAN_SAVE_ERROR ?? ""];

  return failure ? json(failure, failure.status) : null;
};

const applyBody = (row: Row, body: Body) => {
  const jemaatId = typeof body.jemaatId === "number" ? body.jemaatId : null;
  const email = body.email === null ? "" : asText(body.email).trim();
  const address = body.address === null ? "" : asText(body.address).trim();

  row.jemaatId = jemaatId;
  row.jemaat = jemaatOf(jemaatId);
  row.name = asText(body.name).trim();
  row.phone = asText(body.phone);
  row.email = email || null;
  row.address = address || null;
  row.position = asText(body.position).trim();
  row.joinDate = `${String(body.joinDate)}T00:00:00.000Z`;
  row.resignDate = isIsoDate(body.resignDate)
    ? `${body.resignDate}T00:00:00.000Z`
    : null;
  row.status = STATUSES.includes(body.status as EmploymentStatus)
    ? (body.status as EmploymentStatus)
    : "ACTIVE";

  return row;
};

export const karyawanMock: MockHandler = async (ctx) => {
  const { request, url, path, method, can } = ctx;

  if (path === "/ddl/karyawan" && method === "GET") {
    // Any-of lima menu, sama seperti be-sada `dropdown_list.route.ts`: satu
    // role boleh memegang LEAVE CREATE tanpa KARYAWAN VIEW dan tetap harus bisa
    // mengisi formnya.
    const isAllowed = [
      MENU.EMPLOYEE,
      MENU.LEAVE,
      MENU.EMPLOYEE_CONTRACT,
      MENU.ATTENDANCE,
      MENU.PAYROLL_COMPONENT,
    ].some((slug) => can(slug, "VIEW"));

    if (!isAllowed) return denied();
    if (process.env.MOCK_DDL_EMPTY) {
      return json({ status: 404, error: "Karyawan Tidak Ditemukan" }, 404);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const picked = KARYAWAN.filter(
      (person) =>
        person.status === "ACTIVE" &&
        (person.name.toLowerCase().includes(filter) ||
          person.code.toLowerCase().includes(filter)),
    )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, code, name, position }) => ({ id, code, name, position }));

    if (!picked.length) {
      return json({ status: 404, error: "Karyawan Tidak Ditemukan" }, 404);
    }

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Semua Karyawan",
      data: picked,
    });
  }

  if (path !== "/karyawan" && !path.startsWith("/karyawan/")) return null;

  const code = decodeURIComponent(path.slice("/karyawan/".length));
  const action =
    method === "POST"
      ? "CREATE"
      : method === "PUT"
        ? "UPDATE"
        : method === "DELETE"
          ? "DELETE"
          : "VIEW";

  if (!can(MENU.EMPLOYEE, action)) return denied();

  if (path === "/karyawan" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const page = Number(url.searchParams.get("page")) || 1;
    if (page === Number(process.env.MOCK_FAIL_PAGE)) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      KARYAWAN.filter(
        (row) =>
          !filter ||
          row.name.toLowerCase().includes(filter) ||
          row.position.toLowerCase().includes(filter),
      ).sort((a, b) => a.name.localeCompare(b.name)),
      url,
      "Karyawan",
      "Karyawan",
    );
  }

  if (path === "/karyawan" && method === "POST") {
    const failure = saveFailure();
    if (failure) return failure;

    const body = await readBody<Body>(request);
    const rejected = validate(body);
    if (rejected) return rejected;

    const id = Math.max(0, ...KARYAWAN.map((row) => row.id)) + 1;
    const created = applyBody(toRow(id, "", "", "", "2026-01-01"), body);
    KARYAWAN.push(created);

    return json(
      { status: 201, message: "Berhasil Membuat Karyawan", data: created },
      201,
    );
  }

  const row = KARYAWAN.find(
    (item) => item.code.toLowerCase() === code.toLowerCase(),
  );

  if (!row)
    return json({ status: 404, error: "Karyawan Tidak Ditemukan" }, 404);

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Karyawan",
      data: row,
    });
  }

  if (method === "PUT") {
    const failure = saveFailure();
    if (failure) return failure;

    const body = await readBody<Body>(request);
    const rejected = validate(body);
    if (rejected) return rejected;

    return json({
      status: 200,
      message: "Berhasil Memperbarui Karyawan",
      data: applyBody(row, body),
    });
  }

  if (method === "DELETE") {
    if (process.env.MOCK_KARYAWAN_DELETE_ERROR) {
      return json(
        {
          status: 409,
          error:
            "Karyawan Masih Dipakai Kontrak, Absensi, Atau Slip Gaji Yang Aktif",
        },
        409,
      );
    }

    KARYAWAN.splice(KARYAWAN.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Karyawan",
      data: row,
    });
  }

  return null;
};
