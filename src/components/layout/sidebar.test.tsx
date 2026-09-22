import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { SessionProvider } from "@/features/auth/session-provider";
import type { MenuNode, Session } from "@/features/auth/types";

mock.module("next/navigation", () => ({
  usePathname: () => "/kejemaatan/keluarga",
}));

const { Sidebar, SidebarNav } = await import("./sidebar");
const { SIDEBAR_COOKIE, isSidebarCollapsed, sidebarCookie } =
  await import("./sidebar-collapse");

afterEach(cleanup);

const leaf = (slug: string, name: string): MenuNode => ({
  publicId: slug,
  slug,
  name,
  order: 1,
  action: ["VIEW"],
  children: [],
});

const MENU: MenuNode[] = [
  {
    ...leaf("KEJEMAATAN", "Kejemaatan"),
    action: [],
    children: [
      leaf("DAFTAR_JEMAAT", "Daftar Jemaat"),
      leaf("KELUARGA", "Keluarga"),
    ],
  },
  {
    ...leaf("KEUANGAN", "Keuangan"),
    action: [],
    children: [leaf("KAS_MASUK", "Kas Masuk")],
  },
];

const domainOf = (name: string) =>
  screen.getByText(name).closest("details") as HTMLDetailsElement;

describe("SidebarNav", () => {
  test("hanya domain yang memuat layar aktif yang terbuka", () => {
    render(
      <SidebarNav menu={MENU} pathname="/kejemaatan/daftar-jemaat/JMT-0001" />,
    );

    expect(domainOf("Kejemaatan").open).toBe(true);
    expect(domainOf("Keuangan").open).toBe(false);
  });

  test("layar aktif ditandai aria-current, saudaranya tidak", () => {
    render(<SidebarNav menu={MENU} pathname="/kejemaatan/keluarga" />);

    expect(
      screen
        .getByRole("link", { name: "Keluarga" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen
        .getByRole("link", { name: "Daftar Jemaat" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  test("di beranda tidak ada domain yang terbuka", () => {
    render(<SidebarNav menu={MENU} pathname="/" />);

    expect(domainOf("Kejemaatan").open).toBe(false);
    expect(domainOf("Keuangan").open).toBe(false);
  });

  test("Beranda aktif hanya di /", () => {
    render(<SidebarNav menu={MENU} pathname="/" />);
    expect(
      screen
        .getByRole("link", { name: "Beranda" })
        .getAttribute("aria-current"),
    ).toBe("page");
    cleanup();

    render(<SidebarNav menu={MENU} pathname="/modul" />);
    expect(
      screen
        .getByRole("link", { name: "Beranda" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  test("halaman domain membuka domainnya; semua domain satu grup accordion", () => {
    render(<SidebarNav menu={MENU} pathname="/keuangan" />);

    expect(domainOf("Keuangan").open).toBe(true);
    expect(domainOf("Kejemaatan").open).toBe(false);
    expect(domainOf("Kejemaatan").getAttribute("name")).toBe("sidebar-domain");
  });
});

describe("SidebarNav ringkas", () => {
  test("setiap ikon punya aria-label; domain menuju domainEntryHref", () => {
    render(
      <SidebarNav menu={MENU} pathname="/kejemaatan/keluarga" isCollapsed />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(2 + MENU.length);
    for (const link of links) {
      expect(link.getAttribute("aria-label")).toBeTruthy();
    }

    // Dua layar → halaman domain; satu layar → langsung ke layarnya.
    expect(
      screen.getByRole("link", { name: "Kejemaatan" }).getAttribute("href"),
    ).toBe("/kejemaatan");
    expect(
      screen.getByRole("link", { name: "Keuangan" }).getAttribute("href"),
    ).toBe("/keuangan/kas-masuk");
    expect(screen.queryByRole("group")).toBeNull();
    expect(document.querySelector("details")).toBeNull();
  });

  test("domain yang memuat layar aktif diberi chip aktif", () => {
    render(
      <SidebarNav menu={MENU} pathname="/kejemaatan/keluarga" isCollapsed />,
    );

    expect(
      screen
        .getByRole("link", { name: "Kejemaatan" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen
        .getByRole("link", { name: "Keuangan" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });
});

describe("cookie sidebar", () => {
  test('hanya "1" berarti ringkas', () => {
    expect(isSidebarCollapsed("1")).toBe(true);
    expect(isSidebarCollapsed("0")).toBe(false);
    expect(isSidebarCollapsed(undefined)).toBe(false);
  });

  test("toggle menulis cookie dan mengganti mode tanpa kehilangan fokus", async () => {
    const session: Session = {
      code: "U1",
      username: "sekretaris",
      status: "ACTIVE",
      roleUser: { name: "Sekretaris", isAdmin: false },
      jemaat: null,
      menu: MENU,
    };

    render(
      <SessionProvider session={session}>
        <Sidebar defaultCollapsed={false} />
      </SessionProvider>,
    );

    const toggle = screen.getByRole("button", { name: "Ciutkan menu" });

    await act(async () => {
      toggle.focus();
      fireEvent.click(toggle);
    });

    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=1`);
    expect(toggle.getAttribute("aria-label")).toBe("Lebarkan menu");
    expect(document.activeElement).toBe(toggle);
    expect(screen.getByRole("link", { name: "Kejemaatan" })).toBeTruthy();

    await act(async () => fireEvent.click(toggle));
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=0`);
  });

  test("atribut cookie: seluruh situs, Lax, setahun", () => {
    expect(sidebarCookie(true)).toBe(
      "sidebar_collapsed=1; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });
});
