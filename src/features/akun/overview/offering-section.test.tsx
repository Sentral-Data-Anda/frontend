import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("next/navigation", () => ({
  usePathname: () => "/akun",
}));

const { OfferingSection } = await import("./offering-section");

const PASSWORD = "Sada1234";
const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});

type Server = {
  offeringCalls: string[];
  verifyBodies: string[];
  expireMs: number;
  isStepUpActive: boolean;
  verifyStatus: 200 | 400 | 429;
};

const offeringsResponse = () =>
  Response.json({
    status: 200,
    message: "OK",
    totalData: 1,
    totalPage: 1,
    data: [
      {
        code: "PSB-0050",
        amount: "650000",
        period: "2026-09-01T00:00:00.000Z",
        receivedDate: "2026-09-07T00:00:00.000Z",
        typePersembahan: { name: "Persembahan Bulanan" },
      },
    ],
  });

const verifyResponse = (server: Server) => {
  if (server.verifyStatus === 429) {
    return Response.json(
      {
        status: 429,
        error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
      },
      { status: 429 },
    );
  }
  if (server.verifyStatus === 400) {
    return Response.json(
      {
        status: 400,
        error: "Validasi Gagal",
        issues: [
          {
            path: "password",
            message: "Password tidak sesuai. Periksa kembali.",
          },
        ],
      },
      { status: 400 },
    );
  }

  server.isStepUpActive = true;

  return Response.json({
    status: 200,
    message: "OK",
    data: {
      expiresAt: new Date(Date.now() + server.expireMs).toISOString(),
    },
  });
};

const onMockServer = (overrides: Partial<Server> = {}) => {
  const server: Server = {
    offeringCalls: [],
    verifyBodies: [],
    expireMs: 300_000,
    isStepUpActive: false,
    verifyStatus: 200,
    ...overrides,
  };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/auth/verify-password")) {
      server.verifyBodies.push(String(init?.body));
      return verifyResponse(server);
    }

    server.offeringCalls.push(url);

    return server.isStepUpActive
      ? offeringsResponse()
      : Response.json(
          {
            status: 403,
            error: "Verifikasi Password Diperlukan",
            code: "STEP_UP_REQUIRED",
          },
          { status: 403 },
        );
  }) as typeof fetch;

  return server;
};

const onRender = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <OfferingSection />
    </QueryClientProvider>,
  );

const eyeButton = (name = "Tampilkan persembahan") =>
  screen.getByRole("button", { name, hidden: true });

const openDialog = async () => {
  fireEvent.click(eyeButton());

  const dialog = await screen.findByRole("alertdialog");

  await waitFor(() =>
    expect(dialog.textContent).toContain("Konfirmasi Password"),
  );

  return dialog;
};

const isDialogClosed = () => {
  const dialog = screen.queryByRole("alertdialog");

  return dialog === null || dialog.hasAttribute("data-closed");
};

const passwordField = () =>
  screen.getByLabelText("Password", { selector: "input" }) as HTMLInputElement;

const onSubmitPassword = (value: string) => {
  fireEvent.change(passwordField(), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));
};

const onVerify = async () => {
  await openDialog();
  onSubmitPassword(PASSWORD);
  await waitFor(() =>
    expect(screen.getAllByText("Rp 650.000").length).toBeGreaterThan(0),
  );
  await waitFor(() => expect(isDialogClosed()).toBe(true));
};

const passwordInDom = () =>
  document.body.innerHTML.includes(PASSWORD) ||
  [...document.querySelectorAll("input")].some(
    (input) => input.value === PASSWORD,
  );

const onHideTab = () => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

