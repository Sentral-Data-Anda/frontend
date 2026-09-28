/**
 * Tiruan `/api/v1/jadwal-pelayan`, `/ddl/pelayan`, dan `/ddl/jadwal-pelayan`
 * (be-sada cabang `pelayanan-gaps`, bagian Pelayanan 03-api-contract). Mengubah
 * hanya `JADWAL_PELAYAN`; `makeTemplate` menambah satu baris `TEMPLATE_JADWAL`.
 *
 *   MOCK_EMPTY=1                         → daftar kosong (404)
 *   MOCK_500=1                           → daftar menjawab 500
 *   MOCK_JADWAL_PELAYAN_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 *   MOCK_JADWAL_CLAIM=1                  → Fransiska Halim (jemaat 6) "dibutuhkan oleh Komisi Musik"
 *   MOCK_JADWAL_INACTIVE=1               → Kevin (pelayan 10) dibaca nonaktif tanpa mengubah store
 *   MOCK_DDL_EMPTY=1                     → kedua ddl 404
 *
 * Batas: aturan jam/hari badan pelayanan be-sada tidak ditiru; hanya flag CLAIM di atas.
 */
import { MENU } from "../../../src/config/menu";
import { formatDate } from "../../../src/lib/format";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";
import {
  GROUP_PELAYAN,
  JADWAL_PELAYAN,
  MUSIK_SKILL,
  PELAYAN,
  ROLE_PELAYAN,
  TEMPLATE_JADWAL,
  bapelOf,
  isLive,
  jadwalCodeOf,
  jemaatOf,
  nextId,
  templateCodeOf,
  type GroupPelayanRow,
  type JadwalPelayanRow,
  type JadwalSlot,
  type PelayanRow,
} from "../pelayanan-store";

import { ibadahLinkedTo } from "./ibadah";

type Issue = { path: string; message: string };

type Window = { date: string; startTime: string; endTime: string };

const CLAIMED_JEMAAT = 6;
const CLAIMING_BAPEL = "Komisi Musik";
const INACTIVE_PELAYAN = 10;

const failure = (status: number, error: string, path?: string) =>
  json(
    path
      ? { status, error, issues: [{ path, message: error }] }
      : { status, error },
    status,
  );

const actionOf = (method: string): MockAction =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

const toIso = (date: string) =>
  date.length === 10 ? `${date}T00:00:00.000Z` : date;

const findPelayan = (id: number | null) =>
  PELAYAN.find((row) => row.id === id && isLive(row));

const findGroup = (id: number | null) =>
  GROUP_PELAYAN.find((row) => row.id === id && isLive(row));

const findRole = (id: number) =>
  ROLE_PELAYAN.find((row) => row.id === id && isLive(row));

const findSkill = (id: number | null) =>
  MUSIK_SKILL.find((row) => row.id === id && isLive(row));

const isPemusik = (roleId: number) =>
  findRole(roleId)?.name.trim().toLowerCase() === "pemusik";

const isPelayanActive = (row: PelayanRow) =>
  row.status &&
  !(process.env.MOCK_JADWAL_INACTIVE && row.id === INACTIVE_PELAYAN);

const nameOfJemaat = (id: number) => jemaatOf(id)?.name ?? `Jemaat ${id}`;

const bapelName = (id: number) => bapelOf(id)?.name ?? "";

const valueOf = (slot: JadwalSlot) => {
  if (slot.groupPelayanId) return `${slot.groupPelayanId}-G`;
  if (slot.pelayanId) return `${slot.pelayanId}-${slot.musikSkillId ?? "I"}`;

  return "";
};

const pelayanName = (row: PelayanRow, skillId: number | null) => {
  const skill = MUSIK_SKILL.find((item) => item.id === skillId);

  return `${nameOfJemaat(row.jemaatId)}${skill ? ` (${skill.name})` : ""}`;
};

