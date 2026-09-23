import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";

import { installErrorListeners } from "@/features/observability/install-listeners";
import { REPORT_ENDPOINT } from "@/features/observability/report";

/**
 * Test ini menembak jalur penuh: listener global → toReport → sendReport →
 * navigator.sendBeacon. Yang ditiru hanya sendBeacon-nya, titik paling ujung.
 *
 * Alasannya: yang paling mungkin rusak di sini bukan salah satu fungsinya,
 * tapi sambungan di antaranya — listener terpasang pada event yang salah,
 * atau path tidak ikut terkirim. Menirukan setiap lapisan justru menyembunyikan
 * persis kelas bug itu.
 */
describe("installErrorListeners", () => {
  let sent: { url: string; body: Blob }[] = [];
  let uninstall: (() => void) | undefined;

  beforeEach(() => {
    sent = [];
    jest
      .spyOn(navigator, "sendBeacon")
      .mockImplementation((url: string | URL, data?: BodyInit | null) => {
        sent.push({ url: String(url), body: data as Blob });
        return true;
      });
  });

  afterEach(() => {
    uninstall?.();
    uninstall = undefined;
    jest.restoreAllMocks();
  });

  const payload = async () => JSON.parse(await sent[0].body.text());

  it("melaporkan exception tak tertangkap beserta path halaman", async () => {
    uninstall = installErrorListeners();

    window.dispatchEvent(
      new ErrorEvent("error", { error: new Error("gagal memuat jemaat") }),
    );

    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(REPORT_ENDPOINT);
    expect(await payload()).toMatchObject({
      kind: "error",
      name: "Error",
      message: "gagal memuat jemaat",
      path: "/",
    });
  });

  it("meneruskan digest, penghubung ke baris log server", async () => {
    uninstall = installErrorListeners();

    const error = Object.assign(new Error("disamarkan"), { digest: "1a2b3c" });
    window.dispatchEvent(new ErrorEvent("error", { error }));

    expect(await payload()).toMatchObject({ digest: "1a2b3c" });
  });

  it("memakai message bila event tidak membawa objek error", async () => {
    uninstall = installErrorListeners();

    window.dispatchEvent(new ErrorEvent("error", { message: "Script error." }));

    expect(await payload()).toMatchObject({
      kind: "error",
      name: "UnknownError",
      message: "Script error.",
    });
  });

  it("melaporkan promise yang ditolak tanpa penangan", async () => {
    uninstall = installErrorListeners();

    const event = new Event("unhandledrejection");
    Object.assign(event, { reason: new Error("timeout ke backend") });
    window.dispatchEvent(event);

    expect(await payload()).toMatchObject({
      kind: "unhandledrejection",
      name: "Error",
      message: "timeout ke backend",
    });
  });

  it("berhenti melaporkan setelah dilepas", () => {
    const stop = installErrorListeners();
    stop();

    window.dispatchEvent(new ErrorEvent("error", { error: new Error("x") }));

    expect(sent).toHaveLength(0);
  });
});
