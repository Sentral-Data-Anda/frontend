import { afterEach, describe, expect, test } from "bun:test";

import { FetchError, fetchOne } from "./api/fetcher";
import {
  applyServerError,
  FIRST_INVALID,
  FORBIDDEN_MESSAGE,
  revealField,
} from "./form-error";
import { connectToast, type ToastInput } from "./toast-bus";

type Recorded = { field: string; message?: string };

const onCollect = () => {
  const calls: Recorded[] = [];

  return {
    calls,
    setError: ((field: string, error: { message?: string }) =>
      calls.push({ field, message: error.message })) as never,
  };
};

const onCollectToast = () => {
  const toasts: ToastInput[] = [];
  const release = connectToast((toast) => toasts.push(toast));

  return { toasts, release };
};

describe("galat tanpa field memunculkan toast", () => {
  test("galat jaringan: toast dan root sepesan", () => {
    const { calls, setError } = onCollect();
    const { toasts, release } = onCollectToast();

    const field = applyServerError(new Error("offline"), setError);
    release();

    expect(field).toBe("root");
    expect(calls).toHaveLength(1);
    expect(toasts).toEqual([
      { title: calls[0].message as string, type: "error" },
    ]);
  });

  test("403 polos: toast memakai pesan izin", async () => {
    const { setError } = onCollect();
    const failure = await onFail(403, {});
    const { toasts, release } = onCollectToast();

    applyServerError(failure, setError);
    release();

    expect(toasts).toEqual([{ title: FORBIDDEN_MESSAGE, type: "error" }]);
  });

  test("galat berfield tidak memunculkan toast", () => {
    const { setError } = onCollect();
    const { toasts, release } = onCollectToast();

    applyServerError(
      new FetchError(400, "Data Tidak Valid", [
        { path: "name", message: "Nama wajib diisi" },
      ]),
      setError,
    );
    release();

    expect(toasts).toEqual([]);
  });

  test("tanpa ToastHost terpasang, tidak melempar", () => {
    const { setError } = onCollect();

    expect(() =>
      applyServerError(new Error("offline"), setError),
    ).not.toThrow();
  });
});

describe("applyServerError", () => {
  test("issues[] mendarat di fieldnya masing-masing (test wajib 6)", () => {
    const { calls, setError } = onCollect();

    const field = applyServerError(
      new FetchError(400, "Data Tidak Valid", [
        { path: "name", message: "Nama minimal 3 karakter" },
        { path: "additional.0.date", message: "Tanggal wajib diisi" },
      ]),
      setError,
    );

    expect(calls).toEqual([
      { field: "name", message: "Nama minimal 3 karakter" },
      { field: "additional.0.date", message: "Tanggal wajib diisi" },
    ]);
    expect(field).toBe("name");
  });

  test("pesan unik yang dikenal fitur dipetakan ke fieldnya", () => {
    const { calls, setError } = onCollect();

    const field = applyServerError(
      new FetchError(400, "Email Sudah Tersedia"),
      setError,
      (message) =>
        /email sudah tersedia/i.test(message)
          ? { field: "email", message }
          : null,
    );

    expect(calls).toEqual([
      { field: "email", message: "Email Sudah Tersedia" },
    ]);
    expect(field).toBe("email");
  });

  test("issues[] yang pesannya dikenal fitur memakai kalimat fitur, path tetap dari server", () => {
    const { calls, setError } = onCollect();

    const field = applyServerError(
      new FetchError(409, "Role Pelayan Sudah Tersedia", [
        { path: "name", message: "Role Pelayan Sudah Tersedia" },
        { path: "other", message: "Tidak dikenal" },
      ]),
      setError,
      (message) =>
        /role pelayan sudah tersedia/i.test(message)
          ? { field: "root", message: "Tugas dengan nama ini sudah ada." }
          : null,
    );

    expect(calls).toEqual([
      { field: "name", message: "Tugas dengan nama ini sudah ada." },
      { field: "other", message: "Tidak dikenal" },
    ]);
    expect(field).toBe("name");
  });

  test("galat 500 jadi galat tingkat form, bukan galat field (test wajib 7)", () => {
    const { calls, setError } = onCollect();

    const field = applyServerError(
      new FetchError(500, "Kesalahan server."),
      setError,
      () => null,
    );

    expect(calls).toEqual([{ field: "root", message: "Kesalahan server." }]);
    expect(field).toBe("root");
  });

  test("galat jaringan jadi galat tingkat form dengan kalimat sendiri", () => {
    const { calls, setError } = onCollect();

    applyServerError(new TypeError("Failed to fetch"), setError);

    expect(calls[0].field).toBe("root");
    expect(calls[0].message).toContain("Periksa koneksi");
  });
});

const onFail = async (status: number, body: unknown): Promise<FetchError> => {
  const original = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  try {
    await fetchOne("/uji");
  } catch (error) {
    if (error instanceof FetchError) return error;
  } finally {
    globalThis.fetch = original;
  }

  throw new Error("fetchOne tidak melempar FetchError");
};

describe("applyServerError: 403", () => {
  test("403 polos tanpa pesan server jatuh ke kalimat bersama di root, mapMessage tak dipakai", async () => {
    const { calls, setError } = onCollect();
    let mapCalls = 0;

    const field = applyServerError(await onFail(403, {}), setError, () => {
      mapCalls += 1;
      return null;
    });

    expect(calls).toEqual([{ field: "root", message: FORBIDDEN_MESSAGE }]);
    expect(field).toBe("root");
    expect(mapCalls).toBe(0);
  });

  test("403 ber-kode STEP_UP_REQUIRED tanpa pesan server TIDAK jatuh ke kalimat bersama", async () => {
    const { calls, setError } = onCollect();

    applyServerError(await onFail(403, { code: "STEP_UP_REQUIRED" }), setError);

    expect(calls).toHaveLength(1);
    expect(calls[0].message).not.toBe(FORBIDDEN_MESSAGE);
    expect(calls[0].message).toBe("Permintaan gagal (403).");
  });

  test("403 polos dengan pesan server spesifik mempertahankan pesan servernya", async () => {
    const { calls, setError } = onCollect();
    const error = "Anda Tidak Dapat Memberikan Role Melebihi Milik Anda";

    applyServerError(await onFail(403, { error }), setError);

    expect(calls).toEqual([{ field: "root", message: error }]);
  });

  test("status non-403 tanpa pesan server tidak memakai kalimat izin", async () => {
    const { calls, setError } = onCollect();

    applyServerError(await onFail(500, {}), setError);

    expect(calls).toEqual([
      { field: "root", message: "Permintaan gagal (500)." },
    ]);
  });
});

describe("revealField", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test("FIRST_INVALID memilih field bergalat pertama menurut urutan DOM", () => {
    document.body.innerHTML = `
      <form>
        <input id="name" />
        <button id="gender" aria-invalid="true"></button>
        <input id="birthPlace" aria-invalid="true" />
      </form>`;
    const gender = document.getElementById("gender") as HTMLElement;
    gender.scrollIntoView = () => {};

    revealField(FIRST_INVALID);

    expect(document.activeElement?.id).toBe("gender");
  });
});
