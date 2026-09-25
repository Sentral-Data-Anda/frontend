import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let cookieHeader = "";

mock.module("next/headers", () => ({
  cookies: async () => ({
    toString: () => cookieHeader,
  }),
}));

let server: ReturnType<typeof Bun.serve>;
let getSession: typeof import("./get-session").getSession;

let lastCookie: string | null = null;
let nextStatus = 200;

const sessionBody = {
  status: 200,
  message: "Berhasil Mendapatkan Data User",
  data: {
    id: 7,
    code: "U-0001",
    username: "A-0184",
    status: "ACTIVE",
    lastLogin: "2026-08-16T01:00:00.000Z",
    roleUser: { id: 2, name: "Sekretariat", isAdmin: false },
    jemaat: { name: "Andreas Sitanggang", code: "A-0184" },
    menu: [
      {
        publicId: "11111111-1111-1111-1111-111111111111",
        slug: "KEJEMAATAN",
        name: "Kejemaatan",
        order: 1,
        action: [],
        children: [
          {
            publicId: "22222222-2222-2222-2222-222222222222",
            slug: "DAFTAR_JEMAAT",
            name: "Daftar Jemaat",
            order: 1,
            action: ["VIEW", "CREATE"],
            children: [],
          },
        ],
      },
    ],
  },
};

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch(request) {
      lastCookie = request.headers.get("cookie");

      if (nextStatus !== 200) {
        return Response.json(
          { status: nextStatus, error: "Unauthorized" },
          { status: nextStatus },
        );
      }

      return Response.json(sessionBody);
    },
  });

  process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;

  ({ getSession } = await import("./get-session"));
});

afterAll(() => {
  server.stop(true);
});

describe("getSession", () => {
  test("tidak menembak API sama sekali bila tidak ada cookie", async () => {
    cookieHeader = "";
    lastCookie = null;

    expect(await getSession()).toBeNull();
    expect(lastCookie).toBeNull();
  });

  test("meneruskan cookie dan mengembalikan sesi yang sudah tervalidasi", async () => {
    cookieHeader = "accessToken=abc";
    nextStatus = 200;

    const session = await getSession();

    expect(lastCookie).toBe("accessToken=abc");
    expect(session?.jemaat?.name).toBe("Andreas Sitanggang");
    expect(session?.roleUser.isAdmin).toBe(false);
    expect(session?.menu[0].children[0].action).toEqual(["VIEW", "CREATE"]);
  });

  test("membuang field yang tidak dideklarasikan schema", async () => {
    cookieHeader = "accessToken=abc";
    nextStatus = 200;

    const session = await getSession();

    expect(session).not.toHaveProperty("lastLogin");
  });

  test("401 berarti belum masuk, bukan error", async () => {
    cookieHeader = "accessToken=basi";
    nextStatus = 401;

    expect(await getSession()).toBeNull();
  });

  test("500 tetap dilempar", async () => {
    cookieHeader = "accessToken=abc";
    nextStatus = 500;

    expect(getSession()).rejects.toThrow();
  });
});
