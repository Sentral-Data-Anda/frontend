import { describe, expect, test } from "bun:test";

import type { MockAction } from "../kit";
import {
  GROUP_PELAYAN,
  JADWAL_PELAYAN,
  PELAYAN,
  TEMPLATE_JADWAL,
} from "../pelayanan-store";

import { pelayananDdlMock } from "./pelayanan-ddl";

const onCall = async (
  input: string,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const response = (await pelayananDdlMock({
    request: new Request(url),
    url,
    path: url.pathname,
    method: "GET",
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return {
    status: response.status,
    body: (await response.json()) as { error?: string; data: unknown[] },
  };
};

const only =
  (...menus: string[]) =>
  (slug: string) =>
    menus.includes(slug);

describe("ddl Pelayanan milik TL", () => {
  test("role-pelayan: urut nama, { id, name }; DAFTAR_PELAYAN saja cukup (B1)", async () => {
    const { status, body } = await onCall(
      "/ddl/role-pelayan",
      only("DAFTAR_PELAYAN"),
    );

    expect(status).toBe(200);
    expect(body.data[0]).toEqual({ id: 7, name: "Kolektan" });
    expect(body.data).toHaveLength(7);
  });

  test("template-jadwal: bentuk B2, detail urut order, saring bapelId", async () => {
    const { body } = await onCall(
      "/ddl/template-jadwal?bapelId=2",
      only("JADWAL_PELAYAN"),
    );

    expect(body.data).toEqual([
      {
        id: 2,
        code: "TMP_JDL_0002-0001",
        name: "Ibadah Pemuda",
        startTime: "17:00",
        endTime: "19:00",
        detail: [
          { order: 1, rolePelayanId: 3 },
          { order: 2, rolePelayanId: 2 },
          { order: 3, rolePelayanId: 5 },
        ],
      },
    ]);
  });

  test("tanpa menu yang menjaga: 403; path lain: null", async () => {
    expect(
      (await onCall("/ddl/template-jadwal", only("DAFTAR_PELAYAN"))).status,
    ).toBe(403);
    expect(
      await pelayananDdlMock({
        request: new Request("http://mock.test/ddl/pelayan"),
        url: new URL("http://mock.test/ddl/pelayan"),
        path: "/ddl/pelayan",
        method: "GET",
        can: () => true,
        isAdmin: true,
        sessionCode: "test",
      }),
    ).toBeNull();
  });
});

describe("seed store mematuhi aturan simpan be-sada (R3)", () => {
  test("setiap slot: bapel sama, tugas dipegang, alat milik pelayan, pelayan aktif", () => {
    for (const jadwal of JADWAL_PELAYAN) {
      for (const slot of jadwal.detail) {
        const pelayan = PELAYAN.find((row) => row.id === slot.pelayanId);
        const group = GROUP_PELAYAN.find(
          (row) => row.id === slot.groupPelayanId,
        );

        if (pelayan) {
          expect(pelayan.bapelId).toBe(jadwal.bapelId);
          expect(pelayan.status).toBe(true);
          expect(pelayan.roleIds).toContain(slot.rolePelayanId);
          if (slot.musikSkillId)
            expect(pelayan.skillIds).toContain(slot.musikSkillId);
        }
        if (group) {
          expect(group.bapelId).toBe(jadwal.bapelId);
          expect(group.rolePelayanId).toBe(slot.rolePelayanId);
        }
      }
    }
  });

  test("aturan 6: tidak ada jemaat dua kali dalam satu jadwal, perorangan maupun lewat kelompok", () => {
    for (const jadwal of JADWAL_PELAYAN) {
      const jemaatIds = jadwal.detail.flatMap((slot) => [
        ...PELAYAN.filter((row) => row.id === slot.pelayanId).map(
          (row) => row.jemaatId,
        ),
        ...(GROUP_PELAYAN.find((row) => row.id === slot.groupPelayanId)
          ?.memberIds ?? []),
      ]);

      expect(new Set(jemaatIds).size).toBe(jemaatIds.length);
    }
  });

  test("template memakai tugas yang ada; Debora (pelayan 4) tidak terjadwal", () => {
    expect(TEMPLATE_JADWAL.every((row) => row.detail.length > 0)).toBe(true);
    expect(
      JADWAL_PELAYAN.some((row) =>
        row.detail.some((slot) => slot.pelayanId === 4),
      ),
    ).toBe(false);
  });
});
