# SADA Fase 0 + 1 — Fondasi & Gerbang Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membawa `fe-sada` dari fondasi tanpa layar menjadi aplikasi yang bisa dimasuki: login, layar tunggu bermerek, app shell dengan bottom tab, dan navigasi ke seluruh 61 layar (yang isinya masih kosong) berdasarkan menu tree dan hak akses dari be-sada.

**Architecture:** Browser tidak pernah menembak be-sada langsung. Satu route handler catch-all di Next meneruskan `/api/v1/*` ke be-sada sambil merelai cookie, sehingga sesi jadi same-origin. `proxy.ts` menjaga gerbang dan menyegarkan access token yang kedaluwarsa. Sesi dan menu tree diambil sekali di Server Component lalu dibagikan lewat context; TanStack Query mengurus seluruh state data berikutnya.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript 5, Tailwind 4, shadcn `base-nova` + `@base-ui/react`, Bun 1.3 (runtime, package manager, test runner), Zod 4, TanStack Query 5, react-hook-form 7.

**Spec:** `docs/superpowers/specs/2026-09-13-sada-slicing-ui-design.md`

## Global Constraints

- Komentar dan dokumentasi berbahasa Indonesia. Nama variabel, fungsi, tipe, dan pesan commit mengikuti konvensi yang sudah ada di repo.
- Commit mengikuti commitlint repo: `type(scope): subject`, subject huruf kecil, header maksimal 100 karakter, **scope wajib** (`scope-empty: never`). Type yang sah: `feat, fix, slicing, docs, chore, refactor, test, ci, perf, style, build, revert`.
- Setiap pesan commit diakhiri baris `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- Sebelum menulis kode yang menyentuh API Next.js, baca dokumen terkait di `node_modules/next/dist/docs/` (aturan `AGENTS.md` repo ini). Next 16 punya breaking change: `middleware` sudah bernama `proxy`, dan `proxy` berjalan di Node.js runtime (opsi `runtime` dilarang di berkas itu).
- `bun run lint`, `bun run typecheck`, dan `bun test` harus hijau di akhir setiap task. **Baseline saat ini: 81 test lolos, 0 gagal, 9 berkas.**
- Test membutuhkan env: `API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000` — `src/lib/env.ts` fail-fast tanpa `.default()`.
- Konvensi penamaan: boolean diawali `is`, fungsi diawali `on`, state pilihan diawali `pick`. Urutan blok di dalam komponen: **state → function → useEffect → return**.
- State boolean memakai `useBoolean()` dari `src/hooks/use-boolean.ts`, bukan `useState<boolean>`.
- Warna hardcode dilarang; hanya token Tailwind dari `src/app/globals.css`.
- **Dependency baru yang diizinkan rencana ini, dan tidak ada lagi:** `@tanstack/react-query@^5.102.8`, `react-hook-form@^7.88.0`, `@hookform/resolvers@^5.9.1`.
- Berkas di `src/app/**` DILARANG mengimpor dari `@/components/ui/*` — hanya `src/components/layout/**` dan `src/components/common/**` yang boleh. Ditegakkan ESLint di Task 4.
- Komentar peringatan yang sudah ada di repo (terutama di `src/proxy.ts` dan `src/lib/api/client.ts`) dipertahankan. Menghapusnya berarti membuang alasan yang sudah dibayar mahal.

---

## Fakta be-sada yang dipakai rencana ini

Diverifikasi langsung terhadap `/Users/lexferndo/Documents/Project/be-sada` pada 2026-09-13. Implementer tidak perlu memeriksa ulang, tapi tidak boleh menebak di luar daftar ini.

| Fakta                                                                                                                                                                               | Berkas sumber                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Sesi disimpan di cookie `accessToken` dan `refreshToken`, keduanya `httpOnly`, `signed`, `sameSite: "strict"`, dan membawa atribut `Domain` dari `env.CORS_DOMAIN`                  | `src/common/constants/cookies.ts`                 |
| Amplop sukses: `{ status, message, data }`                                                                                                                                          | `src/common/utils/apiResponse.ts`                 |
| Amplop daftar menambah `totalData` dan `totalPage` **di level amplop**                                                                                                              | `src/modules/jemaat/jemaat.controller.ts:20-25`   |
| **Amplop gagal memakai field `error`, bukan `message`**: `{ status, error }`                                                                                                        | `src/middleware/errorHandler.ts` (seluruh cabang) |
| Endpoint daftar membalas **404** ketika hasil filter kosong                                                                                                                         | `src/modules/jemaat/jemaat.controller.ts:16-18`   |
| `GET /api/v1/auth/:code` mengabaikan `:code` dan memakai `req.user.code`; jadi `/api/v1/auth/me` mengembalikan user yang sedang login                                               | `src/modules/auth/auth.controller.ts:55-58`       |
| Respons itu berisi user **beserta menu tree lengkap dengan `action[]` per slug**                                                                                                    | `src/modules/auth/auth.service.ts:262-278`        |
| Bentuk simpul menu: `{ publicId, slug, name, order, action, children }`                                                                                                             | `src/modules/menu/menu.service.ts:4-11`           |
| `POST /api/v1/auth/login` membalas `{ status: 200, message: "Berhasil Login" }` dan menerbitkan cookie; akun `PENDING` tidak mendapat refresh cookie                                | `src/modules/auth/auth.controller.ts:29-51`       |
| `GET /api/v1/auth/refresh-token` **merotasi kedua cookie**, dan menyajikan ulang refresh token yang sudah pensiun akan **mencabut SELURUH sesi akun itu** (`"refresh token reuse"`) | `src/modules/auth/auth.service.ts:316-380`        |
| Status akun: `PENDING`, `ACTIVE`, `DEACTIVATED`                                                                                                                                     | `src/modules/auth/auth.service.ts`                |
| Menu tree berisi 12 domain dan 61 layar daun                                                                                                                                        | `src/common/constants/menu.ts`                    |

---

## File Structure

**Dibuat:**

| Berkas                                                  | Tanggung jawab                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/lib/api/fetcher.ts`                                | Satu pintu panggilan API dari browser, lewat `/api/v1`. Menerjemahkan amplop dan 404-pada-daftar. |
| `src/lib/api/fetcher.test.ts`                           | Test fetcher.                                                                                     |
| `src/app/api/[...path]/route.ts`                        | BFF: meneruskan `/api/v1/*` ke be-sada, merelai cookie.                                           |
| `src/app/api/[...path]/route.test.ts`                   | Test relai cookie dan penerusan.                                                                  |
| `src/app/providers.tsx`                                 | `QueryClientProvider` untuk seluruh aplikasi.                                                     |
| `src/config/menu.ts`                                    | Konstanta slug menu + ikon + rute per slug.                                                       |
| `src/config/menu.test.ts`                               | Menjaga kelengkapan 61 slug.                                                                      |
| `src/features/auth/types.ts`                            | `MenuNode`, `Session`, `MenuAction`.                                                              |
| `src/features/auth/get-session.ts`                      | Ambil sesi dari be-sada di sisi server (`server-only`).                                           |
| `src/features/auth/get-session.test.ts`                 | Test pembacaan sesi.                                                                              |
| `src/features/auth/session-provider.tsx`                | Context sesi untuk komponen client.                                                               |
| `src/features/auth/use-menu-access.ts`                  | `useMenuAccess(slug)` → `isCanView`/`isCanCreate`/`isCanUpdate`/`isCanDelete`.                    |
| `src/features/auth/use-menu-access.test.tsx`            | Test hak akses.                                                                                   |
| `src/features/auth/refresh.ts`                          | Penyegaran token satu-jalur (single-flight), dipakai `proxy.ts`.                                  |
| `src/features/auth/refresh.test.ts`                     | Test single-flight.                                                                               |
| `src/components/common/loading-page.tsx`                | Animasi huruf S · A · D, penuh layar.                                                             |
| `src/components/common/loading-page.module.css`         | Keyframes animasi huruf.                                                                          |
| `src/components/common/loading-global.tsx`              | Overlay spinner untuk mutation.                                                                   |
| `src/components/common/loading-list.tsx`                | Skeleton baris daftar.                                                                            |
| `src/components/layout/app-shell.tsx`                   | Kerangka layar: isi + navigasi bawah.                                                             |
| `src/components/layout/bottom-tab.tsx`                  | Empat tab: Dashboard, Ibadah, Pelayanan, Warta.                                                   |
| `src/components/layout/page-header.tsx`                 | Header layar: back, judul, aksi kanan.                                                            |
| `src/app/(auth)/login/page.tsx`                         | Halaman login.                                                                                    |
| `src/app/(auth)/login/login-form.tsx`                   | Form login (client).                                                                              |
| `src/app/(auth)/authentication/page.tsx`                | Gerbang bootstrap (Server Component).                                                             |
| `src/app/(auth)/authentication/loading.tsx`             | Merender `LoadingPage`.                                                                           |
| `src/app/(auth)/authentication/first-login-form.tsx`    | Form set username + password untuk akun `PENDING`.                                                |
| `src/app/(app)/layout.tsx`                              | App shell + `SessionProvider`.                                                                    |
| `src/app/(app)/loading.tsx`                             | Merender `LoadingGlobal`.                                                                         |
| `src/app/(app)/page.tsx`                                | Beranda sementara (tipis).                                                                        |
| `src/app/(app)/home-screen.tsx`                         | Isi beranda: pintasan modul dari menu tree, tanpa angka.                                          |
| `src/lib/api/cookie.ts`                                 | `stripCookieDomain`, dipakai BFF dan `proxy.ts`.                                                  |
| `src/lib/redirect.ts`                                   | Penjaga open redirect untuk `?redirect=`.                                                         |
| `src/components/common/button.tsx`                      | Re-export `Button` supaya `src/app/**` tidak menyentuh primitif.                                  |
| `src/components/common/bottom-sheet.tsx`                | Sheet dari bawah, di atas `<dialog>`.                                                             |
| `src/app/(app)/modul/page.tsx`                          | "Semua modul" — 12 domain dari menu tree.                                                         |
| `src/app/(app)/modul/module-sheet.tsx`                  | Sheet submenu saat satu domain diketuk.                                                           |
| `public/loading/sada-s.png`, `sada-a.png`, `sada-d.png` | Tiga huruf, 256×256, dipakai sebagai mask.                                                        |

**Diubah:**

| Berkas                                                     | Perubahan                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/types/api.ts`                                         | `Paginated<T>` yang salah diganti `ApiResponse`/`ApiListResponse`/`ApiErrorBody`.      |
| `src/proxy.ts`                                             | Ditambah gerbang auth dan penyegaran token; matcher ditambah entri untuk `/api`.       |
| `src/app/layout.tsx`                                       | `SiteHeader`/`SiteFooter` dilepas, `Providers` dipasang, font diganti Instrument Sans. |
| `src/config/navigation.ts`                                 | Dihapus — digantikan menu tree dari API.                                               |
| `src/components/layout/site-header.tsx`, `site-footer.tsx` | Dihapus — peninggalan situs profil.                                                    |
| `src/app/page.tsx`                                         | Dihapus — digantikan `(app)/page.tsx`.                                                 |
| `eslint.config.mjs`                                        | Aturan konvensi.                                                                       |
| `package.json`                                             | Tiga dependency baru.                                                                  |

---

## Fase 0 — Fondasi

### Task 1: Amplop API dan fetcher browser

**Files:**

- Modify: `src/types/api.ts` (ganti seluruh isi)
- Create: `src/lib/api/fetcher.ts`
- Test: `src/lib/api/fetcher.test.ts`

**Interfaces:**

- Consumes: tidak ada.
- Produces:
  - `type ApiResponse<T> = { status: number; message: string; data: T }`
  - `type ApiListResponse<T> = ApiResponse<T[]> & { totalData: number; totalPage: number }`
  - `type ApiErrorBody = { status: number; error: string }`
  - `class FetchError extends Error { readonly status: number }`
  - `fetchOne<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>>`
  - `fetchList<T>(path: string, init?: RequestInit): Promise<ApiListResponse<T>>`

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/lib/api/fetcher.test.ts`:

```ts
import { afterEach, describe, expect, mock, test } from "bun:test";

import { FetchError, fetchList, fetchOne } from "./fetcher";

const nativeFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = nativeFetch;
});

const stubFetch = (response: Response) => {
  const calls: { url: string; init?: RequestInit }[] = [];

  globalThis.fetch = mock(
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(input), init });
      return response;
    },
  ) as unknown as typeof fetch;

  return calls;
};

describe("fetchOne", () => {
  test("mengembalikan amplop utuh, bukan hanya data", async () => {
    stubFetch(
      Response.json({ status: 200, message: "Berhasil", data: { id: 1 } }),
    );

    const result = await fetchOne<{ id: number }>("/jemaat/A-0001");

    expect(result.message).toBe("Berhasil");
    expect(result.data.id).toBe(1);
  });

  test("menembak /api/v1 di origin sendiri, bukan be-sada", async () => {
    const calls = stubFetch(
      Response.json({ status: 200, message: "", data: null }),
    );

    await fetchOne("/jemaat");

    expect(calls[0].url).toBe("/api/v1/jemaat");
  });

  test("membaca pesan dari field error, bukan message", async () => {
    stubFetch(
      Response.json(
        { status: 404, error: "Jemaat Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const error = await fetchOne("/jemaat/X").catch((caught) => caught);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Jemaat Tidak Ditemukan");
  });

  test("tetap punya pesan walau badan respons bukan JSON", async () => {
    stubFetch(new Response("<html>502</html>", { status: 502 }));

    const error = await fetchOne("/jemaat").catch((caught) => caught);

    expect(error.status).toBe(502);
    expect(error.message).toContain("502");
  });
});

describe("fetchList", () => {
  test("meneruskan totalData dan totalPage dari level amplop", async () => {
    stubFetch(
      Response.json({
        status: 200,
        message: "Berhasil",
        totalData: 1284,
        totalPage: 65,
        data: [{ id: 1 }],
      }),
    );

    const result = await fetchList<{ id: number }>("/jemaat");

    expect(result.totalData).toBe(1284);
    expect(result.totalPage).toBe(65);
    expect(result.data).toHaveLength(1);
  });

  test("404 pada daftar jadi daftar kosong, bukan error", async () => {
    stubFetch(
      Response.json(
        { status: 404, error: "Jemaat Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const result = await fetchList("/jemaat?search=zzz");

    expect(result.data).toEqual([]);
    expect(result.totalData).toBe(0);
    expect(result.status).toBe(404);
  });

  test("500 pada daftar tetap error", async () => {
    stubFetch(
      Response.json(
        { status: 500, error: "Internal Server Error" },
        { status: 500 },
      ),
    );

    const error = await fetchList("/jemaat").catch((caught) => caught);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(500);
  });

  test("mengirim Content-Type hanya bila ada badan", async () => {
    const calls = stubFetch(
      Response.json({ status: 200, message: "", data: [] }),
    );

    await fetchList("/jemaat");
    await fetchOne("/jemaat", { method: "POST", body: JSON.stringify({}) });

    expect(new Headers(calls[0].init?.headers).get("content-type")).toBeNull();
    expect(new Headers(calls[1].init?.headers).get("content-type")).toBe(
      "application/json",
    );
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test src/lib/api/fetcher.test.ts`
Expected: FAIL — `Cannot find module './fetcher'`.

- [ ] **Step 3: Ganti isi `src/types/api.ts`**

```ts
/**
 * Bentuk respons be-sada, apa adanya.
 *
 * Sebelumnya berkas ini mendeklarasikan `Paginated<T>` dengan
 * `meta: { page, perPage, total, totalPages }`. Bentuk itu tidak pernah
 * dikirim be-sada dan diganti sebelum ada layar yang memakainya.
 */

