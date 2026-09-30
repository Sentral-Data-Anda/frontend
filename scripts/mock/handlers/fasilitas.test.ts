import { describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { addDays } from "../../../src/lib/date";
import {
  clashesOf,
  clashMessage,
  LOAN,
  loanCodeOf,
  loanView,
  occupancyOf,
  ROOM,
  roomUsageOf,
  TODAY,
  upcomingCountsOf,
} from "../fasilitas-store";
import { EVENT, eventView } from "../kegiatan-store";

import { fasilitasMock } from "./fasilitas";
import { ibadahInRoom } from "./ibadah";

const call = async (path: string, grants: MenuSlug[]) => {
  const url = new URL(path, "http://mock.test");
  const response = await fasilitasMock({
    request: new Request(url),
    url,
    path: url.pathname,
    method: "GET",
    can: (slug) => grants.includes(slug),
    isAdmin: false,
    sessionCode: "test",
  });

  return response!;
};

describe("GET /ddl/room", () => {
  test("ruang hidup + isActive, urut nama; terhapus tidak ikut", async () => {
    const response = await call("/ddl/room", [MENU.IBADAH]);
    const body = await response.json();
    const names = body.data.map((row: { name: string }) => row.name);

    expect(response.status).toBe(200);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names).not.toContain("Perpustakaan");
    expect(
      body.data.find(
        (row: { name: string }) => row.name === "Kelas Sekolah Minggu",
      ),
    ).toMatchObject({ isActive: false });
  });

  test("tanpa menu pemakai = 403", async () => {
    expect((await call("/ddl/room", [MENU.PENGUMUMAN])).status).toBe(403);
  });
});

describe("bentrok", () => {
  const aula = 2;
  const tomorrow = addDays(TODAY, 1);

  test("setengah terbuka: bersebelahan tidak bentrok", () => {
    expect(
      clashesOf({
        roomId: aula,
        date: tomorrow,
        startTime: "14:00",
        endTime: "16:00",
      }),
    ).toEqual([]);
    expect(
      clashesOf({
        roomId: aula,
        date: tomorrow,
        startTime: "11:00",
        endTime: "13:00",
      }).map((item) => item.name),
    ).toEqual(["Rapat pengurus Komisi Wanita", "Kelas katekisasi"]);
  });

  test("peminjaman terhapus membebaskan jam; dirinya sendiri dikecualikan", () => {
    expect(
      clashesOf({
        roomId: aula,
        date: tomorrow,
        startTime: "15:00",
        endTime: "17:00",
      }),
    ).toEqual([]);

    const own = LOAN.find((row) => row.purpose === "Kelas katekisasi")!;

    expect(
      clashesOf({
        roomId: aula,
        date: tomorrow,
        startTime: "12:00",
        endTime: "14:00",
        excludeCode: own.code.toLowerCase(),
      }),
    ).toEqual([]);
  });

  test("event dan ibadah di ruang yang sama ikut bentrok", () => {
    const rapat = EVENT.find((row) => row.name === "Rapat Majelis")!;
    const [eventClash] = clashesOf({
      roomId: 1,
      date: rapat.startDate,
      startTime: "20:00",
      endTime: "22:00",
    }).filter((item) => item.kind === "EVENT");

    expect(clashMessage(eventClash)).toBe(
      "Ruang Sudah Dipakai Event Rapat Majelis Pukul 19.00–21.00",
    );

    const [ibadah] = ibadahInRoom(1, TODAY, TODAY);
    const kinds = clashesOf({
      roomId: 1,
      date: TODAY,
      startTime: ibadah.startTime,
      endTime: "23:00",
    }).map((item) => item.kind);

    expect(kinds).toContain("IBADAH");
  });

  test("ibadah tanpa jam selesai dianggap 2 jam", () => {
    // Mulai dari besok, bukan hari ini: seed ibadah menimpa HARI INI dengan
    // dua ibadah Minggu, jadi jendela yang memuat hari ini kehilangan satu
    // hari dalam sepekan — pas hari itu yang dicari.
    const open = [...Array(7).keys()]
      .map((offset) => addDays(TODAY, offset + 1))
      .flatMap((date) => ibadahInRoom(3, date, date))
      .find((row) => row.endTime === null)!;
    const item = occupancyOf(3, open.date).find(
      (row) => row.kind === "IBADAH",
    )!;

    expect(item.startTime).toBe("18:00");
    expect(item.endTime).toBe("20:00");
  });
});

describe("store", () => {
  test("ROOM adalah ROOM_ROWS yang diperluas, event tetap menjawab id/kode/nama", () => {
    expect(ROOM.find((row) => row.id === 1)).toMatchObject({
      code: "RM-0001",
      capacity: 400,
      isActive: true,
    });

    const rapat = EVENT.find((row) => row.name === "Rapat Majelis")!;

    expect(eventView(rapat).room).toEqual({
      id: 1,
      code: "RM-0001",
      name: "Gedung Gereja",
    });
  });

  test("kode peminjaman berurutan per ruang + badan pelayanan per tahun", () => {
    const year = TODAY.slice(0, 4);

    expect(loanCodeOf(2, 5, year)).toMatch(
      new RegExp(`^LR_0002_0005-${year}-\\d{4}$`),
    );
    expect(loanCodeOf(1, null, "2099")).toBe("LR_0001_0000-2099-0001");
  });

  test("detail membawa id relasi", () => {
    const view = loanView(LOAN[2], true);

    expect(view.room).toHaveProperty("id");
    expect(view.jemaat).toHaveProperty("id");
  });

  test("Konsistori punya peminjaman mendatang; pemakaian 30 hari urut", () => {
    expect(upcomingCountsOf(4, TODAY).loans).toBeGreaterThan(0);

    const usage = roomUsageOf(2, TODAY, 30);
    const keys = usage.map((row) => `${row.date}${row.startTime}`);

    expect(keys).toEqual([...keys].sort());
    expect(usage.some((row) => row.kind === "EVENT")).toBe(true);
    expect(usage.every((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date))).toBe(
      true,
    );
  });

  test("event beberapa hari menerus: hari pertama dari jam mulai, tengah penuh, terakhir sampai jam selesai", () => {
    const event = EVENT.find((row) => row.name === "Sekolah Minggu Kreatif")!;
    const slotOn = (date: string) =>
      occupancyOf(event.roomId!, date).find((row) => row.code === event.code);

    expect(slotOn(event.startDate)).toMatchObject({
      startTime: "09:00",
      endTime: "23:59",
    });
    expect(slotOn(addDays(event.startDate, 1))).toMatchObject({
      startTime: "00:00",
      endTime: "23:59",
    });
    expect(slotOn(event.endDate)).toMatchObject({
      startTime: "00:00",
      endTime: "12:00",
    });
  });

  test("pesan bentrok tidak mengulang jenis yang sudah ada di nama", () => {
    expect(
      clashMessage({
        kind: "IBADAH",
        code: "IBD-1",
        name: "Ibadah Minggu I",
        startTime: "08:00",
        endTime: "09:30",
        bapel: null,
      }),
    ).toBe("Ruang Sudah Dipakai Ibadah Minggu I Pukul 08.00–09.30");
    expect(
      clashMessage({
        kind: "IBADAH",
        code: "IBD-2",
        name: "Persekutuan Doa",
        startTime: "19:00",
        endTime: "20:30",
        bapel: null,
      }),
    ).toBe("Ruang Sudah Dipakai Ibadah Persekutuan Doa Pukul 19.00–20.30");
  });
});
