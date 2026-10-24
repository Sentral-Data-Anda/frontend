/**
 * Tiruan be-sada `/keluarga` (docs/design/kejemaatan/keluarga.md).
 *
 *   MOCK_KELUARGA_500=1                         → daftar keluarga menjawab 500
 *   MOCK_KELUARGA_SAVE_ERROR=wilayah|validasi|500 → simpan keluarga gagal dengan jawaban itu
 *   MOCK_ALAMAT_ERROR=500                       → GET /ddl/keluarga/:id/alamat menjawab 500
 *
 * Hapus keluarga yang masih punya anggota aktif menjawab 400 seperti be-sada;
 * keluarga tanpa anggota (mis. "Keluarga Halim") bisa dihapus, kecuali masih
 * dijadwalkan menjadi tuan rumah ibadah hari ini atau sesudahnya.
 */
import { MENU } from "../../../src/config/menu";
import { formatDate } from "../../../src/lib/format";
import {
  KELUARGA_SEED,
  ZONE_CHURCHES,
  keluargaCodeOf,
} from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

import { nextHostedDate } from "./ibadah";
import { findWilayah } from "./wilayah";

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

// Tanpa kolom alamat: seperti be-sada, alamat keluarga adalah alamat kepala
// keluarganya, dibaca lewat keanggotaan.
type KeluargaRow = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  zoneChurchId: number | null;
  worshipsHere: boolean;
  members: Member[];
};

type KeluargaBody = Partial<Pick<KeluargaRow, "zoneChurchId" | "worshipsHere">>;

const addressOf = (id: number) =>
  id % 2 === 1
    ? `Jl. Cijerah No. ${id}, RT 0${(id % 9) + 1} RW 05`
    : `Jl. Rawa Buntu Utara Blok C2 No. ${id}`;