/** Amplop sukses. Dipakai SELURUH endpoint. */
export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

/**
 * Amplop daftar. `totalData` dan `totalPage` berada DI LEVEL AMPLOP, bukan di
 * dalam objek `meta` — lihat `jemaat.controller.ts` di be-sada.
 */
export type ApiListResponse<T> = ApiResponse<T[]> & {
  totalData: number;
  totalPage: number;
};

/**
 * Amplop gagal. Perhatikan bahwa field pesannya `error`, BUKAN `message`:
 * `errorHandler.ts` di be-sada memakai nama itu di setiap cabangnya. Satu-satunya
 * tempat perbedaan ini boleh diurus adalah `readErrorMessage` di
 * `src/lib/api/fetcher.ts`.
 */
export type ApiErrorBody = {
  status: number;
  error: string;
};
```

- [ ] **Step 4: Tulis `src/lib/api/fetcher.ts`**

```ts
import type { ApiListResponse, ApiResponse } from "@/types/api";

/**
 * Prefix seluruh panggilan dari browser.
 *
 * Relatif, bukan absolut ke be-sada. Yang menjawabnya adalah route handler di
 * `src/app/api/[...path]/route.ts`, yang meneruskannya ke be-sada di sisi
 * server. Itulah yang membuat cookie sesi jadi same-origin — lihat keputusan
 * D1 di dokumen desain.
 */
const BASE_PATH = "/api/v1";

/** Kegagalan HTTP dari API, dengan pesan yang sudah layak ditampilkan. */
export class FetchError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FetchError";
    this.status = status;
  }
}

/**
 * be-sada menamai pesan galat `error`, sedangkan pesan sukses `message`.
 * Keduanya dicoba supaya perubahan di satu modul be-sada tidak memunculkan
 * "Permintaan gagal (400)" yang tidak menolong siapa pun.
 */
const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json();

    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;

      if (typeof record.error === "string") return record.error;
      if (typeof record.message === "string") return record.message;
    }
  } catch {
    // Badan bukan JSON — mis. halaman error dari reverse proxy. Jatuh ke
    // pesan default di bawah.
  }

  return `Permintaan gagal (${response.status}).`;
};

const onRequest = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${BASE_PATH}${path}`, {
    ...init,
    headers: {
      // Hanya diisi bila memang ada badan. Mengirim Content-Type pada GET
      // membuat sebagian reverse proxy menganggapnya permintaan bertubuh.
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

/**
 * Satu record, atau satu operasi tulis.
 *
 * Mengembalikan amplop UTUH, bukan `data` saja: pemanggil sering butuh
 * `message` untuk notifikasi sukses, dan membuka satu lapis di sini berarti
 * setiap pemanggil harus menebak kedalaman datanya.
 */
export async function fetchOne<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await onRequest(path, init);

  if (!response.ok) {
    throw new FetchError(response.status, await readErrorMessage(response));
  }

  return response.json() as Promise<ApiResponse<T>>;
}

/**
 * Daftar berpaginasi.
 *
 * be-sada membalas 404 ketika filter tidak menemukan apa pun. Bagi UI itu
 * keadaan normal yang menampilkan "tidak ada data", bukan layar error — jadi
 * penerjemahannya dilakukan SEKALI di sini, bukan di 61 layar. `status` yang
 * dikembalikan tetap 404 apa adanya; memalsukannya jadi 200 hanya menyulitkan
 * penelusuran nanti.
 *
 * Sengaja tidak berlaku untuk `fetchOne`: di sana 404 memang berarti record
 * yang diminta tidak ada.
 */
export async function fetchList<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiListResponse<T>> {
  const response = await onRequest(path, init);

  if (response.status === 404) {
    return {
      status: 404,
      message: await readErrorMessage(response),
      data: [],
      totalData: 0,
      totalPage: 0,
    };
  }

  if (!response.ok) {
    throw new FetchError(response.status, await readErrorMessage(response));
  }

  return response.json() as Promise<ApiListResponse<T>>;
}
```

- [ ] **Step 5: Jalankan test, pastikan lolos**

Run: `API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test src/lib/api/fetcher.test.ts`
Expected: PASS, 8 test.

- [ ] **Step 6: Pastikan tidak ada pemakai `Paginated` yang tertinggal**

Run: `grep -rn "Paginated" src/`
Expected: tidak mengeluarkan apa-apa.

- [ ] **Step 7: Gerbang penuh**

Run: `bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test`
Expected: lint bersih, typecheck bersih, 89 test lolos.

- [ ] **Step 8: Commit**

```bash
git add src/types/api.ts src/lib/api/fetcher.ts src/lib/api/fetcher.test.ts
git commit -m "$(cat <<'MSG'
feat(api): fetcher browser dan amplop respons be-sada yang sebenarnya

Paginated<T> dengan objek meta tidak pernah dikirim be-sada; yang dikirim
adalah totalData dan totalPage di level amplop, dan pesan galat memakai
field error, bukan message. Fetcher juga menerjemahkan 404-pada-daftar
menjadi daftar kosong sekali di satu tempat, bukan di tiap layar.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 2: BFF proxy — meneruskan `/api/v1/*` ke be-sada

**Files:**

- Create: `src/lib/api/cookie.ts`
- Create: `src/app/api/[...path]/route.ts`
- Test: `src/lib/api/cookie.test.ts`
- Test: `src/app/api/[...path]/route.test.ts`

**Interfaces:**

- Consumes: `env.API_BASE_URL` dari `src/lib/env.ts`.
- Produces:
  - `stripCookieDomain(setCookie: string): string` dari `@/lib/api/cookie`
  - Handler `GET`, `POST`, `PUT`, `PATCH`, `DELETE` pada rute `/api/[...path]`

`stripCookieDomain` tinggal di `src/lib/api/cookie.ts`, bukan di berkas route
handler-nya, karena `src/proxy.ts` juga memerlukannya di Task 10 — dan
mengimpor modul route handler dari proxy akan menyeret ikut `GET`/`POST` dan
seluruh yang mereka impor ke bundel proxy.

**Catatan penting sebelum menulis:**

be-sada menerbitkan cookie dengan atribut `Domain=<CORS_DOMAIN>`. Bila header
`Set-Cookie` itu diteruskan apa adanya, browser **menolaknya** karena domainnya
tidak mencakup origin FE — dan login akan gagal tanpa pesan apa pun. Atribut
`Domain` wajib dibuang; sisanya (`HttpOnly`, `Secure`, `SameSite`, `Max-Age`,
`Path`) diteruskan apa adanya.

Rute `/api/observability` yang sudah ada tidak terganggu: Next memenangkan
segmen statis atas catch-all.

- [ ] **Step 1: Baca dokumen route handler Next 16**

Run: `sed -n '1,140p' node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
Yang harus diperhatikan: `context.params` adalah **Promise** sejak v15, dan default caching `GET` sudah dinamis sejak v15.

- [ ] **Step 2: Tulis test yang gagal**

Buat `src/lib/api/cookie.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { stripCookieDomain } from "./cookie";

describe("stripCookieDomain", () => {
  test("membuang atribut Domain dan mempertahankan sisanya", () => {
    const result = stripCookieDomain(
      "accessToken=abc; Max-Age=900; Domain=api.sada.test; Path=/; HttpOnly; SameSite=Strict",
    );

    expect(result).not.toContain("Domain");
    expect(result).toContain("HttpOnly");
    expect(result).toContain("SameSite=Strict");
    expect(result).toContain("Max-Age=900");
  });

  test("tidak terganggu huruf besar-kecil dan spasi", () => {
    expect(stripCookieDomain("a=b;   DOMAIN=x.test; Path=/")).not.toContain(
      "x.test",
    );
  });
});
```

Dan `src/app/api/[...path]/route.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let server: ReturnType<typeof Bun.serve>;
let route: typeof import("./route");

let lastRequest: {
  method: string;
  url: string;
  cookie: string | null;
  body: string;
} | null = null;

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);

      lastRequest = {
        method: request.method,
        url: url.pathname + url.search,
        cookie: request.headers.get("cookie"),
        body: request.method === "GET" ? "" : await request.text(),
      };

      if (url.pathname === "/api/v1/auth/login") {
        return new Response(
          JSON.stringify({ status: 200, message: "Berhasil Login" }),
          {
            status: 200,
            headers: [
              ["content-type", "application/json"],
              [
                "set-cookie",
                "accessToken=abc; Max-Age=900; Domain=api.sada.test; Path=/; HttpOnly; SameSite=Strict",
              ],
              [
                "set-cookie",
                "refreshToken=def; Max-Age=604800; Domain=api.sada.test; Path=/; HttpOnly; SameSite=Strict",
              ],
            ],
          },
        );
      }

      return Response.json({ status: 200, message: "ok", data: null });
    },
  });

  process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;
  route = await import("./route");
});

afterAll(() => {
  server.stop(true);
});

const onCall = (
  method: string,
  path: string[],
  init?: { search?: string; body?: string; cookie?: string },
) => {
  const url = `http://localhost:3000/api/${path.join("/")}${init?.search ?? ""}`;

  const request = new Request(url, {
    method,
    body: init?.body,
    headers: init?.cookie ? { cookie: init.cookie } : undefined,
  });

  return { request, context: { params: Promise.resolve({ path }) } };
};

describe("BFF", () => {
  test("meneruskan path dan query ke be-sada", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      search: "?page=2",
    });

    await route.GET(request as never, context as never);

    expect(lastRequest?.url).toBe("/api/v1/jemaat?page=2");
  });

  test("meneruskan cookie masuk", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      cookie: "accessToken=abc",
    });

    await route.GET(request as never, context as never);

    expect(lastRequest?.cookie).toBe("accessToken=abc");
  });

  test("meneruskan badan permintaan tulis", async () => {
    const { request, context } = onCall("POST", ["v1", "jemaat"], {
      body: JSON.stringify({ name: "Christian Halim" }),
    });

    await route.POST(request as never, context as never);

    expect(JSON.parse(lastRequest?.body ?? "{}").name).toBe("Christian Halim");
  });

  test("merelai kedua Set-Cookie tanpa atribut Domain", async () => {
    const { request, context } = onCall("POST", ["v1", "auth", "login"], {
      body: JSON.stringify({ username: "a", password: "b" }),
    });

    const response = await route.POST(request as never, context as never);
    const cookies = response.headers.getSetCookie();

    expect(cookies).toHaveLength(2);
    expect(cookies.some((cookie) => cookie.startsWith("accessToken="))).toBe(
      true,
    );
    expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(
      true,
    );
    expect(
      cookies.every((cookie) => !cookie.toLowerCase().includes("domain")),
    ).toBe(true);
  });

  test("menolak segmen path yang menembus direktori", async () => {
    const { request, context } = onCall("GET", ["v1", "..", "admin"]);

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 3: Jalankan test, pastikan gagal**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/app/api`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 4: Tulis `src/app/api/[...path]/route.ts`**

Lebih dulu `src/lib/api/cookie.ts`:

```ts
/**
 * Membuang atribut `Domain` dari satu header `Set-Cookie`.
 *
 * be-sada memasang `Domain=<CORS_DOMAIN>` pada cookie sesinya. Diteruskan apa
 * adanya, browser MENOLAK cookie itu karena domainnya tidak mencakup origin
 * FE — dan penolakan itu tidak memunculkan error apa pun: login sekadar tidak
 * pernah jadi. Tanpa atribut `Domain`, cookie berlaku untuk host yang
 * mengirimnya, yaitu persis yang kita mau.
 *
 * Atribut lain (`HttpOnly`, `Secure`, `SameSite`, `Max-Age`, `Path`)
 * diteruskan apa adanya.
 *
 * Tinggal di sini, bukan di route handler, karena `src/proxy.ts` juga
 * memakainya — dan mengimpor modul route handler dari proxy akan menyeret
 * handler HTTP-nya ikut ke bundel proxy.
 */
export function stripCookieDomain(setCookie: string): string {
  return setCookie
    .split(";")
    .filter((part) => !/^\s*domain\s*=/i.test(part))
    .join(";");
}
```

Lalu `src/app/api/[...path]/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { stripCookieDomain } from "@/lib/api/cookie";
import { env } from "@/lib/env";

/**
 * BFF — satu-satunya jalan browser menuju be-sada.
 *
 * Alasannya cookie, bukan kerapian. be-sada menaruh sesi di cookie `httpOnly`
 * bertanda tangan, dan cookie terikat pada origin yang menerbitkannya. Kalau
 * browser menembak be-sada langsung, cookie hanya ikut bila be-sada memasang
 * CORS berkredensial dan menandai cookienya `SameSite=None; Secure` — dan
 * cookie lintas-situs seperti itu diblokir makin agresif oleh Safari/iOS,
 * tepat pada perangkat yang paling banyak memakai aplikasi ini.
 *
 * Dengan diteruskan dari sini, cookie terbit dari origin yang sama seperti
 * halamannya. `SameSite=Strict` bawaan be-sada justru jadi benar, CORS tidak
 * diperlukan, dan be-sada tidak perlu diubah sedikit pun.
 *
 * Rute `/api/observability` yang sudah ada tidak tertutup catch-all ini:
 * segmen statis menang atas catch-all di Next.
 */

/**
 * Header yang hanya bermakna untuk satu lompatan koneksi. Meneruskannya
 * membuat respons rusak — `content-length` yang tidak lagi cocok setelah
 * badan di-stream ulang adalah yang paling sering menggigit.
 */
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

/** Method yang boleh membawa badan; sisanya `request.body` selalu null. */
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const onBuildForwardHeaders = (request: NextRequest): Headers => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
};