const slotPelayanOf = (slot: JadwalSlot, jadwal: JadwalPelayanRow) => {
  const value = valueOf(slot);

  if (slot.groupPelayanId) {
    const group = GROUP_PELAYAN.find((row) => row.id === slot.groupPelayanId);

    return group
      ? {
          value,
          name: group.name,
          isGroup: true,
          isActive:
            isLive(group) &&
            group.status &&
            group.bapelId === jadwal.bapelId &&
            group.rolePelayanId === slot.rolePelayanId,
        }
      : null;
  }

  const pelayan = PELAYAN.find((row) => row.id === slot.pelayanId);

  return pelayan
    ? {
        value,
        name: pelayanName(pelayan, slot.musikSkillId),
        isGroup: false,
        isActive:
          isLive(pelayan) &&
          isPelayanActive(pelayan) &&
          pelayan.bapelId === jadwal.bapelId &&
          pelayan.roleIds.includes(slot.rolePelayanId),
      }
    : null;
};

const byOrder = (a: { order: number }, b: { order: number }) =>
  a.order - b.order;

const ibadahOf = (jadwal: JadwalPelayanRow) =>
  ibadahLinkedTo(jadwal.id).map((ibadah) => ({
    code: ibadah.code,
    date: toIso(ibadah.date),
    startTime: ibadah.startTime,
    typeIbadah: ibadah.typeIbadah,
  }));

const toListRow = (jadwal: JadwalPelayanRow) => ({
  code: jadwal.code,
  name: jadwal.name,
  date: toIso(jadwal.date),
  startTime: jadwal.startTime,
  endTime: jadwal.endTime,
  bapel: { name: bapelName(jadwal.bapelId) },
  detail: [...jadwal.detail].sort(byOrder).map((slot) => ({
    order: slot.order,
    role: findRole(slot.rolePelayanId)?.name ?? "",
    pelayan: slotPelayanOf(slot, jadwal)?.name ?? "",
  })),
  ibadah: ibadahOf(jadwal),
});

const toDetail = (jadwal: JadwalPelayanRow) => {
  const bapel = bapelOf(jadwal.bapelId);

  return {
    id: jadwal.id,
    publicId: `0000${jadwal.id}-jdl`,
    code: jadwal.code,
    name: jadwal.name,
    date: toIso(jadwal.date),
    startTime: jadwal.startTime,
    endTime: jadwal.endTime,
    bapel: {
      id: jadwal.bapelId,
      code: bapel?.code ?? "",
      name: bapel?.name ?? "",
    },
    detail: [...jadwal.detail].sort(byOrder).map((slot) => ({
      order: slot.order,
      rolePelayanId: String(slot.rolePelayanId),
      pelayanId: valueOf(slot),
      role: {
        id: slot.rolePelayanId,
        name:
          ROLE_PELAYAN.find((row) => row.id === slot.rolePelayanId)?.name ?? "",
      },
      pelayan: slotPelayanOf(slot, jadwal),
    })),
    ibadah: ibadahOf(jadwal),
  };
};

const findByCode = (code: string) =>
  JADWAL_PELAYAN.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

const isOverlapping = (a: Window, b: Window) =>
  a.date.slice(0, 10) === b.date.slice(0, 10) &&
  a.startTime < b.endTime &&
  a.endTime > b.startTime;

const jemaatIdsOf = (
  slot: Pick<JadwalSlot, "pelayanId" | "groupPelayanId">,
) => {
  if (slot.groupPelayanId)
    return findGroup(slot.groupPelayanId)?.memberIds ?? [];

  const pelayan = findPelayan(slot.pelayanId);

  return pelayan ? [pelayan.jemaatId] : [];
};

type Clash = {
  jadwal: JadwalPelayanRow;
  jemaatId: number | null;
  otherGroup: GroupPelayanRow | undefined;
};

