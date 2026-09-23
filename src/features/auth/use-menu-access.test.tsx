import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { MenuSlug } from "@/config/menu";
import { findMenuNode } from "@/lib/menu-tree";

import { SessionProvider } from "./session-provider";
import type { Session } from "./types";
import { useMenuAccess } from "./use-menu-access";

/**
 * `cleanup()` dipanggil manual: auto-cleanup Testing Library bergantung pada
 * hook global milik Jest/Vitest yang tidak terpasang di bun test. Tanpa ini,
 * `onRenderProbe` yang dipanggil berkali-kali menumpuk beberapa
 * `data-testid="hasil"` di document.body yang sama, dan `getByTestId`
 * meledak dengan "Found multiple elements".
 */
afterEach(cleanup);

const session: Session = {
  code: "U-0001",
  username: "A-0184",
  status: "ACTIVE",
  roleUser: { name: "Sekretariat", isAdmin: false },
  jemaat: { name: "Andreas Sitanggang" },
  menu: [
    {
      publicId: "1",
      slug: "KEJEMAATAN",
      name: "Kejemaatan",
      order: 1,
      action: [],
      children: [
        {
          publicId: "2",
          slug: "DAFTAR_JEMAAT",
          name: "Daftar Jemaat",
          order: 1,
          action: ["VIEW", "CREATE"],
          children: [],
        },
        {
          publicId: "3",
          slug: "KELUARGA",
          name: "Keluarga",
          order: 2,
          action: ["VIEW"],
          children: [],
        },
      ],
    },
  ],
};

function Probe({ slug }: { slug: MenuSlug }) {
  const access = useMenuAccess(slug);

  return <span data-testid="hasil">{JSON.stringify(access)}</span>;
}

const onRenderProbe = (slug: MenuSlug) => {
  render(
    <SessionProvider session={session}>
      <Probe slug={slug} />
    </SessionProvider>,
  );

  return JSON.parse(screen.getByTestId("hasil").textContent ?? "{}");
};

describe("findMenuNode", () => {
  test("menemukan simpul yang bersarang", () => {
    expect(findMenuNode(session.menu, "KELUARGA")?.name).toBe("Keluarga");
  });

  test("mengembalikan null untuk slug yang tidak ada", () => {
    expect(findMenuNode(session.menu, "TIDAK_ADA")).toBeNull();
  });
});

describe("useMenuAccess", () => {
  test("memetakan aksi yang dipegang", () => {
    const access = onRenderProbe("DAFTAR_JEMAAT");

    expect(access.isCanView).toBe(true);
    expect(access.isCanCreate).toBe(true);
    expect(access.isCanUpdate).toBe(false);
    expect(access.isCanDelete).toBe(false);
  });

  test("slug yang tidak ada di pohon berarti tidak punya hak apa pun", () => {
    const access = onRenderProbe("PAYROLL");

    expect(Object.values(access).every((value) => value === false)).toBe(true);
  });

  test("menu grup tanpa aksi tetap tidak memberi hak", () => {
    const access = onRenderProbe("KEJEMAATAN");

    expect(access.isCanView).toBe(false);
  });
});