const onHandle = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> => {
  const { path } = await context.params;

  // Router Next tidak meloloskan ".." sebagai segmen, tapi penjaga ini tidak
  // boleh bergantung pada perilaku itu: yang dijaga adalah kemampuan
  // menembak host be-sada di luar prefix yang dimaksud.
  if (path.some((segment) => segment === "." || segment === "..")) {
    return Response.json(
      { status: 400, error: "Path tidak valid" },
      { status: 400 },
    );
  }

  const target = `${env.API_BASE_URL}/${path.join("/")}${request.nextUrl.search}`;

  const isBodyAllowed =
    METHODS_WITH_BODY.has(request.method) && request.body !== null;

  const upstream = await fetch(target, {
    method: request.method,
    headers: onBuildForwardHeaders(request),
    body: isBodyAllowed ? request.body : undefined,
    // Wajib ketika badan berupa stream; tanpa ini fetch menolak dengan
    // "RequestInit: duplex option is required when sending a body".
    ...(isBodyAllowed ? { duplex: "half" } : {}),
    // Pengalihan diteruskan ke browser, tidak diikuti di sini — mengikutinya
    // berarti cookie untuk host lain ikut terkirim.
    redirect: "manual",
    // Respons terautentikasi tidak boleh masuk Data Cache Next. Kuncinya URL,
    // bukan user, sehingga data satu user akan tersaji ke user lain.
    cache: "no-store",
  } as RequestInit & { duplex?: "half" });

  const headers = new Headers(upstream.headers);

  // `new Headers(...)` menggabungkan beberapa Set-Cookie jadi satu string
  // berkoma, yang bukan header yang sah. Jadi dibuang lalu dipasang ulang
  // satu per satu lewat getSetCookie().
  headers.delete("set-cookie");

  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append("set-cookie", stripCookieDomain(cookie));
  }

  return new Response(upstream.body, { status: upstream.status, headers });
};

export const GET = onHandle;
export const POST = onHandle;
export const PUT = onHandle;
export const PATCH = onHandle;
export const DELETE = onHandle;
```

- [ ] **Step 5: Jalankan test, pastikan lolos**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/app/api src/lib/api/cookie.test.ts`
Expected: PASS, 7 test (2 di cookie.test.ts, 5 di route.test.ts).

- [ ] **Step 6: Gerbang penuh**

Run: `bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test`
Expected: 96 test lolos.

- [ ] **Step 7: Commit**

```bash
git add src/app/api src/lib/api/cookie.ts src/lib/api/cookie.test.ts
git commit -m "$(cat <<'MSG'
feat(api): teruskan panggilan api ke be-sada lewat route handler

Browser menembak origin sendiri, bukan be-sada, supaya cookie sesi jadi
same-origin dan tidak bergantung pada cookie lintas-situs yang diblokir
Safari/iOS. Atribut Domain dibuang dari Set-Cookie yang direlai; tanpa itu
browser menolak cookienya dan login gagal tanpa pesan apa pun.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 3: TanStack Query

**Files:**

- Modify: `package.json`
- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**

- Consumes: `FetchError` dari `src/lib/api/fetcher.ts`.
- Produces: `<Providers>{children}</Providers>` dari `@/app/providers`.

**Konvensi kunci query** (tidak ada registri terpusat; ditulis di sini supaya seragam):
`[<slug menu>, "list", params]` untuk daftar, `[<slug menu>, "detail", code]` untuk satu record.

- [ ] **Step 1: Pasang dependency**

Run: `bun add @tanstack/react-query@^5.102.8`
Expected: `package.json` bertambah satu dependency.

- [ ] **Step 2: Tulis `src/app/providers.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { FetchError } from "@/lib/api/fetcher";

/**
 * `QueryClient` dibuat di dalam state, bukan di module scope.
 *
 * Module scope di App Router dibagi antar-request di server, jadi satu client
 * global berarti cache satu user bisa tersaji ke user lain — kelas bug yang
 * sama dengan yang dijaga `apiClient`. `useState` dengan initializer membuat
 * satu client per sesi browser, dan tidak pernah dibuat ulang saat re-render.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cukup untuk menahan refetch saat berpindah tab bolak-balik,
            // cukup pendek supaya data jemaat tidak terasa basi.
            staleTime: 30_000,

            // 4xx berarti permintaannya sendiri yang salah — mengulanginya
            // tiga kali hanya menunda pesan galat sampai ke user. 401 apalagi:
            // yang menyelesaikannya penyegaran token di proxy.ts, bukan retry.
            retry: (failureCount, error) =>
              error instanceof FetchError && error.status < 500
                ? false
                : failureCount < 2,

            // Aplikasi ini dipakai berjam-jam dengan layar terbuka. Refetch
            // tiap kali jendela difokuskan berarti puluhan permintaan yang
            // tidak diminta siapa pun.
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 3: Pasang di `src/app/layout.tsx`**

Ganti font dan bungkus isi. Bagian yang berubah:

```tsx
import { Instrument_Sans } from "next/font/google";

import { Providers } from "@/app/providers";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});
```

Dan badan `RootLayout` jadi:

```tsx
return (
  <html lang="id" className={`${instrumentSans.variable} h-full antialiased`}>
    <body className="flex min-h-full flex-col">
      <ServiceWorkerProvider />
      <Providers>{children}</Providers>
    </body>
  </html>
);
```

Hapus impor dan pemakaian `Geist`, `Geist_Mono`, `SiteHeader`, `SiteFooter`.
`--font-geist-mono` di `globals.css` (`--font-mono`) dibiarkan; tidak ada yang memakainya dan menghapusnya bukan bagian task ini.

- [ ] **Step 4: Hapus peninggalan situs profil**

```bash
git rm src/components/layout/site-header.tsx src/components/layout/site-footer.tsx src/config/navigation.ts src/app/page.tsx
```

`src/app/page.tsx` dihapus karena beranda pindah ke `(app)/page.tsx` di Task 12. Sampai task itu selesai, `/` akan 404 di dev — itu diharapkan.

- [ ] **Step 5: Pastikan tidak ada yang tertinggal merujuk berkas yang dihapus**

Run: `grep -rn "site-header\|site-footer\|config/navigation\|mainNav" src/`
Expected: tidak mengeluarkan apa-apa.

- [ ] **Step 6: Gerbang penuh**

Run: `bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test`
Expected: hijau. Jumlah test bisa berkurang bila ada test yang menyertai berkas yang dihapus — catat angkanya.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'MSG'
feat(query): pasang tanstack query dan lepas sisa situs profil

QueryClient dibuat di dalam state, bukan module scope: module scope dibagi
antar-request di server, jadi satu client global berarti cache satu user
bisa tersaji ke user lain. Header, footer, dan navigasi situs profil dibuang
bersamaan karena app shell menggantikannya.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 4: Konvensi yang ditegakkan ESLint

**Files:**

- Modify: `eslint.config.mjs`
- Create: `tests/fixtures/eslint-konvensi.tsx` (fixture yang sengaja melanggar)

**Interfaces:**

- Consumes: tidak ada.
- Produces: aturan lint yang berlaku untuk seluruh task berikutnya.

**Ruang lingkup yang jujur.** Spec §7 menyebut "aturan 1–5 diperiksa mekanis".
Itu terlalu optimistis. Yang benar-benar bisa ditegakkan tanpa menulis plugin
ESLint sendiri ada empat, dan menulis plugin sendiri untuk sisanya adalah
persis jenis pekerjaan yang tidak sebanding hasilnya:

| Aturan                                                 | Mekanis?                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `useState` boolean dilarang                            | ya — `no-restricted-syntax`                                  |
| Nama hasil `useBoolean` diawali `is`                   | ya — `no-restricted-syntax`                                  |
| `.map()` di JSX wajib `key`                            | ya — `react/jsx-key`, sudah aktif lewat `eslint-config-next` |
| `src/app/**` dilarang impor `@/components/ui/*`        | ya — `no-restricted-imports`                                 |
| Nama fungsi diawali `on`, state pilihan diawali `pick` | tidak — ditegakkan saat review                               |
| Urutan blok state → function → useEffect → return      | tidak — ditegakkan saat review                               |

- [ ] **Step 1: Tulis fixture pelanggaran**

Buat `tests/fixtures/eslint-konvensi.tsx`:

```tsx
/* eslint-disable */
// Berkas ini SENGAJA melanggar. Ia tidak pernah diimpor kode produksi; yang
// memakainya hanya Step 3 di Task 4, yang menjalankan eslint terhadapnya untuk
// membuktikan aturan konvensi benar-benar menyala. Baris `eslint-disable` di
// atas dicabut oleh perintah di step itu lewat --no-inline-config.
import { useState } from "react";

import { useBoolean } from "@/hooks/use-boolean";

export function Pelanggar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState<boolean>(true);
  const hasFetched = useBoolean();

  return (
    <div onClick={() => setIsOpen(!isOpen)}>
      {String(isReady || hasFetched.value)}
    </div>
  );
}
```

- [ ] **Step 2: Tambah aturan di `eslint.config.mjs`**

Sisipkan blok berikut ke dalam array `defineConfig([...])`, **sebelum**
`eslintConfigPrettier` (yang harus tetap paling akhir):

```js
  // Konvensi penamaan SADA. Dua aturan pertama menegakkan yang paling sering
  // dilanggar dan paling mudah dicek mekanis; sisanya (nama fungsi diawali
  // "on", urutan blok state/function/useEffect/return) ditegakkan saat review,
  // karena menulis plugin ESLint sendiri untuk itu jauh lebih mahal daripada
  // manfaatnya.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='useState'] > Literal[value=true], CallExpression[callee.name='useState'] > Literal[value=false]",
          message:
            "State boolean wajib memakai useBoolean() dari @/hooks/use-boolean, bukan useState.",
        },
        {
          selector:
            "CallExpression[callee.name='useState'][typeArguments.params.0.type='TSBooleanKeyword']",
          message:
            "State boolean wajib memakai useBoolean() dari @/hooks/use-boolean, bukan useState<boolean>.",
        },
        {
          selector:
            "VariableDeclarator[init.callee.name='useBoolean'][id.name!=/^is[A-Z0-9]/]",
          message:
            "Nama state boolean wajib diawali \"is\". \"has\", \"should\", \"can\", dan \"show\" tidak dikecualikan.",
        },
      ],
    },
  },

  // Layar hanya boleh memakai wrapper, bukan primitif shadcn langsung. Begitu
  // satu layar merangkai primitif sendiri, warna dan jaraknya ikut tersalin ke
  // layar itu, dan dua halaman sejenis pelan-pelan berbeda tanpa ada yang
  // sadar. Yang boleh menyentuh primitif hanya components/common dan
  // components/layout.
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              message:
                "Layar memakai wrapper di @/components/common, bukan primitif shadcn langsung.",
            },
          ],
        },
      ],
    },
  },
```

- [ ] **Step 3: Buktikan aturannya menyala**

Run: `bunx eslint --no-inline-config tests/fixtures/eslint-konvensi.tsx`
Expected: FAIL dengan tiga error — dua "wajib memakai useBoolean" dan satu
"wajib diawali \"is\"".

Bila selector `typeArguments` tidak menangkap `useState<boolean>(true)`, coba
ganti `typeArguments` menjadi `typeParameters` — namanya berubah antar-versi
typescript-eslint. Jalankan ulang sampai ketiga error muncul.

- [ ] **Step 4: Pastikan kode yang ada tidak ikut kena**

Run: `bun run lint`
Expected: bersih. `src/hooks/use-boolean.ts` sendiri memakai `useState(initial)`
dengan parameter, bukan literal, jadi tidak tertangkap selector mana pun.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.mjs tests/fixtures/eslint-konvensi.tsx
git commit -m "$(cat <<'MSG'
chore(lint): tegakkan konvensi boolean dan larangan impor primitif

Aturan yang cuma ditulis di dokumen akan dilanggar diam-diam di layar
ke-40. Empat yang bisa dicek mekanis dipasang di sini; nama fungsi berawalan
on dan urutan blok tetap urusan review, karena plugin sendiri untuk itu
lebih mahal daripada manfaatnya.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Fase 1 — Gerbang & App Shell

### Task 5: Konstanta menu, tipe sesi, dan pembaca sesi sisi server

**Files:**

- Create: `src/config/menu.ts`
- Create: `src/features/auth/types.ts`
- Create: `src/features/auth/get-session.ts`
- Test: `src/features/auth/get-session.test.ts`

**Interfaces:**

- Consumes: `apiClient`, `ApiError` dari `src/lib/api/client.ts`; `ApiResponse` dari `src/types/api.ts`.
- Produces:
  - `MENU` — objek konstanta slug; `MenuSlug` — union tipenya.
  - `MENU_ICON: Record<string, LucideIcon>` — ikon per slug domain.
  - `menuHref(groupSlug: string, leafSlug: string): string`
  - `type MenuAction = "VIEW" | "CREATE" | "UPDATE" | "DELETE" | "RESET" | "APPROVE" | "REJECT"`
  - `type MenuNode = { publicId: string; slug: string; name: string; order: number; action: MenuAction[]; children: MenuNode[] }`
  - `type Session = { code: string; username: string; status: UserStatus; roleUser: { name: string; isAdmin: boolean }; jemaat: { name: string } | null; menu: MenuNode[] }`
  - `type UserStatus = "PENDING" | "ACTIVE" | "DEACTIVATED"`
  - `getSession(): Promise<Session | null>`

- [ ] **Step 1: Tulis `src/features/auth/types.ts`**

```ts
import { z } from "zod";

/**
 * Aksi yang bisa dipegang sebuah peran atas satu menu.
 *
 * Cerminan `enum MenuAction` di `be-sada/src/config/schema.prisma:409`. RESET
 * bukan sinonim UPDATE: ia menerbitkan ulang kredensial sekaligus mencabut
 * sesi.
 */
export const MENU_ACTIONS = [
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESET",
  "APPROVE",
  "REJECT",
] as const;

export type MenuAction = (typeof MENU_ACTIONS)[number];

export type MenuNode = {
  publicId: string;
  slug: string;
  name: string;
  order: number;
  action: MenuAction[];
  children: MenuNode[];
};

/**
 * Schema divalidasi di batas jaringan, bukan diasumsikan.
 *
 * `z.lazy` dipakai karena simpul menu bersarang ke dirinya sendiri; tanpa itu
 * referensinya dipakai sebelum terdefinisi.
 */
export const menuNodeSchema: z.ZodType<MenuNode> = z.lazy(() =>
  z.object({
    publicId: z.string(),
    slug: z.string(),
    name: z.string(),
    order: z.number(),
    action: z.array(z.enum(MENU_ACTIONS)),
    children: z.array(menuNodeSchema),
  }),
);

