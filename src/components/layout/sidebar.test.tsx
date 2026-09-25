import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

import { SessionProvider } from "@/features/auth";
import type { Session } from "@/features/auth";
import type { MenuNode } from "@/types/menu";

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

const SESSION: Session = {
  code: "U1",
  username: "sekretaris",
  status: "ACTIVE",
  roleUser: { name: "Sekretaris", isAdmin: false },
  jemaat: null,
  menu: MENU,
};

const renderSidebar = (defaultCollapsed: boolean) =>
  render(
    <SessionProvider session={SESSION}>
      <Sidebar defaultCollapsed={defaultCollapsed} />
    </SessionProvider>,
  );

const domainOf = (name: string) =>
  [...document.querySelectorAll("details")].find(
    (d) => d.querySelector("summary")?.textContent === name,
  ) as HTMLDetailsElement;

const railButtonOf = (name: string) =>
  domainOf(name).parentElement?.querySelector(
    ":scope > button",
  ) as HTMLButtonElement;

const RAIL_ONLY = ["invisible", "group-data-collapsed/sidebar:visible"];
const FULL_ONLY = "group-data-collapsed/sidebar:invisible";

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

describe("SidebarNav satu DOM untuk kedua mode", () => {
  test("tiap domain punya accordion (penuh) dan tombol rail, hanya satu tampil per mode", () => {
    render(<SidebarNav menu={MENU} pathname="/kejemaatan/keluarga" />);

    for (const { name } of MENU) {
      const details = domainOf(name);
      const rail = railButtonOf(name);

      expect(details.getAttribute("name")).toBe("sidebar-domain");
      expect(details.className).toContain(FULL_ONLY);
      for (const cls of RAIL_ONLY) expect(rail.classList).toContain(cls);
      expect(rail.hasAttribute("aria-label")).toBe(false);
      expect(rail.textContent).toBe(name);
    }

    expect(screen.queryByRole("link", { name: "Kejemaatan" })).toBeNull();
    expect(railButtonOf("Kejemaatan").getAttribute("type")).toBe("button");
  });

  test("Pencarian dan sub-layar hanya milik mode penuh (dilipat di rail)", () => {
    render(<SidebarNav menu={MENU} pathname="/kejemaatan/keluarga" />);

    const cari = screen.getByRole("link", { name: "Pencarian" });
    const leaf = screen.getByRole("link", { name: "Keluarga" });

    for (const el of [cari, leaf]) {
      expect(el.closest(`[class~="${FULL_ONLY}"]`)).toBeTruthy();
    }
    expect(
      screen
        .getByRole("link", { name: "Beranda" })
        .closest(`[class~="${FULL_ONLY}"]`),
    ).toBeNull();
  });

  test("tombol rail domain yang memuat layar aktif diberi chip aktif", () => {
    render(<SidebarNav menu={MENU} pathname="/kejemaatan/keluarga" />);

    expect(railButtonOf("Kejemaatan").getAttribute("aria-current")).toBe(
      "true",
    );
    expect(railButtonOf("Keuangan").getAttribute("aria-current")).toBeNull();
  });
});

