import { expect, test } from "bun:test";

import { sessionSchema } from "./types";

test("sesi tidak membawa data pribadi jemaat ke halaman", () => {
  const session = sessionSchema.parse({
    code: "U-0001",
    username: "A-0184",
    status: "ACTIVE",
    roleUser: { name: "Sekretariat", isAdmin: false },
    jemaat: {
      name: "Andreas",
      code: "JMT-0012",
      phone: "081234560184",
      email: "andreas@contoh.id",
      address: "Jl. Merdeka No. 2",
      birthDate: "1985-05-12T00:00:00.000Z",
      roleJemaat: [],
    },
    menu: [],
  });

  expect(Object.keys(session.jemaat ?? {}).sort()).toEqual([
    "code",
    "name",
    "roleJemaat",
  ]);
});