export const USER_STATUSES = ["PENDING", "ACTIVE", "DEACTIVATED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Sesi seperti yang dipakai FE.
 *
 * `GET /api/v1/auth/me` mengembalikan JAUH lebih banyak field daripada ini —
 * seluruh baris user beserta jemaat dan role jemaatnya. Yang didaftarkan di
 * sini hanya yang benar-benar dipakai; Zod membuang sisanya, sehingga tidak
 * ada field yang diam-diam terpakai tanpa pernah dideklarasikan.
 *
 * `jemaat` nullable di tipe ini walau kolomnya wajib di skema be-sada:
 * relasinya bisa saja tidak ikut ter-include pada endpoint lain yang memakai
 * tipe yang sama, dan menyalakan crash di layar sapaan karena itu tidak
 * sebanding.
 */
export const sessionSchema = z.object({
  code: z.string(),
  username: z.string(),
  status: z.enum(USER_STATUSES),
  roleUser: z.object({
    name: z.string(),
    isAdmin: z.boolean(),
  }),
  jemaat: z.object({ name: z.string() }).nullable().default(null),
  menu: z.array(menuNodeSchema),
});

export type Session = z.infer<typeof sessionSchema>;
```

- [ ] **Step 2: Tulis `src/config/menu.ts`**

```ts
import {
  CalendarDays,
  Church,
  ClipboardList,
  CreditCard,
  Flag,
  House,
  Package,
  PiggyBank,
  Settings,
  ShoppingBasket,
  Stamp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

/**
 * Slug menu, disalin dari `be-sada/src/common/constants/menu.ts`.
 *
 * Ada di sini supaya kode FE menyebut menu lewat konstanta, bukan literal
 * string: `useMenuAccess(MENU.DAFTAR_JEMAAT)` gagal saat compile bila salah
 * ketik, sedangkan `useMenuAccess("DAFTAR_JEMAT")` gagal diam-diam dengan
 * menyembunyikan tombol yang seharusnya ada.
 *
 * Yang TIDAK ada di sini: struktur pohonnya. Pohon dan labelnya datang dari
 * API, sehingga menu yang ditambahkan be-sada muncul tanpa rilis FE.
 */
export const MENU = {
  // Domain
  KEJEMAATAN: "KEJEMAATAN",
  PELAYANAN: "PELAYANAN",
  PERIBADAHAN: "PERIBADAHAN",
  KEGIATAN: "KEGIATAN",
  FASILITAS: "FASILITAS",
  INVENTARIS: "INVENTARIS",
  PENGADAAN: "PENGADAAN",
  KEUANGAN: "KEUANGAN",
  ANGGARAN: "ANGGARAN",
  SDM: "SDM",
  PERSETUJUAN: "PERSETUJUAN",
  PENGATURAN: "PENGATURAN",

  // Kejemaatan
  DAFTAR_JEMAAT: "DAFTAR_JEMAAT",
  KELUARGA: "KELUARGA",
  PERNIKAHAN: "PERNIKAHAN",
  RIWAYAT_JEMAAT: "RIWAYAT_JEMAAT",
  ROLE_JEMAAT: "ROLE_JEMAAT",
  BAPEL: "BAPEL",
  REPORT_JEMAAT: "REPORT_JEMAAT",

  // Pelayanan
  JADWAL_PELAYAN: "JADWAL_PELAYAN",
  TEMPLATE_JADWAL: "TEMPLATE_JADWAL",
  DAFTAR_PELAYAN: "DAFTAR_PELAYAN",
  ROLE_PELAYAN: "ROLE_PELAYAN",
  SKILL_MUSIK: "SKILL_MUSIK",

  // Peribadahan
  IBADAH: "IBADAH",
  TIPE_IBADAH: "TIPE_IBADAH",

  // Kegiatan
  EVENT: "EVENT",
  PENDAFTARAN_EVENT: "PENDAFTARAN_EVENT",
  GALERI: "GALERI",
  PENGUMUMAN: "PENGUMUMAN",

  // Fasilitas
  PEMINJAMAN_RUANG: "PEMINJAMAN_RUANG",
  RUANG: "RUANG",

  // Inventaris
  BARANG: "BARANG",
  TIPE_BARANG: "TIPE_BARANG",
  SATUAN: "SATUAN",
  BARANG_PERSEDIAAN: "BARANG_PERSEDIAAN",
  MUTASI_STOK: "MUTASI_STOK",
  STOK_OPNAME: "STOK_OPNAME",
  SIKLUS_ASET: "SIKLUS_ASET",
  PENYUSUTAN: "PENYUSUTAN",

  // Pengadaan
  SUPPLIER: "SUPPLIER",
  PERMINTAAN_PEMBELIAN: "PERMINTAAN_PEMBELIAN",
  PESANAN_PEMBELIAN: "PESANAN_PEMBELIAN",
  PENERIMAAN_BARANG: "PENERIMAAN_BARANG",
  RETUR_PEMBELIAN: "RETUR_PEMBELIAN",
  FAKTUR_SUPPLIER: "FAKTUR_SUPPLIER",

  // Keuangan
  PERSEMBAHAN: "PERSEMBAHAN",
  TIPE_PERSEMBAHAN: "TIPE_PERSEMBAHAN",
  AKUN: "AKUN",
  KAS_MASUK: "KAS_MASUK",
  KAS_KELUAR: "KAS_KELUAR",
  JURNAL: "JURNAL",
  PERIODE_FISKAL: "PERIODE_FISKAL",
  LAPORAN_KEUANGAN: "LAPORAN_KEUANGAN",
  PEMBAYARAN: "PEMBAYARAN",
  MATA_UANG: "MATA_UANG",
  SETELAN_AKUNTANSI: "SETELAN_AKUNTANSI",

  // Anggaran
  PROGRAM: "PROGRAM",
  LAPORAN_BUDGET: "LAPORAN_BUDGET",
  PAGU_ANGGARAN: "PAGU_ANGGARAN",

  // SDM
  KARYAWAN: "KARYAWAN",
  CUTI: "CUTI",
  TIPE_CUTI: "TIPE_CUTI",
  KONTRAK_KARYAWAN: "KONTRAK_KARYAWAN",
  ABSENSI_KARYAWAN: "ABSENSI_KARYAWAN",
  PAYROLL: "PAYROLL",
  KOMPONEN_PAYROLL: "KOMPONEN_PAYROLL",
  PAJAK_PPH21: "PAJAK_PPH21",

  // Persetujuan
  PERMINTAAN_PERSETUJUAN: "PERMINTAAN_PERSETUJUAN",
  SETELAN_PERSETUJUAN: "SETELAN_PERSETUJUAN",

  // Pengaturan
  USER: "USER",
  ROLE_USER: "ROLE_USER",
  ACTIVITY_LOG: "ACTIVITY_LOG",
} as const;

export type MenuSlug = (typeof MENU)[keyof typeof MENU];

/**
 * Ikon per domain. Hanya 12 entri, karena hanya domain yang dirender
 * berikon — layar daun tampil sebagai baris teks di dalam sheet.
 */
export const MENU_ICON: Record<string, LucideIcon> = {
  [MENU.KEJEMAATAN]: UserPlus,
  [MENU.PELAYANAN]: CalendarDays,
  [MENU.PERIBADAHAN]: Church,
  [MENU.KEGIATAN]: Flag,
  [MENU.FASILITAS]: House,
  [MENU.INVENTARIS]: Package,
  [MENU.PENGADAAN]: ShoppingBasket,
  [MENU.KEUANGAN]: CreditCard,
  [MENU.ANGGARAN]: PiggyBank,
  [MENU.SDM]: ClipboardList,
  [MENU.PERSETUJUAN]: Stamp,
  [MENU.PENGATURAN]: Settings,
};

/**
 * Rute satu layar diturunkan dari slugnya, bukan dari tabel 61 baris.
 *
 * Tabel semacam itu harus dijaga sejalan dengan be-sada setiap kali ada menu
 * baru, dan yang terlupakan akan menghasilkan tautan ke 404. Turunan ini
 * selalu benar selama konvensi rutenya dipatuhi: `/<domain>/<layar>`, keduanya
 * kebab-case dari slug.
 */
export const menuHref = (groupSlug: string, leafSlug: string): string =>
  `/${toKebabCase(groupSlug)}/${toKebabCase(leafSlug)}`;

const toKebabCase = (slug: string): string =>
  slug.toLowerCase().replaceAll("_", "-");
```

- [ ] **Step 3: Tulis test yang gagal untuk `getSession`**

Buat `src/features/auth/get-session.test.ts`:

```ts
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
```

- [ ] **Step 4: Jalankan test, pastikan gagal**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/features/auth`
Expected: FAIL — `Cannot find module './get-session'`.

- [ ] **Step 5: Tulis `src/features/auth/get-session.ts`**

```ts
import "server-only";

import { cookies } from "next/headers";

import { ApiError, apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

import { sessionSchema, type Session } from "./types";

/**
 * Sesi user yang sedang masuk, beserta seluruh menu tree dan hak aksesnya.
 *
 * Satu panggilan, bukan dua: `authService.findUnique` di be-sada sudah
 * menggabungkan user dengan `menuService.findTree`.
 *
 * `:code` di path sengaja diisi "me". be-sada mengabaikannya dan bertindak
 * atas `req.user.code` — lihat komentar di `auth.controller.ts:55`. Cookie
 * `httpOnly`, jadi FE memang tidak punya cara membaca kode usernya sendiri,
 * dan tidak perlu.
 *
 * Dipanggil dari Server Component, jadi cookienya diteruskan manual: fetch di
 * server tidak membawa cookie permintaan masuk dengan sendirinya.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Tanpa cookie tidak ada yang bisa ditanyakan, dan menembak API hanya untuk
  // menerima 401 berarti satu perjalanan bolak-balik pada setiap kunjungan
  // anonim.
  if (!cookieHeader) return null;

  try {
    const response = await apiClient<ApiResponse<Session>>("/v1/auth/me", {
      headers: { Cookie: cookieHeader },
      // Tidak ada opsi cache di sini, dan itu disengaja: apiClient memakai
      // "no-store" secara default, dan menggabungkan caching eksplisit dengan
      // header Cookie akan ditolak penjaganya sendiri.
      schema: z.object({
        status: z.number(),
        message: z.string(),
        data: sessionSchema,
      }),
    });

    return response.data;
  } catch (error) {
    // 401 adalah jawaban yang sah untuk "siapa yang sedang masuk?" — tidak
    // ada. Yang memutuskan apa yang terjadi berikutnya adalah pemanggil.
    if (
      error instanceof ApiError &&
      error.kind === "http" &&
      error.status === 401
    ) {
      return null;
    }

    throw error;
  }
}
```

Tambahkan `import { z } from "zod";` di daftar impor teratas berkas itu.

- [ ] **Step 6: Jalankan test, pastikan lolos**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/features/auth`
Expected: PASS, 5 test.

- [ ] **Step 7: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add src/config/menu.ts src/features/auth
git commit -m "$(cat <<'MSG'
feat(auth): baca sesi dan menu tree dari be-sada di sisi server

Satu panggilan ke /auth/me mengembalikan user beserta seluruh menu tree dan
hak aksesnya, jadi tidak ada perjalanan kedua. Rute layar diturunkan dari
slug, bukan dari tabel 61 baris yang harus dijaga sejalan dengan be-sada.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 6: `LoadingPage` — animasi huruf S · A · D

**Files:**

- Create: `public/loading/sada-s.png`, `public/loading/sada-a.png`, `public/loading/sada-d.png`
- Create: `src/components/common/loading-page.tsx`
- Create: `src/components/common/loading-page.module.css`

**Interfaces:**

- Consumes: tidak ada.
- Produces: `<LoadingPage />` dari `@/components/common/loading-page`.

**Kenapa mask, bukan `<img>` dan bukan SVG.** Aslinya tiga PNG 3000×3000
berukuran ~60 KB masing-masing untuk satu bentuk datar satu warna yang
dirender 200×200 — 190 KB untuk layar tunggu, pada aplikasi yang layar
tunggunya justru sedang dicoba diperhalus. Menelusurnya jadi SVG akan meleset:
hurufnya isometrik dengan lubang counter di dalamnya, dan `potrace` tidak
terpasang. Yang dipakai: PNG diperkecil jadi 256×256 (17 KB untuk ketiganya),
lalu dirender sebagai `mask-image` dengan `background-color: currentColor` —
alpha PNG jadi maskernya, warnanya datang dari CSS, sehingga ikut tema gelap
persis seperti SVG `currentColor`.

Kanvas 3000×3000 sengaja TIDAK dipotong ke isi. Ketiga huruf mengandalkan
kanvas yang sama untuk bertemu sejajar di tengah; memotongnya per huruf akan
menggeser titik temunya.

- [ ] **Step 1: Perkecil ketiga aset**

```bash
mkdir -p public/loading
SRC=/Users/lexferndo/Documents/Project/gki-graharaya/fe-gkigraharaya/src/assets/picture
sips -Z 256 "$SRC/logo_sada_S.png" --out public/loading/sada-s.png
sips -Z 256 "$SRC/logo_sada_A.png" --out public/loading/sada-a.png
sips -Z 256 "$SRC/logo_sada_D.png" --out public/loading/sada-d.png
ls -l public/loading
```

Expected: tiga berkas, masing-masing di bawah 7 KB.

- [ ] **Step 2: Tulis `src/components/common/loading-page.module.css`**

Keyframes disalin dari `fe-gkigraharaya/src/components/Loading/custom.module.css`
tanpa perubahan nilai: S masuk dari kiri (−90px), A dari kanan (+125px), D dari
bawah (+125px); masing-masing 2 detik, `ease-in-out`, `infinite`.

```css
.stage {
  position: relative;
  display: flex;
  width: 200px;
  height: 200px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/*
 * Bukan <img>. Alpha PNG dipakai sebagai masker dan warnanya diambil dari
 * `currentColor`, sehingga huruf mengikuti tema gelap — yang tidak mungkin
 * kalau pikselnya sendiri yang berwarna. Prefix -webkit- masih diperlukan
 * untuk Safari di bawah 15.4.
 */
.letter {
  position: absolute;
  width: 200px;
  height: 200px;
  background-color: currentColor;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.letterS {
  -webkit-mask-image: url("/loading/sada-s.png");
  mask-image: url("/loading/sada-s.png");
  animation: floatS 2s ease-in-out infinite;
}

.letterA {
  -webkit-mask-image: url("/loading/sada-a.png");
  mask-image: url("/loading/sada-a.png");
  animation: floatA 2s ease-in-out infinite;
}

.letterD {
  -webkit-mask-image: url("/loading/sada-d.png");
  mask-image: url("/loading/sada-d.png");
  animation: floatD 2s ease-in-out infinite;
}

@keyframes floatS {
  0% {
    transform: translateX(-90px);
    opacity: 1;
  }
  20% {
    transform: translateX(0);
    opacity: 1;
  }
  40% {
    transform: translateX(0) rotate(5deg);
    opacity: 1;
  }
  60% {
    transform: translateX(0) rotate(-5deg);
    opacity: 1;
  }
  80% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateX(0);
    opacity: 0;
  }
}

@keyframes floatA {
  0% {
    transform: translateX(125px);
    opacity: 1;
  }
  20% {
    transform: translateX(0);
    opacity: 1;
  }
  40% {
    transform: translateX(0) rotate(5deg);
    opacity: 1;
  }
  60% {
    transform: translateX(0) rotate(-5deg);
    opacity: 1;
  }
  80% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateX(0);
    opacity: 0;
  }
}

@keyframes floatD {
  0% {
    transform: translateY(125px);
    opacity: 1;
  }
  20% {
    transform: translateY(0);
    opacity: 1;
  }
  40% {
    transform: translateY(0) rotate(5deg);
    opacity: 1;
  }
  60% {
    transform: translateY(0) rotate(-5deg);
    opacity: 1;
  }
  80% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0;
  }
}

/*
 * Animasi yang berulang tanpa henti adalah salah satu pemicu yang paling
 * sering disebut orang dengan gangguan vestibular. Yang tersisa tetap
 * memberi tahu bahwa sesuatu sedang berjalan, tanpa gerakan.
 */
@media (prefers-reduced-motion: reduce) {
  .letterS,
  .letterA,
  .letterD {
    animation: none;
  }
}
```

- [ ] **Step 3: Tulis `src/components/common/loading-page.tsx`**

```tsx
import styles from "./loading-page.module.css";

/**
 * Layar tunggu penuh dengan animasi huruf S · A · D.
 *
 * Dipakai HANYA saat bootstrap — `(auth)/authentication/loading.tsx`. Animasi
 * ini berdurasi 2 detik dan berakhir pada `opacity: 0`, jadi menempatkannya di
 * tunggu pendek (simpan yang selesai 300ms, pindah layar di dalam app shell)
 * hanya memperlihatkan kedipan huruf setengah jalan. Untuk itu ada
 * `LoadingGlobal`.
 */
export function LoadingPage() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="bg-background text-muted-foreground fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className={styles.stage}>
        <span className={`${styles.letter} ${styles.letterS}`} />
        <span className={`${styles.letter} ${styles.letterA}`} />
        <span className={`${styles.letter} ${styles.letterD}`} />
      </div>

      <span className="sr-only">Memuat…</span>
    </div>
  );
}
```

- [ ] **Step 4: Lihat hasilnya di browser**

```bash
API_BASE_URL=http://localhost:3001/api NEXT_PUBLIC_SITE_URL=http://localhost:3000 bun run dev
```

Buka `http://localhost:3000/authentication` — belum ada di Task ini, jadi
sementara render `<LoadingPage />` dari `src/app/loading.tsx` untuk melihatnya,
lalu kembalikan berkas itu seperti semula.