describe("persembahan tersembunyi sampai password dikonfirmasi", () => {
  test("sebelum mata diketuk: tanpa permintaan dan tanpa nominal di DOM", () => {
    const server = onMockServer();
    onRender();

    expect(eyeButton().getAttribute("aria-expanded")).toBe("false");
    expect(server.offeringCalls).toEqual([]);
    expect(document.body.textContent).not.toContain("650.000");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  test("mata meminta password dulu; belum ada permintaan persembahan", async () => {
    const server = onMockServer();
    onRender();

    const dialog = await openDialog();

    expect(dialog.textContent).toContain(
      "Masukkan password akun Anda untuk melihat persembahan.",
    );
    expect(passwordField().getAttribute("autocomplete")).toBe(
      "current-password",
    );
    expect(eyeButton().getAttribute("aria-expanded")).toBe("false");
    expect(server.offeringCalls).toEqual([]);
  });

  test("kosong ditolak di klien tanpa permintaan", async () => {
    const server = onMockServer();
    onRender();

    await openDialog();
    fireEvent.click(screen.getByRole("button", { name: "Lanjut" }));

    expect(await screen.findByText("Mohon lengkapi password")).toBeTruthy();
    expect(server.verifyBodies).toEqual([]);
  });

  test("password tidak dipangkas saat dikirim", async () => {
    const server = onMockServer();
    onRender();

    await openDialog();
    onSubmitPassword(` ${PASSWORD} `);

    await waitFor(() => expect(server.verifyBodies).toHaveLength(1));
    expect(JSON.parse(server.verifyBodies[0])).toEqual({
      password: ` ${PASSWORD} `,
    });
  });

  test("400 mendarat di field dan fokus kembali ke field", async () => {
    const server = onMockServer({ verifyStatus: 400 });
    onRender();

    await openDialog();
    onSubmitPassword("salah");

    expect(
      await screen.findByText("Password tidak sesuai. Periksa kembali."),
    ).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(passwordField()));
    expect(passwordField().getAttribute("aria-invalid")).toBe("true");
    expect(server.offeringCalls).toEqual([]);
  });

  test("429 tampil sebagai alert di dialog", async () => {
    onMockServer({ verifyStatus: 429 });
    onRender();

    await openDialog();
    onSubmitPassword("salah");

    const alert = await screen.findByRole("alert");

    expect(alert.textContent).toBe(
      "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    );
    await waitFor(() => expect(document.activeElement).toBe(passwordField()));
  });

  test("sukses membuka data; password tidak tersisa; buka lagi tanpa dialog", async () => {
    const server = onMockServer();
    onRender();

    await onVerify();

    expect(passwordInDom()).toBe(false);
    expect(server.offeringCalls).toHaveLength(1);
    expect(
      eyeButton("Sembunyikan persembahan").getAttribute("aria-expanded"),
    ).toBe("true");

    fireEvent.click(eyeButton("Sembunyikan persembahan"));
    expect(document.body.textContent).not.toContain("650.000");

    fireEvent.click(eyeButton());

    await waitFor(() =>
      expect(screen.getAllByText("Rp 650.000").length).toBeGreaterThan(0),
    );
    expect(isDialogClosed()).toBe(true);
    expect(server.verifyBodies).toHaveLength(1);
  });

  test("Batal membuang isian password", async () => {
    const server = onMockServer();
    onRender();

    await openDialog();
    fireEvent.change(passwordField(), { target: { value: PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    await waitFor(() => expect(isDialogClosed()).toBe(true));
    expect(passwordInDom()).toBe(false);

    await openDialog();

    expect(passwordField().value).toBe("");
    expect(server.verifyBodies).toEqual([]);
  });

  test("lewat expiresAt: password diminta lagi", async () => {
    onMockServer({ expireMs: 50 });
    onRender();

    await onVerify();
    fireEvent.click(eyeButton("Sembunyikan persembahan"));
    await new Promise((resolve) => setTimeout(resolve, 80));

    await openDialog();
  });

  test("403 STEP_UP_REQUIRED menyembunyikan data dan membuka dialog", async () => {
    const server = onMockServer();
    onRender();

    await onVerify();
    fireEvent.click(eyeButton("Sembunyikan persembahan"));
    server.isStepUpActive = false;
    fireEvent.click(eyeButton());

    const dialog = await screen.findByRole("alertdialog");

    await waitFor(() =>
      expect(dialog.textContent).toContain("Konfirmasi Password"),
    );
    expect(eyeButton().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.textContent).not.toContain("650.000");
    expect(server.offeringCalls).toHaveLength(2);
  });

  test("tab disembunyikan: data hilang dan password diminta lagi", async () => {
    onMockServer();
    onRender();

    await onVerify();
    onHideTab();

    expect(document.body.textContent).not.toContain("650.000");
    expect(eyeButton().getAttribute("aria-expanded")).toBe("false");

    await openDialog();
  });
});