const clashOf = (
  slot: Pick<JadwalSlot, "pelayanId" | "groupPelayanId">,
  window: Window,
  excludeCode: string,
): Clash | null => {
  const mine = jemaatIdsOf(slot);

  for (const jadwal of JADWAL_PELAYAN) {
    if (!isLive(jadwal)) continue;
    if (jadwal.code.toLowerCase() === excludeCode.toLowerCase()) continue;
    if (!isOverlapping(jadwal, window)) continue;

    for (const other of jadwal.detail) {
      const otherGroup = findGroup(other.groupPelayanId);

      if (slot.groupPelayanId && slot.groupPelayanId === other.groupPelayanId) {
        return { jadwal, jemaatId: null, otherGroup: undefined };
      }

      const shared = jemaatIdsOf(other).find((id) => mine.includes(id));

      if (shared !== undefined) return { jadwal, jemaatId: shared, otherGroup };
    }
  }

  return null;
};

const isClaimed = (slot: Pick<JadwalSlot, "pelayanId" | "groupPelayanId">) =>
  Boolean(process.env.MOCK_JADWAL_CLAIM) &&
  !slot.groupPelayanId &&
  findPelayan(slot.pelayanId)?.jemaatId === CLAIMED_JEMAAT;

const reasonOf = (
  slot: Pick<JadwalSlot, "pelayanId" | "groupPelayanId">,
  window: Window,
  excludeCode: string,
) => {
  const clash = clashOf(slot, window, excludeCode);

  if (clash) {
    return `Terjadwal di ${bapelName(clash.jadwal.bapelId)} ${clash.jadwal.startTime}–${clash.jadwal.endTime}`;
  }

  return isClaimed(slot) ? `Dibutuhkan ${CLAIMING_BAPEL}` : null;
};

const ddlPelayan = (url: URL) => {
  const params = url.searchParams;
  const roleId = Number(params.get("roleId"));
  const bapelId = Number(params.get("bapelId")) || null;
  const window = {
    date: params.get("date") ?? "",
    startTime: params.get("startTime") ?? "",
    endTime: params.get("endTime") ?? "",
  };
  const excludeCode = params.get("excludeCode") ?? "";
  const isWindowed = Boolean(window.date && window.startTime && window.endTime);

  const serve = (slot: Pick<JadwalSlot, "pelayanId" | "groupPelayanId">) => {
    const reason = isWindowed ? reasonOf(slot, window, excludeCode) : null;

    return { disableServe: reason !== null, unavailableReason: reason };
  };

  const people = PELAYAN.filter(
    (row) =>
      isLive(row) &&
      isPelayanActive(row) &&
      (bapelId === null || row.bapelId === bapelId) &&
      row.roleIds.includes(roleId),
  ).flatMap((row) => {
    const skills = isPemusik(roleId)
      ? row.skillIds.filter((id) => findSkill(id))
      : [];
    const base = {
      typePelayan: "INDIVIDUAL",
      bapelName: bapelName(row.bapelId),
      jemaatId: String(row.jemaatId),
      ...serve({ pelayanId: row.id, groupPelayanId: null }),
    };

    return skills.length
      ? skills.map((skillId) => ({
          ...base,
          code: `${row.id}-${skillId}`,
          name: pelayanName(row, skillId),
        }))
      : [{ ...base, code: `${row.id}-I`, name: pelayanName(row, null) }];
  });

  const groups = GROUP_PELAYAN.filter(
    (row) =>
      isLive(row) &&
      row.status &&
      (bapelId === null || row.bapelId === bapelId) &&
      row.rolePelayanId === roleId,
  ).map((row) => ({
    typePelayan: "GROUP",
    code: `${row.id}-G`,
    name: row.name,
    bapelName: bapelName(row.bapelId),
    ...serve({ pelayanId: null, groupPelayanId: row.id }),
  }));

  const rows = process.env.MOCK_DDL_EMPTY ? [] : [...people, ...groups];

  return rows.length
    ? json({ status: 200, message: "Berhasil Mendapatkan Pelayan", data: rows })
    : failure(404, "Pelayan Tidak Ditemukan");
};