Yang harus benar:

1. Ketiga huruf bertemu di tengah membentuk satu wordmark, tidak saling geser.
2. Warnanya mengikuti `text-muted-foreground`, bukan abu-abu beku — uji dengan
   mengubah preferensi tema OS ke gelap.
3. Tidak ada error CSP di console. `mask-image` tunduk pada `img-src`, dan
   `src/lib/security/csp.ts` sudah memberi `img-src 'self'` — kalau ternyata
   muncul pelanggaran, itu bug yang harus diselesaikan di sini, bukan
   dilewati.

- [ ] **Step 5: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add public/loading src/components/common/loading-page.tsx src/components/common/loading-page.module.css
git commit -m "$(cat <<'MSG'
feat(loading): layar tunggu bermerek dengan animasi huruf sada

Aset dari fe-gkigraharaya dipakai ulang, tapi tidak apa adanya: tiga PNG
3000x3000 berjumlah 190 KB untuk satu bentuk datar yang dirender 200x200.
Diperkecil jadi 17 KB dan dirender sebagai mask dengan currentColor,
sehingga sekaligus ikut tema gelap.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 7: `LoadingGlobal` dan `LoadingList`

**Files:**

- Create: `src/components/common/loading-global.tsx`
- Create: `src/components/common/loading-list.tsx`

**Interfaces:**

- Consumes: `cn` dari `src/lib/utils.ts`.
- Produces:
  - `<LoadingGlobal />` — overlay layar penuh, semi-transparan.
  - `<LoadingList rows?: number />` — skeleton baris daftar.

- [ ] **Step 1: Tulis `src/components/common/loading-global.tsx`**

```tsx
/**
 * Overlay saat sebuah mutation berjalan — simpan, hapus, approve.
 *
 * Semi-transparan dengan sengaja: yang di bawahnya adalah layar yang isinya
 * sudah benar dan cuma menunggu jawaban, jadi membiarkannya terlihat samar
 * justru membantu user tahu ia masih berada di tempat yang sama. Bandingkan
 * dengan `LoadingPage`, yang menutup penuh karena yang di bawahnya memang
 * belum layak dilihat.
 *
 * Spinner cincin, bukan animasi huruf: mutation umumnya selesai dalam ratusan
 * milidetik, dan animasi 2 detik hanya sempat terlihat setengah jalan.
 */
export function LoadingGlobal() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="bg-background/60 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]"
    >
      <span className="border-muted border-t-primary size-10 animate-spin rounded-full border-4" />
      <span className="sr-only">Memuat…</span>
    </div>
  );
}
```

- [ ] **Step 2: Tulis `src/components/common/loading-list.tsx`**

```tsx
import { cn } from "@/lib/utils";

/**
 * Skeleton daftar.
 *
 * Tingginya dipatok 56px per baris — sama dengan tinggi baris di `DataList`
 * (lihat mockup "Jemaat — baris 56px, divider inset 52px"). Kalau berbeda,
 * daftar akan melompat saat data tiba, dan lompatan itu terbaca sebagai
 * kedipan.
 */
export function LoadingList({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <ul
      role="status"
      aria-busy="true"
      className={cn("divide-border divide-y", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="flex h-14 items-center gap-3 px-4">
          <span className="bg-muted size-9 animate-pulse rounded-full" />

          <span className="flex-1 space-y-1.5">
            <span className="bg-muted block h-3 w-2/5 animate-pulse rounded" />
            <span className="bg-muted block h-2.5 w-1/4 animate-pulse rounded" />
          </span>
        </li>
      ))}

      <span className="sr-only">Memuat daftar…</span>
    </ul>
  );
}
```

Catatan: `key={index}` di sini adalah satu-satunya pemakaian indeks yang sah di
repo ini — barisnya tidak punya identitas, dan urutannya tidak pernah berubah.

- [ ] **Step 3: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add src/components/common/loading-global.tsx src/components/common/loading-list.tsx
git commit -m "$(cat <<'MSG'
feat(loading): overlay mutation dan skeleton daftar

Dua bahasa visual untuk dua tugas: cincin spinner untuk tunggu pendek,
animasi huruf hanya untuk bootstrap. Tinggi baris skeleton dipatok 56px
supaya daftar tidak melompat saat data tiba.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 8: Halaman login

**Files:**

- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/login/login-form.tsx`
- Create: `src/components/common/button.tsx`

**Interfaces:**

- Consumes: `fetchOne`, `FetchError` dari `src/lib/api/fetcher.ts`; `Logo` dari `src/components/common/logo.tsx`.
- Produces: rute `/login`.

- [ ] **Step 1: Pasang dependency form**

Run: `bun add react-hook-form@^7.88.0 @hookform/resolvers@^5.9.1`

Primitif `input` dan `label` dari shadcn sengaja TIDAK dipasang. Field di sini
hanya butuh `<input>` dan `<label>` biasa dengan kelas Tailwind; menarik dua
berkas registry untuk itu menambah dua berkas yang harus dipahami tanpa
menambah apa pun. `FormField` di Fase 2 yang akan memutuskan apakah primitif
itu benar-benar diperlukan, dari kebutuhan nyata layar pertama.

- [ ] **Step 2: Tulis `src/components/common/button.tsx`**

```tsx
export { Button, buttonVariants } from "@/components/ui/button";
```

Ini bukan wrapper sungguhan; wrapper berkontrak (`ActionBar` dan kawan-kawan)
dibangun di Fase 2 dari kebutuhan nyata layar pertama. Re-export ini hanya
menjaga aturan impor Task 4 konsisten sejak sekarang — `src/app/**` tidak
pernah menyentuh `@/components/ui/*` — supaya 61 layar berikutnya tidak lahir
dengan kebiasaan yang salah.

- [ ] **Step 3: Tulis `src/app/(auth)/layout.tsx`**

```tsx
/**
 * Kerangka halaman sebelum masuk: satu kolom di tengah, tanpa navigasi.
 *
 * Terpisah dari `(app)` karena app shell (bottom tab, header) tidak boleh
 * muncul di layar yang belum punya sesi — bukan cuma karena jelek, tapi
 * karena tab-tabnya menuju rute yang akan menendang balik ke sini.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Tulis `src/app/(auth)/login/login-form.tsx`**

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/common/button";
import { FetchError, fetchOne } from "@/lib/api/fetcher";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onLogin = async (form: LoginForm) => {
    try {
      await fetchOne("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const redirect = searchParams.get("redirect");

      router.replace(
        redirect
          ? `/authentication?redirect=${encodeURIComponent(redirect)}`
          : "/authentication",
      );
    } catch (error) {
      // Galat login tampil di dalam form, bukan sebagai toast: satu-satunya
      // hal yang bisa dilakukan user adalah membetulkan field di depannya, dan
      // toast justru menjauhkan pesannya dari tempat itu.
      setError("root", {
        message:
          error instanceof FetchError
            ? error.message
            : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onLogin)}
      className="w-full max-w-xs space-y-4"
    >
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("username")}
        />
        {errors.username ? (
          <p className="text-destructive text-xs">{errors.username.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        ) : null}
      </div>

      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}
```

Tinggi kontrol dipatok `h-11` (44px): itu ukuran sasaran sentuh minimum yang
disarankan, dan `text-base` (16px) mencegah iOS Safari memperbesar halaman
otomatis saat input difokuskan.

- [ ] **Step 5: Tulis `src/app/(auth)/login/page.tsx`**

```tsx
import { Suspense } from "react";

import { Logo } from "@/components/common/logo";
import { siteConfig } from "@/config/site";

import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk" };

export default function Page() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo />
        <p className="text-muted-foreground text-sm">
          {siteConfig.description}
        </p>
      </div>

      {/*
        `useSearchParams` di dalam LoginForm memaksa segmen ini keluar dari
        prerender statis kalau tidak dibungkus Suspense — Next menolak build
        dengan "useSearchParams() should be wrapped in a suspense boundary".
      */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 6: Uji manual terhadap be-sada yang berjalan**

```bash
API_BASE_URL=http://localhost:3001/api NEXT_PUBLIC_SITE_URL=http://localhost:3000 bun run dev
```

1. Buka `/login`, isi kredensial salah → pesan galat dari be-sada tampil di
   dalam form, bukan layar error.
2. Isi kredensial benar → berpindah ke `/authentication` (yang masih 404 sampai
   Task 9).
3. **Yang paling penting:** buka DevTools → Application → Cookies →
   `http://localhost:3000`. Harus ada `accessToken` dan `refreshToken` di sana.
   Kalau kosong, `stripCookieDomain` di Task 2 tidak bekerja dan tidak ada
   gunanya melanjutkan.

- [ ] **Step 7: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add -A
git commit -m "$(cat <<'MSG'
feat(auth): halaman login

Galat ditampilkan di dalam form, bukan toast: satu-satunya tindakan yang
tersedia bagi user adalah membetulkan field di depannya. Kontrol setinggi
44px dan berukuran teks 16px supaya iOS Safari tidak memperbesar halaman
saat input difokuskan.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 9: Gerbang `/authentication`

**Files:**

- Create: `src/app/(auth)/authentication/page.tsx`
- Create: `src/app/(auth)/authentication/loading.tsx`
- Create: `src/app/(auth)/authentication/first-login-form.tsx`
- Create: `src/lib/redirect.ts`
- Test: `src/lib/redirect.test.ts`

**Interfaces:**

- Consumes: `getSession` (Task 5), `LoadingPage` (Task 6), `fetchOne` (Task 1).
- Produces: rute `/authentication`; `isSafeRedirectPath(value: string | null): value is string`.

- [ ] **Step 1: Baca dokumen `loading.js`**

Run: `sed -n '1,60p' node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`
Yang penting: `loading.js` adalah fallback Suspense yang ditampilkan selama
kerja server segmennya berlangsung, lalu **dicabut Next begitu kerja itu
selesai**. Itulah kenapa jeda minimum harus dipasang pada kerja servernya, bukan
di client.

- [ ] **Step 2: Tulis test yang gagal untuk penjaga redirect**

Buat `src/lib/redirect.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { isSafeRedirectPath } from "./redirect";

describe("isSafeRedirectPath", () => {
  test("menerima path relatif satu garis miring", () => {
    expect(isSafeRedirectPath("/kejemaatan/daftar-jemaat")).toBe(true);
    expect(isSafeRedirectPath("/")).toBe(true);
  });

  test("menolak URL absolut", () => {
    expect(isSafeRedirectPath("https://phishing.test/login")).toBe(false);
  });

  test("menolak URL protocol-relative", () => {
    expect(isSafeRedirectPath("//phishing.test")).toBe(false);
  });

  test("menolak akal-akalan backslash", () => {
    expect(isSafeRedirectPath("/\\phishing.test")).toBe(false);
  });

  test("menolak kosong dan null", () => {
    expect(isSafeRedirectPath("")).toBe(false);
    expect(isSafeRedirectPath(null)).toBe(false);
  });
});
```

- [ ] **Step 3: Jalankan test, pastikan gagal**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/lib/redirect.test.ts`
Expected: FAIL — `Cannot find module './redirect'`.

- [ ] **Step 4: Tulis `src/lib/redirect.ts`**

```ts
/**
 * Tujuan setelah login hanya sah bila ia path di origin ini sendiri.
 *
 * Tanpa penjaga ini, `?redirect=https://phishing.test/login` akan melempar
 * user ke situs lain tepat sesudah ia berhasil masuk — halaman palsu yang
 * meminta password ulang, dari alamat yang tadinya sah. Ini kelas kerentanan
 * open redirect, dan satu-satunya obatnya adalah memeriksa nilainya, bukan
 * mempercayai dari mana ia datang.
 *
 * Yang ditolak: URL absolut (`https://…`), protocol-relative (`//…`), dan
 * akal-akalan backslash (`/\…`) yang masih diperlakukan sebagian browser
 * sebagai navigasi lintas-origin.
 */
