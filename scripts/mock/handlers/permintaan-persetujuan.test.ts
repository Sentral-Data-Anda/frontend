import { describe, expect, test } from "bun:test";

import { createPermintaanPersetujuanMock } from "./permintaan-persetujuan";

const pid = (n: number) =>
  `0b5e7a00-0000-4000-a000-${String(n).padStart(12, "0")}`;

const onCall = async (path: string, method = "GET", body?: unknown) => {
  const handler = createPermintaanPersetujuanMock({
    roleUserId: 5,
    positions: [{ name: "Ketua", bapelId: 1 }],
    jemaatName: "Pdt. Yohanes Simatupang",
  });
  const url = new URL(`http://mock.test/api/v1${path}`);
  const response = await handler({
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    path: url.pathname.replace(/^\/api\/v1/, ""),
    method,
    can: () => true,
    isAdmin: false,
    sessionCode: "test",
  });

  if (!response) throw new Error(`tanpa jawaban: ${method} ${path}`);

  return { status: response.status, body: await response.json() };
};

describe("mock permintaan persetujuan (majelis)", () => {
  test("tolak: alasan divalidasi sebelum guard mesin", async () => {
    const finished = await onCall(`/persetujuan/${pid(17)}/tolak`, "PUT", {
      note: "  ",
    });
    const missing = await onCall(`/persetujuan/${pid(999)}/tolak`, "PUT", {});

    for (const result of [finished, missing]) {
      expect(result.status).toBe(400);
      expect(result.body).toEqual({
        status: 400,
        error: "Mohon Lengkapi Alasan Penolakan",
        issues: [{ path: "note", message: "Mohon Lengkapi Alasan Penolakan" }],
      });
    }
  });

  test("antrean tidak memuat pengajuan sendiri (P6)", async () => {
    const queue = await onCall("/persetujuan?menunggu=saya&limit=100");
    const codes = queue.body.data.map((row: { code: string }) => row.code);

    expect(codes).toContain("PST-2026-0001");
    expect(codes).not.toContain("PST-2026-0007");
  });

  test("pengajuan sendiri di tahap role saya: canSign false, canWithdraw true", async () => {
    const own = await onCall(`/persetujuan/${pid(7)}`);

    expect(own.body.data.canSign).toBe(false);
    expect(own.body.data.canWithdraw).toBe(true);

    const approve = await onCall(`/persetujuan/${pid(7)}/setujui`, "PUT");

    expect(approve.status).toBe(403);
    expect(approve.body.error).toBe(
      "Pengaju Tidak Dapat Menyetujui Permintaannya Sendiri",
    );
  });
});
