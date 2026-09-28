/**
 * Tiruan `GET /jadwal-pelayan/saya` (Beranda "Tugas saya"): tanpa guard menu,
 * subjek = jemaat persona, rentang hari ini s.d. +28 hari. Hanya membaca store.
 *
 *   MOCK_TUGAS_SAYA_500=1 atau MOCK_500=1 → 500
 */
import { addDays, todayJakarta } from "../../../src/lib/date";
import { currentPersona, DDL_JEMAAT } from "../../mock-dashboard";
import { json, type MockHandler } from "../kit";
import {
  bapelOf,
  GROUP_PELAYAN,
  JADWAL_PELAYAN,
  MUSIK_SKILL,
  PELAYAN,
  ROLE_PELAYAN,
} from "../pelayanan-store";

import { ibadahLinkedTo } from "./ibadah";

const nameOf = (rows: { id: number; name: string }[], id: number | null) => {
  const row = rows.find((item) => item.id === id);

  return row ? { name: row.name } : null;
};

export const tasksOf = (jemaatName: string, today = todayJakarta()) => {
  const jemaat = DDL_JEMAAT.find((row) => row.name === jemaatName);

  if (!jemaat) return [];

  const pelayanIds = PELAYAN.filter((row) => row.jemaatId === jemaat.id).map(
    (row) => row.id,
  );
  const groupIds = GROUP_PELAYAN.filter((row) =>
    row.memberIds.includes(jemaat.id),
  ).map((row) => row.id);
  const end = addDays(today, 28);

  return JADWAL_PELAYAN.filter(
    (row) => row.deletedAt === null && row.date >= today && row.date <= end,
  )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
    .flatMap((row) =>
      [...row.detail]
        .sort((a, b) => a.order - b.order)
        .filter(
          (slot) =>
            (slot.pelayanId !== null && pelayanIds.includes(slot.pelayanId)) ||
            (slot.groupPelayanId !== null &&
              groupIds.includes(slot.groupPelayanId)),
        )
        .map((slot) => ({
          date: `${row.date}T00:00:00.000Z`,
          startTime: row.startTime,
          endTime: row.endTime,
          jadwal: { code: row.code, name: row.name },
          bapel: { name: bapelOf(row.bapelId)?.name ?? "" },
          role: { name: nameOf(ROLE_PELAYAN, slot.rolePelayanId)?.name ?? "" },
          musikSkill: nameOf(MUSIK_SKILL, slot.musikSkillId),
          group: nameOf(GROUP_PELAYAN, slot.groupPelayanId),
          ibadah: ibadahLinkedTo(row.id),
        })),
    );
};

export const jadwalSayaMock: MockHandler = ({ path, method }) => {
  if (path !== "/jadwal-pelayan/saya" || method !== "GET") return null;

  if (process.env.MOCK_TUGAS_SAYA_500 || process.env.MOCK_500) {
    return json({ status: 500, error: "Terjadi kesalahan pada server" }, 500);
  }

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Jadwal Pelayanan Anda",
    data: tasksOf(currentPersona().jemaatName),
  });
};
