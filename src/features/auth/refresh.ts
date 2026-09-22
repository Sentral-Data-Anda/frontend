import { pickSessionCookies, stripCookieDomain } from "@/lib/api/cookie";
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
      headers: { Cookie: pickSessionCookies(cookieHeader) },
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