export function isSafeRedirectPath(
  value: string | null | undefined,
): value is string {
  if (!value) return false;

  return (
    value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
  );
}
```

- [ ] **Step 5: Jalankan test, pastikan lolos**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/lib/redirect.test.ts`
Expected: PASS, 5 test.

- [ ] **Step 6: Tulis `src/app/(auth)/authentication/loading.tsx`**

```tsx
import { LoadingPage } from "@/components/common/loading-page";

export default function Loading() {
  return <LoadingPage />;
}
```

- [ ] **Step 7: Tulis `src/app/(auth)/authentication/first-login-form.tsx`**

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/common/button";
import { FetchError, fetchOne } from "@/lib/api/fetcher";

const firstLoginSchema = z
  .object({
    newPassword: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((form) => form.newPassword === form.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

type FirstLoginForm = z.infer<typeof firstLoginSchema>;

/**
 * Akun berstatus PENDING belum pernah punya password.
 *
 * be-sada membatasi akun seperti itu hanya pada dua endpoint (lihat
 * `PENDING_ALLOWED` di `authentication.ts`), jadi tidak ada layar lain yang
 * bisa dibukanya. Setelah password terpasang, be-sada mencabut seluruh sesi
 * akun itu — makanya di akhir kita kirim ke `/login`, bukan ke beranda.
 */
export function FirstLoginForm({ code }: { code: string }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstLoginForm>({
    resolver: zodResolver(firstLoginSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmitPassword = async (form: FirstLoginForm) => {
    try {
      await fetchOne(`/auth/update/${code}`, {
        method: "PUT",
        body: JSON.stringify({ newPassword: form.newPassword }),
      });

      router.replace("/login");
    } catch (error) {
      setError("root", {
        message:
          error instanceof FetchError
            ? error.message
            : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitPassword)}
      className="w-full max-w-xs space-y-4"
    >
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Buat password Anda</h1>
        <p className="text-muted-foreground text-sm">
          Akun ini baru pertama kali dipakai. Setelah password dibuat, Anda akan
          diminta masuk kembali.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium">
          Password baru
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          <p className="text-destructive text-xs">
            {errors.newPassword.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Ulangi password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-destructive text-xs">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : "Simpan password"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 8: Tulis `src/app/(auth)/authentication/page.tsx`**

```tsx
import { setTimeout as delay } from "node:timers/promises";
import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/get-session";
import { isSafeRedirectPath } from "@/lib/redirect";

import { FirstLoginForm } from "./first-login-form";

export const metadata = { title: "Menyiapkan" };

/**
 * Jeda minimum supaya animasi huruf sempat terbaca.
 *
 * Dipasang pada kerja SERVER, bukan di client, dan itu bukan pilihan gaya:
 * `loading.tsx` dicabut Next begitu kerja server segmen ini selesai, terlepas
 * dari apa pun yang dilakukan client sesudahnya. Menahan kerja servernya
 * adalah satu-satunya cara membuat layar tunggunya bertahan.
 *
 * Hanya berlaku di layar ini. Menambahkannya ke navigasi lain berarti
 * memperlambat aplikasi demi animasi.
 */
const MINIMUM_HOLD_MS = 800;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [session, params] = await Promise.all([
    getSession(),
    searchParams,
    delay(MINIMUM_HOLD_MS),
  ]);

  // Cookie tidak ada, sudah kedaluwarsa, atau ditolak be-sada.
  if (!session) redirect("/login");

  // Akun yang dinonaktifkan sementara masih memegang cookie yang sah sampai
  // masa berlakunya habis. Tanpa cabang ini ia lolos ke app shell dan baru
  // ditolak satu per satu oleh setiap panggilan API di dalamnya.
  if (session.status === "DEACTIVATED") redirect("/login");

  if (session.status === "PENDING")
    return <FirstLoginForm code={session.code} />;

  redirect(isSafeRedirectPath(params.redirect) ? params.redirect : "/");
}
```

- [ ] **Step 9: Uji manual**

1. Login dengan akun ACTIVE → animasi huruf tampil sekitar satu detik, lalu
   berpindah ke `/` (masih 404 sampai Task 12 — itu diharapkan).
2. Buka `/authentication?redirect=https://example.com` sesudah login → tetap
   mendarat di `/`, tidak keluar ke example.com.
3. Buka `/authentication` tanpa cookie sama sekali → mendarat di `/login`.

- [ ] **Step 10: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add -A
git commit -m "$(cat <<'MSG'
feat(auth): gerbang authentication sebagai server component

Versi fe-gkigraharaya mengerjakan ini lewat empat useEffect berurutan,
jwt-decode di browser, localStorage, dan setTimeout satu detik. Cookie
be-sada httpOnly sehingga tiga di antaranya mustahil sekaligus tidak perlu,
dan jeda minimumnya dipasang pada kerja server karena loading.tsx dicabut
Next begitu kerja itu selesai.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 10: `proxy.ts` — gerbang auth dan penyegaran token

**Files:**

- Create: `src/features/auth/refresh.ts`
- Test: `src/features/auth/refresh.test.ts`
- Modify: `src/proxy.ts`

**Interfaces:**

- Consumes: `env.API_BASE_URL`; `stripCookieDomain` dari `src/lib/api/cookie.ts`.
- Produces: `refreshSession(cookieHeader: string, refreshToken: string): Promise<RefreshResult>` dengan `type RefreshResult = { cookieHeader: string; setCookie: string[] } | null`.

**Kenapa penyegaran ada di `proxy.ts`, bukan di route handler BFF.** Ada dua
jenis permintaan yang memakai sesi: navigasi (Server Component membaca cookie
langsung, tidak lewat BFF) dan XHR (lewat BFF). Kalau penyegaran ditaruh di
BFF, navigasi tidak terlindungi. Kalau ditaruh di keduanya, ada dua tempat yang
harus benar. `proxy.ts` melihat keduanya — dan hanya ia yang bisa **sekaligus**
menulis cookie ke respons dan menulis ulang header `Cookie` pada request yang
diteruskan. Server Component tidak boleh menulis cookie sama sekali.

Deteksinya tidak perlu memverifikasi token: cookie `accessToken` punya
`Max-Age`, jadi browser menghapusnya sendiri saat kedaluwarsa. **Access cookie
hilang sementara refresh cookie masih ada** berarti persis "perlu disegarkan".

**Kenapa penyegaran wajib satu-jalur.** `authService.refreshToken` di be-sada
**merotasi** sesi, dan menyajikan ulang refresh token yang sudah pensiun
diperlakukan sebagai pencurian: `revokeSessionsByUserId(..., "refresh token
reuse")` mencabut **seluruh sesi akun itu di semua perangkat**. Satu layar yang
menembakkan tiga query TanStack Query sekaligus akan mengirim tiga permintaan
penyegaran, dua di antaranya membawa token yang sudah pensiun — dan user
terlempar keluar dari semua perangkatnya. Peta `inFlight` di bawah yang
mencegahnya.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/features/auth/refresh.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let server: ReturnType<typeof Bun.serve>;
let refreshSession: typeof import("./refresh").refreshSession;

let hitCount = 0;
let nextStatus = 200;

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    async fetch() {
      hitCount += 1;

      // Ditahan sebentar supaya beberapa pemanggil benar-benar tumpang tindih;
      // tanpa ini yang pertama sudah selesai sebelum yang kedua masuk dan
      // test single-flight lolos tanpa menguji apa pun.
      await Bun.sleep(20);

      if (nextStatus !== 200) {
        return Response.json(
          { status: nextStatus, error: "Sesi berakhir" },
          { status: nextStatus },
        );
      }

      return new Response(JSON.stringify({ status: 200, message: "ok" }), {
        status: 200,
        headers: [
          ["content-type", "application/json"],
          [
            "set-cookie",
            "accessToken=baru; Max-Age=900; Domain=api.sada.test; Path=/; HttpOnly",
          ],
          [
            "set-cookie",
            "refreshToken=rotasi; Max-Age=604800; Domain=api.sada.test; Path=/; HttpOnly",
          ],
        ],
      });
    },
  });

  process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;
  ({ refreshSession } = await import("./refresh"));
});

afterAll(() => {
  server.stop(true);
});

describe("refreshSession", () => {
  test("mengembalikan cookie baru tanpa atribut Domain", async () => {
    hitCount = 0;
    nextStatus = 200;

    const result = await refreshSession("refreshToken=lama", "lama");

    expect(result?.setCookie).toHaveLength(2);
    expect(
      result?.setCookie.every(
        (cookie) => !cookie.toLowerCase().includes("domain"),
      ),
    ).toBe(true);
  });

  test("menyusun ulang header Cookie dengan nilai yang baru", async () => {
    nextStatus = 200;

    const result = await refreshSession(
      "refreshToken=lama; theme=dark",
      "lama",
    );

    expect(result?.cookieHeader).toContain("accessToken=baru");
    expect(result?.cookieHeader).toContain("refreshToken=rotasi");
    // Cookie non-auth tidak boleh ikut hilang.
    expect(result?.cookieHeader).toContain("theme=dark");
  });

  test("sepuluh pemanggil bersamaan hanya menghasilkan SATU penyegaran", async () => {
    hitCount = 0;
    nextStatus = 200;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        refreshSession("refreshToken=serentak", "serentak"),
      ),
    );

    expect(hitCount).toBe(1);
    expect(
      results.every((result) =>
        result?.cookieHeader.includes("accessToken=baru"),
      ),
    ).toBe(true);
  });

  test("penyegaran berikutnya menembak lagi setelah yang sebelumnya selesai", async () => {
    hitCount = 0;
    nextStatus = 200;

    await refreshSession("refreshToken=a", "a");
    await refreshSession("refreshToken=a", "a");

    expect(hitCount).toBe(2);
  });

  test("401 mengembalikan null, bukan melempar", async () => {
    nextStatus = 401;

    expect(await refreshSession("refreshToken=mati", "mati")).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/features/auth/refresh.test.ts`
Expected: FAIL — `Cannot find module './refresh'`.

- [ ] **Step 3: Tulis `src/features/auth/refresh.ts`**

```ts
import { stripCookieDomain } from "@/lib/api/cookie";
import { env } from "@/lib/env";

export type RefreshResult = {
  /** Header `Cookie` yang sudah memuat nilai baru, untuk request yang diteruskan. */
  cookieHeader: string;
  /** Header `Set-Cookie` yang sudah dibuang atribut Domain-nya, untuk respons. */
  setCookie: string[];
} | null;

/**
 * Penyegaran yang sedang berjalan, dikunci pada nilai refresh token.
 *
 * INI BUKAN OPTIMASI. `authService.refreshToken` di be-sada merotasi sesi, dan
 * menyajikan ulang refresh token yang sudah pensiun diperlakukan sebagai
 * pencurian: seluruh sesi akun itu dicabut, di semua perangkat. Satu layar
 * yang menembakkan tiga query sekaligus akan mengirim tiga penyegaran, dua
 * membawa token pensiun — dan user terlempar keluar dari mana-mana.
 *
 * ponytail: peta ini hidup per-proses. Dua kontainer di belakang load balancer
 * punya petanya masing-masing, jadi permintaan yang terbelah ke dua kontainer
 * pada detik yang sama masih bisa berlomba. Kalau itu terbukti terjadi,
 * naikkan ke kunci bersama (Redis) — bukan sebelumnya.
 */
const inFlight = new Map<string, Promise<RefreshResult>>();

/** `a=1; b=2` menjadi peta, supaya nilai baru bisa menimpa yang lama. */
const parseCookieHeader = (header: string): Map<string, string> => {
  const jar = new Map<string, string>();

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    jar.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }

  return jar;
};

const onRefresh = async (cookieHeader: string): Promise<RefreshResult> => {
  let response: Response;

  try {
    response = await fetch(`${env.API_BASE_URL}/v1/auth/refresh-token`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    // be-sada tidak terjangkau. Diperlakukan sama dengan sesi mati: yang bisa
    // dilakukan user hanyalah mencoba masuk lagi.
    return null;
  }

  if (!response.ok) return null;

  const setCookie = response.headers.getSetCookie().map(stripCookieDomain);

  const jar = parseCookieHeader(cookieHeader);

  for (const cookie of setCookie) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");

    if (separator === -1) continue;

    jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }

  return {
    cookieHeader: [...jar]
      .map(([name, value]) => `${name}=${value}`)
      .join("; "),
    setCookie,
  };
};

/**
 * Menyegarkan sesi, sekali saja walau dipanggil bersamaan.
 *
 * `refreshToken` dipakai sebagai kunci, bukan seluruh header cookie: dua
 * permintaan dari tab yang berbeda bisa membawa cookie non-auth yang berbeda
 * sementara sesinya sama, dan keduanya harus berbagi satu penyegaran.
 */
export function refreshSession(
  cookieHeader: string,
  refreshToken: string,
): Promise<RefreshResult> {
  const existing = inFlight.get(refreshToken);

  if (existing) return existing;

  const attempt = onRefresh(cookieHeader).finally(() => {
    inFlight.delete(refreshToken);
  });

  inFlight.set(refreshToken, attempt);

  return attempt;
}
```

- [ ] **Step 4: Jalankan test, pastikan lolos**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/features/auth/refresh.test.ts`
Expected: PASS, 5 test — terutama `hitCount` yang bernilai 1 pada test sepuluh pemanggil.

- [ ] **Step 5: Ubah `src/proxy.ts`**

Seluruh komentar peringatan yang sudah ada di berkas itu **dipertahankan**.
Yang berubah: fungsinya jadi `async`, ditambah gerbang auth dan penyegaran, dan
`matcher` ditambah satu entri.

Badan fungsinya menjadi:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/features/auth/refresh";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/security/csp";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

/** Halaman yang boleh dibuka tanpa sesi. */
const PUBLIC_PATHS = new Set(["/login", "/authentication"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Panggilan API tidak menerima CSP (responsnya JSON, bukan dokumen) dan
  // tidak boleh dialihkan ke halaman login: XHR yang mengikuti pengalihan ke
  // HTML akan gagal parse, dan pemanggil menerima galat yang tidak
  // menjelaskan apa-apa. Yang diterimanya adalah 401.
  const isApiRequest = pathname.startsWith("/api/");

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Sama sekali belum masuk.
  if (!accessToken && !refreshToken) {
    if (isApiRequest || PUBLIC_PATHS.has(pathname)) {
      return onContinue(request, { isApiRequest });
    }

    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url),
    );
  }

  // Access token kedaluwarsa — browser menghapusnya sendiri saat Max-Age habis,
  // jadi ketidakhadirannya di samping refresh token yang masih ada berarti
  // persis "perlu disegarkan". Tidak ada token yang diverifikasi di sini; FE
  // tidak memegang kunci tanda tangan be-sada dan tidak perlu.
  if (!accessToken && refreshToken) {
    const refreshed = await refreshSession(
      request.headers.get("cookie") ?? "",
      refreshToken,
    );

    if (!refreshed) {
      // Keduanya NextResponse, supaya cookie mati ikut dibuang pada kedua
      // jalur. Kalau cabang API memakai `Response` biasa, XHR yang menemukan
      // sesi mati akan meninggalkan cookie basi di browser, dan setiap
      // permintaan berikutnya mengulang penyegaran yang sudah pasti gagal.
      const response = isApiRequest
        ? NextResponse.json(
            { status: 401, error: "Sesi Anda telah berakhir." },
            { status: 401 },
          )
        : NextResponse.redirect(new URL("/login", request.url));

      // Dibuang di sini, bukan diandalkan dari be-sada: Set-Cookie pembersih
      // miliknya membawa atribut Domain yang tidak cocok dengan origin ini,
      // sehingga browser mengabaikannya dan cookie basi menetap selamanya.
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);

      return response;
    }

    return onContinue(request, {
      isApiRequest,
      cookieHeader: refreshed.cookieHeader,
      setCookie: refreshed.setCookie,
    });
  }

  // Sudah masuk tapi masih berada di halaman login — kirim ke gerbang.
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/authentication", request.url));
  }

  return onContinue(request, { isApiRequest });
}

const onContinue = (
  request: NextRequest,
  options: {
    isApiRequest: boolean;
    cookieHeader?: string;
    setCookie?: string[];
  },
) => {
  const requestHeaders = new Headers(request.headers);

  // Cookie hasil penyegaran ditulis ke header REQUEST juga, bukan hanya ke
  // respons. Tanpa ini, permintaan yang sedang berjalan tetap membawa cookie
  // lama dan be-sada menjawabnya 401 — penyegarannya baru terasa pada
  // permintaan berikutnya, sehingga setiap kedaluwarsa memunculkan satu
  // kegagalan yang terlihat user.
  if (options.cookieHeader) {
    requestHeaders.set("cookie", options.cookieHeader);
  }

  let nonce: string | null = null;

  if (!options.isApiRequest) {
    nonce = generateNonce();

    const csp = buildContentSecurityPolicy({
      nonce,
      isDev: process.env.NODE_ENV === "development",
    });

    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    response.headers.set("Content-Security-Policy", csp);

    for (const cookie of options.setCookie ?? []) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const cookie of options.setCookie ?? []) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
};
```

Dan `config.matcher` menjadi array dua entri — entri lama **tidak diubah sama
sekali**, hanya ditambah satu di bawahnya:

```ts
export const config = {
  matcher: [
    {
      // ... entri lama beserta seluruh komentarnya, tidak diubah ...
    },
    {
      /**
       * Panggilan API ikut lewat sini semata untuk penyegaran token. CSP tidak
       * dipasang di sini (responsnya JSON) dan pengalihan tidak pernah terjadi
       * — lihat `isApiRequest` di badan fungsi.
       *
       * Tanpa entri ini, XHR yang tiba setelah access token kedaluwarsa akan
       * menerima 401 walau sesi user sebenarnya masih hidup.
       */
      source: "/api/:path*",
    },
  ],
};
```

- [ ] **Step 6: Uji manual penyegaran**

Setel `EXPIRED_ACCESS_TOKEN=1` (satu menit) di `.env` be-sada dan jalankan
ulang be-sada. Lalu:

1. Login, buka satu layar, tunggu lebih dari satu menit.
2. Muat ulang halaman. Harus tetap masuk, tidak terlempar ke `/login`.
3. DevTools → Application → Cookies: `accessToken` punya nilai baru.
4. Buka lagi di perangkat/browser kedua dengan akun yang sama, biarkan
   keduanya lewat masa kedaluwarsa, lalu muat ulang keduanya. **Keduanya harus
   tetap masuk.** Kalau salah satu terlempar keluar, single-flight tidak
   bekerja dan `revokeSessionsByUserId` sudah menyala.

Kembalikan `EXPIRED_ACCESS_TOKEN` ke nilai semula setelah selesai.

- [ ] **Step 7: Aset PWA harus tetap lolos**

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/manifest.webmanifest
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/sw.js
```

Expected: `200 application/manifest+json` dan `200 application/javascript; charset=utf-8`, **tanpa cookie sesi sama sekali**. Kalau salah satunya menjawab 307,
tombol install hilang dan push notification mati tanpa pesan error apa pun —
itu persis yang diperingatkan komentar di `src/proxy.ts`.

- [ ] **Step 8: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add src/proxy.ts src/features/auth/refresh.ts src/features/auth/refresh.test.ts
git commit -m "$(cat <<'MSG'
feat(auth): gerbang rute dan penyegaran token satu-jalur di proxy

Penyegaran ada di proxy karena hanya di sana cookie bisa ditulis ke respons
sekaligus ke header request yang diteruskan; server component tidak boleh
menulis cookie sama sekali. Satu-jalur bukan optimasi: be-sada memperlakukan
refresh token pensiun sebagai pencurian dan mencabut seluruh sesi akun di
semua perangkat, jadi tiga query serentak akan mengeluarkan user dari
mana-mana.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 11: Sesi di sisi client dan `useMenuAccess`

**Files:**

- Create: `src/features/auth/session-provider.tsx`
- Create: `src/features/auth/use-menu-access.ts`
- Test: `src/features/auth/use-menu-access.test.tsx`
- Create: `src/app/(app)/layout.tsx`

**Interfaces:**

- Consumes: `Session`, `MenuNode`, `MenuAction` (Task 5); `getSession` (Task 5); `AppShell` (Task 12 — dibuat lebih dulu sebagai stub di step 5, diisi di Task 12).
- Produces:
  - `<SessionProvider session={Session}>`
  - `useSession(): Session`
  - `useMenuAccess(slug: string): { isCanView, isCanCreate, isCanUpdate, isCanDelete, isCanApprove, isCanReject, isCanReset }` — semuanya `boolean`
  - `findMenuNode(nodes: MenuNode[], slug: string): MenuNode | null`

- [ ] **Step 1: Tulis `src/features/auth/session-provider.tsx`**

```tsx
"use client";

import { createContext, useContext } from "react";

import type { Session } from "./types";

const SessionContext = createContext<Session | null>(null);

/**
 * Sesi diambil sekali di `(app)/layout.tsx` (Server Component) lalu dibagikan
 * dari sini. Tidak ada layar yang mengambilnya sendiri: satu panggilan per
 * navigasi, dan seluruh layar melihat sesi yang sama persis.
 *
 * React 19 memperbolehkan `<Context>` dipakai langsung sebagai provider;
 * `<Context.Provider>` masih bekerja tapi sudah tidak dianjurkan.
 */
export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return <SessionContext value={session}>{children}</SessionContext>;
}

/**
 * Melempar, bukan mengembalikan null.
 *
 * Setiap pemakai hook ini berada di dalam `(app)`, yang layout-nya sudah
 * menendang sesi kosong ke `/login`. Kalau nilainya null di sini, yang terjadi
 * adalah komponen dipasang di luar provider — bug penataan, dan mengembalikan
 * null hanya memindahkan ledakannya ke tempat yang lebih sulit dibaca.
 */
export function useSession(): Session {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession dipakai di luar SessionProvider.");
  }

  return session;
}
```

- [ ] **Step 2: Tulis test yang gagal**

Buat `src/features/auth/use-menu-access.test.tsx`:

```tsx
import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { SessionProvider } from "./session-provider";
import type { Session } from "./types";
import { findMenuNode, useMenuAccess } from "./use-menu-access";

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

function Probe({ slug }: { slug: string }) {
  const access = useMenuAccess(slug);

  return <span data-testid="hasil">{JSON.stringify(access)}</span>;
}

const onRenderProbe = (slug: string) => {
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
```

- [ ] **Step 3: Jalankan test, pastikan gagal**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/features/auth/use-menu-access.test.tsx`
Expected: FAIL — `Cannot find module './use-menu-access'`.

- [ ] **Step 4: Tulis `src/features/auth/use-menu-access.ts`**

```ts
"use client";

import { useMemo } from "react";

import { useSession } from "./session-provider";
import type { MenuAction, MenuNode } from "./types";

/** Telusuri pohon menu untuk satu slug. Diekspor supaya bisa diuji sendiri. */
export function findMenuNode(nodes: MenuNode[], slug: string): MenuNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;

    const found = findMenuNode(node.children, slug);

    if (found) return found;
  }

  return null;
}

/**
 * Hak akses peran atas satu layar.
 *
 * be-sada sudah menyintesiskan `action` per peran — peran admin menerima
 * seluruh aksi tanpa bergantung pada baris grant (lihat `menuService.findTree`).
 * Jadi tidak ada percabangan `isAdmin` di sini, dan memang tidak boleh ada:
 * dua tempat yang memutuskan hal yang sama pasti akan berbeda pendapat suatu
 * saat.
 *
 * PENTING: ini urusan TAMPILAN, bukan keamanan. Menyembunyikan tombol tidak
 * menghalangi siapa pun memanggil endpointnya. Yang menegakkan otorisasi
 * adalah `Authorization(MENU.X, "AKSI")` di setiap route be-sada.
 */
export function useMenuAccess(slug: string) {
  const session = useSession();

  return useMemo(() => {
    const actions = new Set<MenuAction>(
      findMenuNode(session.menu, slug)?.action ?? [],
    );

    return {
      isCanView: actions.has("VIEW"),
      isCanCreate: actions.has("CREATE"),
      isCanUpdate: actions.has("UPDATE"),
      isCanDelete: actions.has("DELETE"),
      isCanApprove: actions.has("APPROVE"),
      isCanReject: actions.has("REJECT"),
      isCanReset: actions.has("RESET"),
    };
  }, [session.menu, slug]);
}
```

- [ ] **Step 5: Jalankan test, pastikan lolos**

Run: `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 API_BASE_URL=http://127.0.0.1:3001/api bun test src/features/auth/use-menu-access.test.tsx`
Expected: PASS, 5 test.

- [ ] **Step 6: Tulis `src/app/(app)/layout.tsx`**

`AppShell` belum ada sampai Task 12. Buat stub sementara di
`src/components/layout/app-shell.tsx` supaya task ini bisa diverifikasi
sendiri; Task 12 yang mengisinya:

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
```

Lalu `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/features/auth/get-session";
import { SessionProvider } from "@/features/auth/session-provider";

/**
 * Satu-satunya tempat sesi diambil untuk seluruh aplikasi.
 *
 * `proxy.ts` sudah menendang permintaan tanpa cookie sebelum sampai ke sini,
 * jadi pemeriksaan di bawah adalah lapis kedua — dan lapis kedua itu perlu:
 * cookie bisa saja ada tapi ditolak be-sada (sesi dicabut, akun dihapus), dan
 * proxy tidak pernah tahu itu karena ia tidak memverifikasi apa pun.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");

  // PENDING dan DEACTIVATED tidak punya urusan di app shell; keduanya diurus
  // `/authentication`.
  if (session.status !== "ACTIVE") redirect("/authentication");

  return (
    <SessionProvider session={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
```

- [ ] **Step 7: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add src/features/auth src/components/layout/app-shell.tsx "src/app/(app)"
git commit -m "$(cat <<'MSG'
feat(auth): bagikan sesi dan hak akses menu ke komponen client

Sesi diambil sekali di layout dan dibagikan lewat context, jadi 61 layar
tidak masing-masing menembak /auth/me. Tidak ada percabangan isAdmin di FE:
be-sada sudah menyintesiskan aksi lengkap untuk peran admin, dan dua tempat
yang memutuskan hal sama pasti berbeda pendapat suatu saat.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 12: App shell, bottom tab, dan beranda sementara

**Files:**

- Modify: `src/components/layout/app-shell.tsx` (isi stub dari Task 11)
- Create: `src/components/layout/bottom-tab.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/app/(app)/page.tsx`
- Create: `src/app/(app)/loading.tsx`

**Interfaces:**

- Consumes: `useSession`, `findMenuNode` (Task 11); `MENU`, `MENU_ICON`, `menuHref` (Task 5); `LoadingGlobal` (Task 7).
- Produces: `<AppShell>`, `<BottomTab />`, `<PageHeader title back? action? />`.

**Catatan desktop.** Keputusan D16 menjanjikan shell yang memisahkan navigasi
dari isi layar supaya desktop bisa ditambahkan tanpa menyentuh 61 layar. Yang
membuat itu benar-benar berlaku ada satu aturan: **layar tidak boleh tahu
navigasinya di mana**. Tidak ada `pb-20` di layar untuk memberi ruang bottom
tab; jarak itu milik `AppShell`. Saat sidebar desktop ditambahkan nanti, yang
berubah hanya `AppShell`.

- [ ] **Step 1: Tulis `src/components/layout/bottom-tab.tsx`**

```tsx
"use client";

import {
  BookOpen,
  CalendarDays,
  House,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MENU, menuHref } from "@/config/menu";
import { findMenuNode } from "@/features/auth/use-menu-access";
import { useSession } from "@/features/auth/session-provider";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Slug yang harus dipegang peran agar tab ini tampil. Null = selalu tampil. */
  slug: string | null;
};

const TABS: Tab[] = [
  { label: "Dashboard", href: "/", icon: House, slug: null },
  {
    label: "Ibadah",
    href: menuHref(MENU.PERIBADAHAN, MENU.IBADAH),
    icon: BookOpen,
    slug: MENU.IBADAH,
  },
  {
    label: "Pelayanan",
    href: menuHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN),
    icon: CalendarDays,
    slug: MENU.JADWAL_PELAYAN,
  },
  {
    label: "Warta",
    href: menuHref(MENU.KEGIATAN, MENU.PENGUMUMAN),
    icon: Megaphone,
    slug: MENU.PENGUMUMAN,
  },
];