const ddlJadwal = (url: URL) => {
  const date = url.searchParams.get("date") ?? "";
  const rows = process.env.MOCK_DDL_EMPTY
    ? []
    : JADWAL_PELAYAN.filter(
        (row) => isLive(row) && row.date.slice(0, 10) === date,
      )
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map(({ id, code, name, date, startTime, endTime }) => ({
          id,
          code,
          name,
          date: toIso(date),
          startTime,
          endTime,
        }));

  return rows.length
    ? json({
        status: 200,
        message: "Berhasil Mendapatkan Jadwal Pelayan",
        data: rows,
      })
    : failure(404, "Jadwal Pelayan Tidak Ditemukan");
};

const listRows = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const month = params.get("month") ?? "";
  const bapelId = Number(params.get("bapelId")) || null;

  return JADWAL_PELAYAN.filter(isLive)
    .filter((row) => !month || row.date.startsWith(month))
    .filter((row) => bapelId === null || row.bapelId === bapelId)
    .filter(
      (row) =>
        !filter ||
        row.code.toLowerCase().includes(filter) ||
        row.name.toLowerCase().includes(filter),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
    )
    .map(toListRow);
};

type SlotInput = {
  order: number;
  rolePelayanId: number;
  pelayanId: number | null;
  musikSkillId: number | null;
  groupPelayanId: number | null;
};

type JadwalInput = Window & {
  bapelId: number;
  name: string;
  makeTemplate: boolean;
  detail: SlotInput[];
};

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

const idOf = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;

const timeIssue = (
  value: unknown,
  path: string,
  label: string,
): Issue | null => {
  if (typeof value !== "string" || !value) {
    return { path, message: `Mohon Lengkapi ${label}` };
  }

  return HH_MM.test(value)
    ? null
    : { path, message: `Format ${label} harus HH:mm (contoh: 07:00)` };
};

const parseInput = (
  body: Record<string, unknown>,
): { input: JadwalInput } | { issues: Issue[] } => {
  const issues: Issue[] = [];
  const name =
    typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const date = typeof body.date === "string" ? body.date : "";
  const detail = Array.isArray(body.detail) ? body.detail : [];

  if (!idOf(body.bapelId)) {
    issues.push({ path: "bapelId", message: "Mohon lengkapi Bapel ID" });
  }
  if (!date) issues.push({ path: "date", message: "Mohon Lengkapi Tanggal" });
  if (!name) {
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Jadwal" });
  } else if (name.length < 4 || name.length > 50) {
    issues.push({
      path: "name",
      message:
        name.length < 4
          ? "Nama Jadwal harus memiliki setidaknya 4 karakter"
          : "Nama Jadwal tidak boleh lebih dari 50 karakter",
    });
  }

  const start = timeIssue(body.startTime, "startTime", "Jam Mulai");
  const end = timeIssue(body.endTime, "endTime", "Jam Selesai");

  if (start) issues.push(start);
  if (end) issues.push(end);
  if (!start && !end && String(body.endTime) <= String(body.startTime)) {
    issues.push({
      path: "endTime",
      message: "Jam Selesai harus setelah Jam Mulai Jadwal",
    });
  }
  if (detail.length === 0) {
    issues.push({ path: "detail", message: "Minimal satu dalam Jadwal" });
  }

  const slots = detail.map((raw, index) => {
    const slot = (raw ?? {}) as Record<string, unknown>;
    const parsed: SlotInput = {
      order: Number(slot.order) || index + 1,
      rolePelayanId: idOf(slot.rolePelayanId) ?? 0,
      pelayanId: idOf(slot.pelayanId),
      musikSkillId: idOf(slot.musikSkillId),
      groupPelayanId: idOf(slot.groupPelayanId),
    };

    if (!parsed.rolePelayanId) {
      issues.push({
        path: `detail.${index}.rolePelayanId`,
        message: "Role Pelayan wajib diisi",
      });
    }
    if (parsed.pelayanId && parsed.groupPelayanId) {
      issues.push({
        path: `detail.${index}.groupPelayanId`,
        message: "Pilih Pelayan atau Group Pelayan, Tidak Keduanya",
      });
    }
    if (parsed.musikSkillId && !parsed.pelayanId) {
      issues.push({
        path: `detail.${index}.musikSkillId`,
        message: "Skill Musik Hanya Dapat Dipilih Bersama Pelayan Perorangan",
      });
    }

    return parsed;
  });

  if (issues.length) return { issues };

  return {
    input: {
      bapelId: Number(body.bapelId),
      date: date.slice(0, 10),
      name,
      startTime: String(body.startTime),
      endTime: String(body.endTime),
      makeTemplate: body.makeTemplate === true,
      detail: slots,
    },
  };
};

