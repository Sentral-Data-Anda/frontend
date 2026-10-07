import { describe, expect, test } from "bun:test";

import { ibadahMock } from "./ibadah";
import { wilayahMock } from "./wilayah";

const onCall = async (
  handler: typeof ibadahMock,
  method: string,
  input: string,
  body?: unknown,
) => {
  const url = new URL(input, "http://mock.test");
  const response = (await handler({
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    path: url.pathname,
    method,
    can: () => true,
    isAdmin: true,
    sessionCode: "test",
  })) as Response;

  return {
    status: response.status,
    body: (await response.json()) as {
      error?: string;
      data?: { zoneChurch: { id: number } | null; id: number; code: string }[];
    },
  };
};

const codeOf = (id: number) => `ZC-${String(id).padStart(4, "0")}`;

const listed = async () =>
  (
    await onCall(
      ibadahMock,
      "GET",
      "/ibadah?limit=100&startDate=2000-01-01&endDate=2100-01-01",
    )
  ).body.data ?? [];

describe("DELETE /zone-church/:code dengan ibadah yang memakai wilayahnya", () => {
  test("setiap wilayah yang dipakai ibadah hidup ditolak 400 menyebut Ibadah", async () => {
    const usedIds = [
      ...new Set(
        (await listed()).flatMap((row) =>
          row.zoneChurch ? [row.zoneChurch.id] : [],
        ),
      ),
    ].sort();

    // Penjaga hanya berarti bila ada yang dijaga, dan lebih dari satu wilayah.
    expect(usedIds.length).toBeGreaterThan(1);

    const refused: Record<number, string> = {};

    for (const id of usedIds) {
      const result = await onCall(
        wilayahMock,
        "DELETE",
        `/zone-church/${codeOf(id)}`,
      );

      expect(result.status).toBe(400);
      refused[id] = result.body.error ?? "";
    }

    for (const id of usedIds) {
      expect(refused[id]).toContain("Ibadah");
    }
  });

  test("wilayah tanpa pemakai tetap bisa dihapus", async () => {
    // Kontrol negatif: tanpa ini, test di atas tak membuktikan penjaganya
    // membedakan wilayah yang dipakai dari yang tidak. Wilayah baru, supaya
    // state bersama modul tidak dirusak untuk berkas test lain.
    const created = await onCall(wilayahMock, "POST", "/zone-church", {
      name: "Wilayah Kontrol",
    });

    expect(created.status).toBe(201);

    const result = await onCall(
      wilayahMock,
      "DELETE",
      `/zone-church/${(created.body.data as unknown as { code: string }).code}`,
    );

    expect(result.status).toBe(200);
  });
});