const member = (
  keluargaId: number,
  index: number,
  role: Member["role"],
  name: string,
  extra: Partial<Member> = {},
): Member => ({
  id: `00000000-0000-4000-8000-${String(keluargaId * 100 + index).padStart(12, "0")}`,
  role,
  // Setiap anggota adalah baris jemaat: be-sada tidak lagi menyimpan salinan
  // nama/gender/tanggal lahir di keanggotaan.
  jemaatCode: `JMT-${String(keluargaId * 100 + index).padStart(4, "0")}`,
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

const store: KeluargaRow[] = KELUARGA_SEED.map((seed, index) => {
  const id = index + 1;

  return {
    id,
    publicId: `10000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    code: keluargaCodeOf(id),
    name: `Yosua ${seed.surname}`,
    zoneChurchId: seed.wilayah,
    worshipsHere: seed.worshipsHere,
    members: membersOf(id, seed.surname),
  };
});

const isLive = (row: Member) => row.endedAt === null;

type EndMembershipBody = {
  endedAt: string;
  endReason: Member["endReason"];
  endNote: string | null;
  newHeadJemaatCode: string | null;
  alsoEndPartner: boolean | null;
  childPlacements: { jemaatCode: string; keluargaCode: string | null }[] | null;
};

const byCode = (key: string) =>
  store.find((row) => row.code === key || row.publicId === key);

/** Seperti be-sada: nama keluarga dibaca dari kepala keluarga yang hidup. */
const headOf = (members: Member[]) =>
  members.find((row) => isLive(row) && row.role === "KEPALA_KELUARGA") ?? null;

const headNameOf = (members: Member[]) => headOf(members)?.name ?? null;

/** Alamat jemaat, diturunkan dari kodenya supaya tetap sama tiap permintaan. */
const addressOfJemaat = (jemaatCode: string | null) =>
  jemaatCode ? addressOf(Number(jemaatCode.replace(/\D/g, ""))) : "";

const toResponse = ({ members, ...row }: KeluargaRow) => {
  const zoneName = row.zoneChurchId
    ? ZONE_CHURCHES[row.zoneChurchId - 1]
    : undefined;

  return {
    ...row,
    name: headNameOf(members),
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

export const findKeluarga = (id: number) => store.find((row) => row.id === id);

/** Alamat satu keluarga: alamat kepala keluarganya yang hidup. */
export const keluargaAddressOf = (id: number) =>
  addressOfJemaat(headOf(findKeluarga(id)?.members ?? [])?.jemaatCode ?? null);

export const keluargaRows = () =>
  store.map(({ members, ...row }) => ({
    ...row,
    name: headNameOf(members),
    activeMembers: members.filter(isLive).length,
  }));

const addressResponse = (idText: string) => {
  const id = Number(idText);
  const row = Number.isInteger(id) && id > 0 ? findKeluarga(id) : undefined;

  if (!row) return notFound();

  const zone = row.zoneChurchId ? findWilayah(row.zoneChurchId) : undefined;

  // Alamat kepala keluarga; keluarga tanpa kepala menjawab alamat kosong.
  return json({
    status: 200,
    message: "Berhasil Mendapatkan Alamat Keluarga",
    data: {
      id: row.id,
      address: addressOfJemaat(headOf(row.members)?.jemaatCode ?? null),
      zoneChurch: zone
        ? {
            id: zone.id,
            code: zone.code,
            name: zone.name,
            isActive: zone.isActive,
          }
        : null,
    },
  });
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

// Tidak ada field wajib: nama diturunkan dari kepala keluarga dan alamat ikut
// kepala keluarga, jadi yang tersisa hanya wilayah yang harus benar-benar ada.
const validate = (body: KeluargaBody) => {
  const failure = SAVE_ERROR[process.env.MOCK_KELUARGA_SAVE_ERROR ?? ""];

  if (failure) return json(failure, failure.status);

  if (body.zoneChurchId && !ZONE_CHURCHES[body.zoneChurchId - 1]) {
    return json({ status: 404, error: "Wilayah Gereja Tidak Ditemukan" }, 404);
  }

  return null;
};

const applyBody = (row: KeluargaRow, body: KeluargaBody) => {
  Object.assign(row, {
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
  const addressOf = /^\/ddl\/keluarga\/([^/]+)\/alamat$/.exec(path);

  if (addressOf && method === "GET") {
    if (!can(MENU.IBADAH, "CREATE")) return denied();
    if (process.env.MOCK_ALAMAT_ERROR === "500") {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    return addressResponse(decodeURIComponent(addressOf[1]));
  }

  // Anggota satu keluarga. Bersarang di bawah keluarganya, seperti be-sada.
  const memberList = /^\/keluarga\/([^/]+)\/member$/.exec(path);

  if (memberList && method === "GET") {
    if (!can(MENU.KELUARGA, "VIEW")) return denied();

    const row = byCode(decodeURIComponent(memberList[1]));

    if (!row) return json({ status: 404, error: "Keluarga tidak ada." }, 404);

    return json({ status: 200, data: row.members });
  }

  const endMember = /^\/keluarga\/([^/]+)\/member\/([^/]+)\/end$/.exec(path);

  if (endMember && method === "PUT") {
    if (!can(MENU.KELUARGA, "UPDATE")) return denied();

    const row = byCode(decodeURIComponent(endMember[1]));
    const target = row?.members.find(
      (member) => member.id === decodeURIComponent(endMember[2]),
    );

    if (!row || !target) {
      return json({ status: 404, error: "Anggota tidak ada." }, 404);
    }

    const body = (await request.json()) as EndMembershipBody;

    // Aturan be-sada yang paling mudah terlewat di layar: keluarga tidak boleh
    // kehilangan kepala selama masih ada yang tinggal.
    if (
      target.role === "KEPALA_KELUARGA" &&
      row.members.filter((member) => isLive(member) && member !== target)
        .length > 0 &&
      !body.newHeadJemaatCode
    ) {
      return json(
        { status: 400, error: "Tentukan Kepala Keluarga Pengganti" },
        400,
      );
    }

    const close = (member: Member) => {
      member.endedAt = `${body.endedAt}T00:00:00.000Z`;
      member.endReason = body.endReason;
      member.endNote = body.endNote;
    };

    close(target);

    const partner = row.members.find(
      (member) =>
        isLive(member) &&
        member.role ===
          (target.role === "KEPALA_KELUARGA" ? "PASANGAN" : "KEPALA_KELUARGA"),
    );

    if (body.alsoEndPartner && partner) close(partner);

    for (const placement of body.childPlacements ?? []) {
      if (!placement.keluargaCode) continue;

      const child = row.members.find(
        (member) => member.jemaatCode === placement.jemaatCode,
      );

      if (child) close(child);
    }

    const nextHead = row.members.find(
      (member) => member.jemaatCode === body.newHeadJemaatCode,
    );

    if (nextHead && isLive(nextHead)) nextHead.role = "KEPALA_KELUARGA";

    return json({ status: 200, data: target });
  }

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
      code: keluargaCodeOf(id),
      name: "",
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

  const hostedOn = nextHostedDate(row.id);

  if (hostedOn) {
    return json(
      {
        status: 400,
        error: `Keluarga Masih Dijadwalkan Menjadi Tuan Rumah pada ${formatDate(hostedOn)}`,
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