const isSameSlot = (a: SlotInput, b: JadwalSlot) =>
  a.rolePelayanId === b.rolePelayanId &&
  a.pelayanId === b.pelayanId &&
  a.musikSkillId === b.musikSkillId &&
  a.groupPelayanId === b.groupPelayanId;

const slotRuleError = (
  slot: SlotInput,
  index: number,
  bapelId: number,
): Response | null => {
  const at = (field: string) => `detail.${index}.${field}`;
  const role = findRole(slot.rolePelayanId);
  const bapel = bapelName(bapelId);

  if (!role) {
    return failure(
      404,
      `Role Pelayan ${slot.rolePelayanId} Tidak Ditemukan`,
      at("rolePelayanId"),
    );
  }

  if (slot.pelayanId) {
    const pelayan = findPelayan(slot.pelayanId);

    if (!pelayan) {
      return failure(
        404,
        `Pelayan ${slot.pelayanId} Tidak Ditemukan`,
        at("pelayanId"),
      );
    }

    const name = nameOfJemaat(pelayan.jemaatId);

    if (!isPelayanActive(pelayan)) {
      return failure(400, `${name} Sedang Nonaktif Sebagai Pelayan`);
    }
    if (pelayan.bapelId !== bapelId) {
      return failure(
        400,
        `${name} Tidak Terdaftar Sebagai Pelayan di ${bapel}`,
      );
    }
    if (!pelayan.roleIds.includes(role.id)) {
      return failure(400, `${name} Tidak Memegang Role ${role.name}`);
    }
    if (slot.musikSkillId) {
      const skill = findSkill(slot.musikSkillId);

      if (!skill) {
        return failure(
          404,
          `Skill Musik ${slot.musikSkillId} Tidak Ditemukan`,
          at("musikSkillId"),
        );
      }
      if (!isPemusik(role.id)) {
        return failure(
          400,
          "Skill Musik Hanya Dapat Dipilih untuk Role Pemusik",
          at("musikSkillId"),
        );
      }
      if (!pelayan.skillIds.includes(skill.id)) {
        return failure(
          400,
          `${name} Tidak Memiliki Skill Musik ${skill.name}`,
          at("musikSkillId"),
        );
      }
    }
  }

  if (slot.groupPelayanId) {
    const group = findGroup(slot.groupPelayanId);

    if (!group) {
      return failure(
        404,
        `Group Pelayan ${slot.groupPelayanId} Tidak Ditemukan`,
        at("groupPelayanId"),
      );
    }
    if (!group.status) {
      return failure(400, `${group.name} Sedang Nonaktif Sebagai Pelayan`);
    }
    if (group.bapelId !== bapelId) {
      return failure(
        400,
        `${group.name} Tidak Terdaftar Sebagai Pelayan di ${bapel}`,
      );
    }
    if (group.rolePelayanId !== role.id) {
      return failure(400, `${group.name} Tidak Memegang Role ${role.name}`);
    }
  }

  return null;
};