describe("cookie sidebar", () => {
  test('hanya "1" berarti ringkas', () => {
    expect(isSidebarCollapsed("1")).toBe(true);
    expect(isSidebarCollapsed("0")).toBe(false);
    expect(isSidebarCollapsed(undefined)).toBe(false);
  });

  test("toggle satu elemen: menulis cookie, membalik data-collapsed, fokus bertahan, tanpa mount ulang", async () => {
    renderSidebar(false);

    const toggle = screen.getByRole("button", { name: "Ciutkan menu" });
    const aside = document.querySelector("aside") as HTMLElement;
    const details = domainOf("Kejemaatan");
    const rail = railButtonOf("Kejemaatan");

    expect(aside.hasAttribute("data-collapsed")).toBe(false);

    await act(async () => {
      toggle.focus();
      fireEvent.click(toggle);
    });

    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=1`);
    expect(screen.getByRole("button", { name: "Lebarkan menu" })).toBe(toggle);
    expect(document.activeElement).toBe(toggle);
    expect(toggle.hasAttribute("aria-expanded")).toBe(false);
    expect(toggle.closest("aside")).toBeNull();
    expect(aside.hasAttribute("data-collapsed")).toBe(true);
    expect(domainOf("Kejemaatan")).toBe(details);
    expect(railButtonOf("Kejemaatan")).toBe(rail);

    await act(async () => fireEvent.click(toggle));
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=0`);
    expect(toggle.getAttribute("aria-label")).toBe("Ciutkan menu");
    expect(document.activeElement).toBe(toggle);
    expect(aside.hasAttribute("data-collapsed")).toBe(false);
    expect(domainOf("Kejemaatan")).toBe(details);
    expect(details.open).toBe(true);
  });

  test("klik domain di rail: melebar, cookie tertulis, accordion domain itu terbuka dan difokus", async () => {
    renderSidebar(true);

    const aside = document.querySelector("aside") as HTMLElement;

    expect(domainOf("Kejemaatan").open).toBe(true);
    expect(domainOf("Keuangan").open).toBe(false);

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Keuangan" })),
    );

    expect(aside.hasAttribute("data-collapsed")).toBe(false);
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=0`);
    expect(domainOf("Keuangan").open).toBe(true);
    expect(document.activeElement).toBe(
      domainOf("Keuangan").querySelector("summary"),
    );
    expect(screen.getByRole("button", { name: "Ciutkan menu" })).toBeTruthy();
  });

  test("render awal mengikuti cookie", () => {
    renderSidebar(true);

    expect(
      document.querySelector("aside")?.hasAttribute("data-collapsed"),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Lebarkan menu" })).toBeTruthy();
  });

  test("atribut cookie: seluruh situs, Lax, setahun", () => {
    expect(sidebarCookie(true)).toBe(
      "sidebar_collapsed=1; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });
});

describe("menu akun", () => {
  const replace = spyOn(window.location, "replace").mockImplementation(
    () => {},
  );

  beforeEach(() => replace.mockClear());
  afterAll(() => replace.mockRestore());

  const openMenu = async () => {
    const trigger = screen.getByRole("button", { name: "Akun: sekretaris" });

    await act(async () => {
      trigger.focus();
      fireEvent.click(trigger);
    });

    return { trigger, menu: await screen.findByRole("menu") };
  };

  test("avatar rail membuka menu berisi nama dan peran", async () => {
    renderSidebar(true);

    const { trigger, menu } = await openMenu();

    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(menu.textContent).toContain("sekretaris");
    expect(menu.textContent).toContain("Sekretaris");
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
  });

  test("Keluar memanggil logout: DELETE BFF lalu ganti ke /login", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    renderSidebar(true);
    await openMenu();

    await act(async () =>
      fireEvent.click(screen.getByRole("menuitem", { name: "Keluar" })),
    );

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/auth/logout", {
      method: "DELETE",
    });
    expect(replace).toHaveBeenCalledWith("/login");
    fetchSpy.mockRestore();
  });

  test("Escape menutup menu dan mengembalikan fokus ke avatar", async () => {
    renderSidebar(true);

    const { trigger, menu } = await openMenu();

    await act(async () => fireEvent.keyDown(menu, { key: "Escape" }));

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  test("menu akun hanya tampil di rail; mode penuh Keluar langsung", () => {
    renderSidebar(false);

    const trigger = screen.getByRole("button", { name: "Akun: sekretaris" });
    const keluar = screen.getByRole("button", { name: "Keluar" });

    expect(trigger.classList).toContain("hidden");
    expect(trigger.classList).toContain("group-data-collapsed/sidebar:block");
    expect(keluar.classList).toContain(FULL_ONLY);
  });
});
