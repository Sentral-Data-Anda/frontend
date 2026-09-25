import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { z } from "zod";

mock.module("server-only", () => ({}));

let server: ReturnType<typeof Bun.serve>;
let apiClient: typeof import("./client").apiClient;
let ApiError: typeof import("./client").ApiError;

const person = z.object({ id: z.number(), name: z.string() });

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);

      switch (url.pathname) {
        case "/ok":
          return Response.json({ id: 1, name: "Jemaat Uji" });
        case "/slow": {
          await Bun.sleep(200);
          return Response.json({ id: 1, name: "Jemaat Uji" });
        }
        case "/slow-body": {
          const stream = new ReadableStream({
            async pull(controller) {
              controller.enqueue(new TextEncoder().encode('{"id":1,'));
              await Bun.sleep(200);
              controller.enqueue(new TextEncoder().encode('"name":"Uji"}'));
              controller.close();
            },
          });

          return new Response(stream, {
            headers: { "Content-Type": "application/json" },
          });
        }
        case "/not-found":
          return new Response("Not Found", { status: 404 });
        case "/server-error":
          return new Response("Boom", { status: 500 });
        case "/bad-schema":
          return Response.json({ wrong: "shape" });
        case "/not-json":
          return new Response("<html>bukan json</html>", {
            headers: { "Content-Type": "text/html" },
          });
        default:
          return new Response("Not Found", { status: 404 });
      }
    },
  });

  process.env.API_BASE_URL = `http://127.0.0.1:${server.port}`;
  process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";

  ({ apiClient, ApiError } = await import("./client"));
});

afterAll(() => {
  server.stop(true);
});

describe("apiClient", () => {
  test("mengembalikan data JSON apa adanya tanpa schema", async () => {
    const data = await apiClient<{ id: number; name: string }>("/ok");
    expect(data).toEqual({ id: 1, name: "Jemaat Uji" });
  });

  test("timeout benar-benar memutus request yang lambat", async () => {
    const start = Date.now();

    await expect(apiClient("/slow", { timeoutMs: 30 })).rejects.toMatchObject({
      name: "ApiError",
      kind: "timeout",
    });

    expect(Date.now() - start).toBeLessThan(150);
  });

  test("timeout melempar instance ApiError yang benar", async () => {
    try {
      await apiClient("/slow", { timeoutMs: 30 });
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as InstanceType<typeof ApiError>).kind).toBe("timeout");
    }
  });

  test("status HTTP non-2xx menghasilkan ApiError kind 'http' dengan status yang benar", async () => {
    try {
      await apiClient("/not-found");
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as InstanceType<typeof ApiError>;
      expect(apiError.kind).toBe("http");
      expect(apiError.status).toBe(404);
    }
  });

  test("status 500 juga menghasilkan ApiError kind 'http' dengan status 500", async () => {
    try {
      await apiClient("/server-error");
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      const apiError = error as InstanceType<typeof ApiError>;
      expect(apiError.kind).toBe("http");
      expect(apiError.status).toBe(500);
    }
  });

  test("schema Zod menerima respons yang bentuknya sesuai", async () => {
    const data = await apiClient("/ok", { schema: person });
    expect(data).toEqual({ id: 1, name: "Jemaat Uji" });
  });

  test("schema Zod menolak bentuk data yang salah dengan ApiError kind 'validation'", async () => {
    try {
      await apiClient("/bad-schema", { schema: person });
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as InstanceType<typeof ApiError>;
      expect(apiError.kind).toBe("validation");
    }
  });

  test("body yang bukan JSON valid menghasilkan ApiError kind 'validation'", async () => {
    try {
      await apiClient("/not-json");
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as InstanceType<typeof ApiError>).kind).toBe("validation");
    }
  });

  test("signal milik pemanggil tetap dihormati dan tidak dilaporkan sebagai timeout", async () => {
    const controller = new AbortController();
    const start = Date.now();
    const promise = apiClient("/slow", { signal: controller.signal });

    queueMicrotask(() => controller.abort());

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });

    expect(Date.now() - start).toBeLessThan(150);
  });

  test("timeout saat badan respons dibaca dilaporkan sebagai kind 'timeout', bukan 'validation'", async () => {
    try {
      await apiClient("/slow-body", { timeoutMs: 30 });
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as InstanceType<typeof ApiError>).kind).toBe("timeout");
    }
  });

  test("pembatalan pemanggil saat badan respons dibaca diteruskan apa adanya", async () => {
    const controller = new AbortController();
    const promise = apiClient("/slow-body", { signal: controller.signal });

    setTimeout(() => controller.abort(), 30);

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  });

  test("caching eksplisit bersama header Authorization ditolak", async () => {
    try {
      await apiClient("/ok", {
        next: { revalidate: 300 },
        headers: { Authorization: "Bearer token-jemaat" },
      });
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as InstanceType<typeof ApiError>;
      expect(apiError.kind).toBe("validation");
      expect(apiError.message).toContain("authorization");
    }
  });

  test("caching eksplisit bersama header Cookie ditolak, tanpa memandang huruf besar-kecil", async () => {
    try {
      await apiClient("/ok", {
        cache: "force-cache",
        headers: { cookie: "session=abc" },
      });
      throw new Error("seharusnya melempar ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as InstanceType<typeof ApiError>).kind).toBe("validation");
    }
  });

  test("caching eksplisit tanpa kredensial tetap diizinkan", async () => {
    const data = await apiClient("/ok", { next: { revalidate: 300 } });
    expect(data).toEqual({ id: 1, name: "Jemaat Uji" });
  });

  test("header Authorization tanpa caching eksplisit tetap diizinkan", async () => {
    const data = await apiClient("/ok", {
      headers: { Authorization: "Bearer token-jemaat" },
    });
    expect(data).toEqual({ id: 1, name: "Jemaat Uji" });
  });
});