const duplicateError = (slots: SlotInput[]): Response | null => {
  const seenGroups = new Set<number>();
  const seenJemaat = new Map<number, GroupPelayanRow | undefined>();

  for (const [index, slot] of slots.entries()) {
    const group = findGroup(slot.groupPelayanId);
    const field = `detail.${index}.${group ? "groupPelayanId" : "pelayanId"}`;

    if (group && seenGroups.has(group.id)) {
      return failure(
        409,
        `${group.name} Dipilih Lebih dari Satu Kali pada Jadwal Ini`,
        field,
      );
    }
    if (group) seenGroups.add(group.id);

    for (const jemaatId of jemaatIdsOf(slot)) {
      if (seenJemaat.has(jemaatId)) {
        const via = [seenJemaat.get(jemaatId), group]
          .filter(Boolean)
          .map((item) => item?.name);

        return failure(
          409,
          `${nameOfJemaat(jemaatId)} Dipilih Lebih dari Satu Kali pada Jadwal Ini${via.length ? ` Melalui ${via.join(" dan ")}` : ""}`,
          field,
        );
      }
      seenJemaat.set(jemaatId, group);
    }
  }

  return null;
};

const clashMessage = (slot: SlotInput, clash: Clash) => {
  const group = findGroup(slot.groupPelayanId);
  const who = !group
    ? nameOfJemaat(clash.jemaatId ?? 0)
    : clash.jemaatId === null
      ? group.name
      : `${nameOfJemaat(clash.jemaatId)} (Anggota ${group.name})`;
  const together =
    clash.otherGroup && clash.otherGroup.id !== group?.id
      ? ` Bersama ${clash.otherGroup.name}`
      : "";

  return `${who} sudah terjadwal di ${bapelName(clash.jadwal.bapelId)}${together} pada ${formatDate(toIso(clash.jadwal.date))} pukul ${clash.jadwal.startTime} - ${clash.jadwal.endTime}. Silakan pilih tanggal atau jam lain`;
};

const scheduleCovers = (
  schedule: Window,
  ibadah: { date: string; startTime: string; endTime: string | null },
) =>
  schedule.date.slice(0, 10) === ibadah.date.slice(0, 10) &&
  schedule.startTime <= (ibadah.endTime ?? ibadah.startTime) &&
  schedule.endTime > ibadah.startTime;

const ibadahNote = (ibadah: { code: string; date: string }) =>
  `${formatDate(toIso(ibadah.date))}, ${ibadah.code}`;

const onSave = async (
  request: Request,
  current: JadwalPelayanRow | undefined,
  code: string | null,
) => {
  const parsed = parseInput(await readBody<Record<string, unknown>>(request));

  if ("issues" in parsed) {
    return json(
      { status: 400, error: parsed.issues[0].message, issues: parsed.issues },
      400,
    );
  }

  const { input } = parsed;

  if (code !== null && !current) {
    return failure(404, "Jadwal Pelayan Tidak Ditemukan");
  }
  if (!bapelOf(input.bapelId)) {
    return failure(404, "Bapel Tidak Ditemukan", "bapelId");
  }

  if (current) {
    const isMoved =
      current.date !== input.date ||
      current.startTime !== input.startTime ||
      current.endTime !== input.endTime;
    const lost = isMoved
      ? ibadahLinkedTo(current.id).find(
          (ibadah) => !scheduleCovers(input, ibadah),
        )
      : undefined;

    if (lost) {
      return failure(
        400,
        `Jadwal Pelayan Tidak Lagi Sesuai Dengan Ibadah yang Ditautkan (${ibadahNote(lost)})`,
        "date",
      );
    }
  }

  for (const [index, slot] of input.detail.entries()) {
    const isKept =
      current !== undefined &&
      current.bapelId === input.bapelId &&
      current.detail.some((saved) => isSameSlot(slot, saved));
    const error = isKept ? null : slotRuleError(slot, index, input.bapelId);

    if (error) return error;
  }

  const duplicate = duplicateError(input.detail);

  if (duplicate) return duplicate;

  for (const slot of input.detail) {
    const clash = clashOf(slot, input, current?.code ?? "");

    if (clash) return failure(409, clashMessage(slot, clash));
  }

  const claimed = input.detail.find(isClaimed);

  if (claimed) {
    return failure(
      409,
      `${nameOfJemaat(CLAIMED_JEMAAT)} sudah dibutuhkan oleh ${CLAIMING_BAPEL} pada tanggal atau jam tersebut. Silakan pilih pelayan, tanggal atau jam lain`,
    );
  }

  if (!current && input.makeTemplate) {
    const isTaken = TEMPLATE_JADWAL.some(
      (row) =>
        isLive(row) && row.name.toLowerCase() === input.name.toLowerCase(),
    );

    if (isTaken) return failure(409, "Nama Template Sudah Tersedia", "name");

    TEMPLATE_JADWAL.push({
      id: nextId(TEMPLATE_JADWAL),
      code: templateCodeOf(input.bapelId),
      name: input.name,
      bapelId: input.bapelId,
      startTime: input.startTime,
      endTime: input.endTime,
      detail: input.detail.map((slot, index) => ({
        order: index + 1,
        rolePelayanId: slot.rolePelayanId,
      })),
      deletedAt: null,
    });
  }

  const fields = {
    name: input.name,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    bapelId: input.bapelId,
    detail: input.detail.map((slot, index) => ({ ...slot, order: index + 1 })),
  };

  if (current) {
    Object.assign(current, fields);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Jadwal Pelayan",
      data: current,
    });
  }

  const row: JadwalPelayanRow = {
    id: nextId(JADWAL_PELAYAN),
    code: jadwalCodeOf(input.bapelId, input.date),
    deletedAt: null,
    ...fields,
  };

  JADWAL_PELAYAN.push(row);

  return json(
    { status: 201, message: "Berhasil Membuat Jadwal Pelayan", data: row },
    201,
  );
};