export function BottomTab() {
  const session = useSession();
  const pathname = usePathname();

  // Tab menuju layar yang tidak dipegang peran ini akan berujung 403 dari
  // be-sada. Menyaringnya di sini bukan keamanan — itu tetap milik be-sada —
  // melainkan menghindari jalan buntu yang terlihat seperti kerusakan.
  const tabs = TABS.filter(
    (tab) => tab.slug === null || findMenuNode(session.menu, tab.slug),
  );

  return (
    <nav
      aria-label="Navigasi utama"
      className="border-border bg-background sticky bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <tab.icon className="size-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Isi `src/components/layout/app-shell.tsx`**

```tsx
import { BottomTab } from "./bottom-tab";

/**
 * Kerangka setiap layar di dalam `(app)`.
 *
 * Layar TIDAK BOLEH tahu di mana navigasinya berada. Tidak ada `pb-20` di
 * layar untuk memberi ruang bottom tab, tidak ada `ml-64` untuk sidebar —
 * jarak itu milik berkas ini. Aturan itulah yang membuat tata letak desktop
 * nanti hanya mengubah satu berkas, bukan 61.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1">{children}</main>

      <BottomTab />
    </div>
  );
}
```

- [ ] **Step 3: Tulis `src/components/layout/page-header.tsx`**

```tsx
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Header satu layar: tombol kembali, judul, satu aksi di kanan.
 *
 * `backHref` berupa tautan, bukan `router.back()`. Layar ini bisa dibuka
 * langsung dari notifikasi push atau dari tautan yang dibagikan, dan pada
 * kasus itu `back()` melempar user keluar dari aplikasi.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Kembali"
          className="border-border flex size-9 shrink-0 items-center justify-center rounded-full border"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        {subtitle ? (
          <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
        ) : null}
      </div>

      {action}
    </header>
  );
}
```

- [ ] **Step 4: Tulis `src/app/(app)/loading.tsx`**

```tsx
import { LoadingGlobal } from "@/components/common/loading-global";

/**
 * Cincin spinner, bukan animasi huruf. Perpindahan antar-layar berlangsung
 * ratusan milidetik; animasi 2 detik hanya sempat terlihat setengah jalan.
 */
export default function Loading() {
  return <LoadingGlobal />;
}
```

- [ ] **Step 5: Tulis `src/app/(app)/page.tsx`**

```tsx
import { HomeScreen } from "./home-screen";

export const metadata = { title: "Beranda" };

export default function Page() {
  return <HomeScreen />;
}
```

Dan `src/app/(app)/home-screen.tsx`:

```tsx
"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { MENU_ICON, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";

/**
 * Beranda sementara.
 *
 * Mockup menampilkan kartu kas gabungan, pemasukan, pengeluaran, dan grafik
 * persembahan enam minggu. Angka-angka itu belum punya endpoint agregat di
 * be-sada — `/api/v1/report` hanya berisi tujuh laporan jemaat — jadi layar
 * ini berisi pintasan saja sampai Fase 6, ketika keputusan endpointnya
 * diambil. Merakitnya dari belasan panggilan di FE akan lambat dan boros, dan
 * mengganti perakitan itu dengan satu endpoint nanti berarti membuang
 * pekerjaannya.
 */
export function HomeScreen() {
  const session = useSession();

  const greeting = session.jemaat?.name ?? session.username;

  // Delapan pintasan pertama, sesuai mockup. Sisanya lewat "Tampilkan semua".
  const shortcuts = session.menu.slice(0, 8);

  return (
    <div className="pb-6">
      <PageHeader
        title={`Selamat datang, ${greeting}`}
        subtitle={session.roleUser.name}
      />

      <section className="px-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Aksi cepat</h2>

          <Link href="/modul" className="text-muted-foreground text-xs">
            Tampilkan semua
          </Link>
        </div>

        <ul className="grid grid-cols-4 gap-3">
          {shortcuts.map((domain) => {
            const Icon = MENU_ICON[domain.slug];
            const firstLeaf = domain.children[0];

            return (
              <li key={domain.publicId}>
                <Link
                  href={
                    firstLeaf ? menuHref(domain.slug, firstLeaf.slug) : "/modul"
                  }
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <span className="bg-muted flex size-12 items-center justify-center rounded-xl">
                    {Icon ? <Icon className="size-5" aria-hidden /> : null}
                  </span>

                  <span className="text-[11px] leading-tight">
                    {domain.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 px-4">
        <h2 className="mb-3 text-sm font-medium">Semua modul</h2>

        <Link
          href="/modul"
          className="border-border flex h-14 items-center justify-between rounded-xl border px-4"
        >
          <span className="text-sm">
            {session.menu.length} domain ·{" "}
            {session.menu.reduce(
              (total, domain) => total + domain.children.length,
              0,
            )}{" "}
            layar
          </span>

          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Uji manual**

1. Login sampai mendarat di `/`. Sapaan memakai nama jemaat, bukan username.
2. Bottom tab tampil, tab aktif tersorot, dan tidak menutupi isi halaman saat
   digulir sampai bawah.
3. Di iOS Safari (atau DevTools dengan simulasi safe-area), bottom tab tidak
   tertimpa home indicator.
4. Masuk dengan akun non-admin yang tidak memegang `PENGUMUMAN` → tab "Warta"
   tidak ada.

- [ ] **Step 7: Gerbang penuh, lalu commit**

```bash
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test

git add -A
git commit -m "$(cat <<'MSG'
slicing(shell): app shell, bottom tab, dan beranda sementara

Layar tidak tahu di mana navigasinya berada: jarak untuk bottom tab milik
AppShell, bukan halaman. Aturan itu yang membuat tata letak desktop nanti
hanya mengubah satu berkas. Beranda belum berangka karena angkanya belum
punya endpoint agregat di be-sada.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 13: "Semua modul" dan sheet submenu

**Files:**

- Create: `src/app/(app)/modul/page.tsx`
- Create: `src/app/(app)/modul/module-grid.tsx`
- Create: `src/components/common/bottom-sheet.tsx`

**Interfaces:**

- Consumes: `useSession` (Task 11); `MENU_ICON`, `menuHref` (Task 5); `PageHeader` (Task 12).
- Produces: rute `/modul`; `<BottomSheet isOpen title onClose>{children}</BottomSheet>`.

**Kenapa `<dialog>` dan bukan komponen sheet dari registry.** `<dialog>` sudah
memberi lapisan atas (top layer, tanpa perang z-index), `::backdrop`, penutupan
dengan Escape, dan pengurungan fokus — semuanya bawaan browser. Yang tersisa
untuk ditulis hanya animasi masuk dan penutupan saat backdrop diketuk. Menarik
komponen registry untuk itu berarti menambah permukaan yang harus dipahami demi
sesuatu yang sudah ada di platform.

- [ ] **Step 1: Tulis `src/components/common/bottom-sheet.tsx`**

```tsx
"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Sheet yang muncul dari bawah.
 *
 * Dibangun di atas `<dialog>` supaya lapisan atas, `::backdrop`, penutupan
 * dengan Escape, dan pengurungan fokus datang dari browser, bukan dari kode
 * yang harus dijaga sendiri.
 */
export function BottomSheet({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Ketukan di luar panel. `<dialog>` menganggap seluruh area termasuk
  // backdrop sebagai dirinya sendiri, jadi yang dibandingkan adalah target
  // ketukan dengan elemen dialog itu sendiri.
  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    // `showModal` melempar bila dipanggil pada dialog yang sudah terbuka, dan
    // `close` pada yang sudah tertutup memicu event `close` lagi — keduanya
    // dijaga dengan memeriksa `open` lebih dulu.
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      // Escape dan tombol tutup bawaan sama-sama memicu `close`; satu handler
      // di sini membuat state pemanggil ikut menyusul apa pun jalannya.
      onClose={onClose}
      onClick={onBackdropClick}
      className="bg-background text-foreground fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-2xl p-0 backdrop:bg-black/40"
    >
      <div
        className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
        aria-hidden
      />

      <div className="flex items-start gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="max-h-[60dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: Tulis `src/app/(app)/modul/module-grid.tsx`**

```tsx
"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BottomSheet } from "@/components/common/bottom-sheet";
import { PageHeader } from "@/components/layout/page-header";
import { MENU_ICON, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";

export function ModuleGrid() {
  const session = useSession();

  const [pickDomain, setPickDomain] = useState<MenuNode | null>(null);
  const [searchData, setSearchData] = useState("");

  const onCloseSheet = () => {
    setPickDomain(null);
  };

  // Pencarian menjangkau nama layar, bukan hanya nama domain: yang dicari
  // orang adalah "Kas Keluar", dan mereka belum tentu tahu itu ada di bawah
  // Keuangan. Domain tetap tampil bila salah satu layarnya cocok.
  const keyword = searchData.trim().toLowerCase();

  const domains = keyword
    ? session.menu.filter(
        (domain) =>
          domain.name.toLowerCase().includes(keyword) ||
          domain.children.some((leaf) =>
            leaf.name.toLowerCase().includes(keyword),
          ),
      )
    : session.menu;

  return (
    <div className="pb-6">
      <PageHeader
        title="Semua modul"
        subtitle={`${session.menu.length} domain · ${session.menu.reduce(
          (total, domain) => total + domain.children.length,
          0,
        )} layar`}
        backHref="/"
      />

      <div className="px-4 pb-4">
        <div className="border-input bg-background flex h-11 items-center gap-2 rounded-xl border px-3">
          <Search
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden
          />

          <input
            value={searchData}
            onChange={(event) => setSearchData(event.target.value)}
            placeholder="Cari modul atau layar"
            aria-label="Cari modul atau layar"
            className="h-full w-full bg-transparent text-base outline-none"
          />
        </div>
      </div>

      {domains.length === 0 ? (
        <p className="text-muted-foreground px-4 py-10 text-center text-sm">
          Tidak ada modul yang cocok dengan &ldquo;{searchData}&rdquo;.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-4 px-4">
          {domains.map((domain) => {
            const Icon = MENU_ICON[domain.slug];

            return (
              <li key={domain.publicId}>
                <button
                  type="button"
                  onClick={() => setPickDomain(domain)}
                  className="flex w-full flex-col items-center gap-1.5 text-center"
                >
                  <span className="bg-muted flex size-14 items-center justify-center rounded-2xl">
                    {Icon ? <Icon className="size-6" aria-hidden /> : null}
                  </span>

                  <span className="text-xs leading-tight">{domain.name}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {domain.children.length} layar
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-muted-foreground px-4 pt-8 text-xs">
        Modul yang tidak Anda pegang tidak ditampilkan.
      </p>

      <BottomSheet
        isOpen={pickDomain !== null}
        title={pickDomain?.name ?? ""}
        subtitle={
          pickDomain
            ? `${pickDomain.children.length} layar · ${pickDomain.slug}`
            : undefined
        }
        onClose={onCloseSheet}
      >
        <ul className="divide-border divide-y">
          {pickDomain?.children.map((leaf) => (
            <li key={leaf.publicId}>
              <Link
                href={menuHref(pickDomain.slug, leaf.slug)}
                onClick={onCloseSheet}
                className="flex h-14 items-center justify-between px-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{leaf.name}</span>
                  <span className="text-muted-foreground block truncate text-[11px]">
                    {leaf.slug}
                  </span>
                </span>

                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}
```

- [ ] **Step 3: Tulis `src/app/(app)/modul/page.tsx`**

```tsx
import { ModuleGrid } from "./module-grid";

export const metadata = { title: "Semua modul" };

/**
 * Sengaja tipis. Seluruh isinya berasal dari sesi yang sudah dibagikan
 * `SessionProvider`, jadi tidak ada panggilan API kedua di sini — itulah
 * kenapa `ModuleGrid` client, bukan server.
 */
export default function Page() {
  return <ModuleGrid />;
}
```

- [ ] **Step 4: Uji manual**

1. `/modul` menampilkan 12 domain berikut jumlah layarnya (sebagai admin).
2. Ketuk satu domain → sheet naik dari bawah berisi daftar layar domain itu.
3. Escape menutup sheet. Ketukan di area gelap menutup sheet. Tombol X menutup
   sheet.
4. Ketuk satu layar → berpindah ke rutenya (404, karena layar itu baru dibangun
   di Fase 3 dan seterusnya — itu yang diharapkan pada akhir Fase 1).
5. Ketik "kas" di pencarian → hanya Keuangan yang tersisa, karena "Kas Masuk"
   dan "Kas Keluar" ada di dalamnya.
6. Masuk sebagai non-admin → hanya domain yang dipegang perannya yang tampil,
   dan jumlah layarnya lebih sedikit dari yang dilihat admin.

- [ ] **Step 5: Verifikasi akhir Fase 1**

Jalankan seluruh daftar di §13 dokumen desain yang sudah bisa diuji sekarang:

```bash
# Aset PWA lolos proxy — tanpa cookie sesi
curl -s -o /dev/null -w "manifest %{http_code} %{content_type}\n" http://localhost:3000/manifest.webmanifest
curl -s -o /dev/null -w "sw       %{http_code} %{content_type}\n" http://localhost:3000/sw.js

# Konvensi ditegakkan
bunx eslint --no-inline-config tests/fixtures/eslint-konvensi.tsx

# Gerbang
bun run lint && bun run typecheck && API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test
```

Ditambah dua pemeriksaan manual yang tidak bisa diotomatiskan sekarang:

- **Cookie same-origin di iOS nyata** (bukan simulator): login, pasang ke home
  screen, tutup aplikasi, buka lagi — sesi masih hidup.
- **Izin benar-benar menyembunyikan:** dengan akun non-admin, domain yang tidak
  dipegang tidak ada **di DOM** `/modul`, bukan sekadar tidak terlihat.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'MSG'
slicing(shell): halaman semua modul dan sheet submenu

Daftar domain dan layarnya dirender dari menu tree API, bukan dari konstanta
di FE, sehingga menu yang ditambahkan be-sada muncul tanpa rilis FE. Sheet
dibangun di atas dialog: lapisan atas, backdrop, escape, dan pengurungan
fokus datang dari browser.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Yang sengaja TIDAK dikerjakan di Fase 0 + 1

Ditulis supaya tidak ada yang menambahkannya "sekalian":

- **Toast / notifikasi global.** Galat login dan galat form pertama tampil di
  dalam formnya, dan di situ memang tempatnya. Toast dibangun di Fase 3, saat
  mutation pertama membutuhkan pemberitahuan sukses yang tidak punya tempat di
  layar.
- **Wrapper berkontrak** (`ActionBar`, `DataList`, `FormField`, `FilterChips`,
  `SearchInput`, `WizardHeader`, `ConfirmDialog`). Dibangun di Fase 2 dari
  kebutuhan nyata Daftar Jemaat. Wrapper yang ditulis sebelum ada layar yang
  memakainya selalu salah bentuk.
- **`useListParams`.** Belum ada daftar yang memfilter apa pun.
- **`ModalLoading`.** Lihat §10 dokumen desain.
- **Sidebar desktop.** Lihat §12 dokumen desain — D1 spec PWA belum
  direkonsiliasi dengan bottom tab di mockup.
- **Angka di Beranda.** Belum ada endpoint agregatnya di be-sada.
- **Logout.** Endpointnya ada (`DELETE /api/v1/auth/logout`), tapi tempatnya di
  layar profil, dan layar profil bukan bagian Fase 1. Ditambahkan di Fase 4
  bersama Pengaturan.
