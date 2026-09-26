import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { SessionProvider, type Session } from "@/features/auth";

import { ProfileSection } from "./profile-section";

const SESSION: Session = {
  code: "U-0001",
  username: "A-0184",
  status: "ACTIVE",
  roleUser: { name: "Sekretariat", isAdmin: false },
  jemaat: {
    name: "Andreas Sitanggang",
    code: "JMT-0012",
    roleJemaat: [{ name: "Sekretaris", bapel: { name: "Komisi Pemuda" } }],
  },
  menu: [],
};

const PROFILE = {
  gender: "L",
  birthPlace: "Medan",
  birthDate: "1985-05-12T00:00:00.000Z",
  phone: "081234560184",
  email: "andreas@contoh.id",
  statusMarital: "SM",
  address: "Jl. Merdeka No. 2",
  typeJemaat: "ANGGOTA",
  statusJemaat: "AKTIF",
  joinedAt: "2012-06-17T00:00:00.000Z",
  villages: { name: "Cijerah" },
  districts: { name: "Bandung Kulon" },
  regencies: { name: "Kota Bandung" },
  provinces: { name: "Jawa Barat" },
  zoneChurch: { name: "Wilayah III" },
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const onMockProfile = () => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));

    return Response.json({
      status: 200,
      message: "OK",
      data: { jemaat: PROFILE },
    });
  }) as typeof fetch;

  return calls;
};

const onRender = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider session={SESSION}>
        <ProfileSection />
      </SessionProvider>
    </QueryClientProvider>,
  );

describe("data pribadi terlipat sampai diminta", () => {
  test("tertutup: kode jemaat dan jabatan dari sesi, tanpa permintaan dan tanpa PII", () => {
    const calls = onMockProfile();
    onRender();

    expect(screen.getByText("JMT-0012")).toBeTruthy();
    expect(screen.getByText("Sekretaris, Komisi Pemuda")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Lihat data pribadi" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(calls).toEqual([]);
    expect(document.body.textContent).not.toContain("081234560184");
  });

  test("dibuka lalu ditutup: satu permintaan, PII hilang lagi dari DOM", async () => {
    const calls = onMockProfile();
    onRender();

    fireEvent.click(screen.getByRole("button", { name: "Lihat data pribadi" }));

    await waitFor(() => expect(screen.getByText("081234560184")).toBeTruthy());
    expect(calls).toEqual(["/api/v1/auth/me"]);

    fireEvent.click(
      screen.getByRole("button", { name: "Sembunyikan data pribadi" }),
    );

    expect(document.body.textContent).not.toContain("081234560184");
  });
});