const onDelete = (current: JadwalPelayanRow | undefined) => {
  if (!current) return failure(404, "Jadwal Pelayan Tidak Ditemukan");

  const linked = ibadahLinkedTo(current.id)[0];

  if (linked) {
    return failure(
      400,
      `Jadwal Pelayan Tidak Dapat Dihapus Karena Masih Ditautkan ke Ibadah ${formatDate(toIso(linked.date))} (${linked.code})`,
    );
  }

  current.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: "Berhasil Menghapus Jadwal Pelayan",
    data: current,
  });
};

export const jadwalPelayanMock: MockHandler = ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/ddl/pelayan" && method === "GET") {
    const isAllowed =
      can(MENU.DAFTAR_PELAYAN, "VIEW") || can(MENU.JADWAL_PELAYAN, "VIEW");

    return isAllowed ? ddlPelayan(url) : denied();
  }
  if (path === "/ddl/jadwal-pelayan" && method === "GET") {
    const isAllowed =
      can(MENU.JADWAL_PELAYAN, "VIEW") || can(MENU.IBADAH, "VIEW");

    return isAllowed ? ddlJadwal(url) : denied();
  }
  if (path !== "/jadwal-pelayan" && !path.startsWith("/jadwal-pelayan/")) {
    return null;
  }
  if (!can(MENU.JADWAL_PELAYAN, actionOf(method))) return denied();
  if (
    method !== "GET" &&
    process.env.MOCK_JADWAL_PELAYAN_SAVE_ERROR === "500"
  ) {
    return failure(500, "Kesalahan server.");
  }

  const code = decodeURIComponent(path.slice("/jadwal-pelayan/".length));

  if (path === "/jadwal-pelayan") {
    if (method === "POST") return onSave(request, undefined, null);
    if (method !== "GET") return null;
    if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

    const month = url.searchParams.get("month");

    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return failure(
        400,
        "Format Bulan harus YYYY-MM (contoh: 2026-10)",
        "month",
      );
    }

    return list(
      listRows(url.searchParams),
      url,
      "Jadwal Pelayan",
      "Jadwal Pelayan",
    );
  }

  const current = findByCode(code);

  if (method === "GET") {
    return current
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Jadwal Pelayan",
          data: toDetail(current),
        })
      : failure(404, "Jadwal Pelayan Tidak Ditemukan");
  }
  if (method === "PUT") return onSave(request, current, code);
  if (method === "DELETE") return onDelete(current);

  return null;
};
