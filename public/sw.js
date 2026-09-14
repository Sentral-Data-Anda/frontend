/**
 * Service worker SADA — fase 1 (siklus hidup + cache aset statis).
 *
 * Belum ada handler `push`/`notificationclick`; itu fase 2 dan terblokir
 * prasyarat backend. Lihat
 * docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md §5.
 *
 * Berkas ini disajikan apa adanya dari `public/` — tidak di-bundle, tidak
 * di-transpile. Jadi: JavaScript polos, tanpa import kode aplikasi, tanpa
 * sintaks yang butuh build step.
 *
 * ===================================================================
 * ATURAN KEAMANAN — jangan diubah tanpa membaca §5.3 spec
 * ===================================================================
 * SADA adalah aplikasi terautentikasi berisi data jemaat, dan PC sekretariat
 * adalah perangkat bersama. Karena itu:
 *
 *   1. Handler `fetch` memakai DAFTAR PUTIH. Apa pun yang tidak cocok
 *      di-`return` lebih awal dan dibiarkan lewat ke jaringan tanpa
 *      disentuh. JANGAN pernah memanggil `event.respondWith()` untuk semua
 *      request — tangkap-semua adalah cara paling umum data terautentikasi
 *      berakhir di CacheStorage.
 *   2. HTML navigasi TIDAK PERNAH masuk cache. Halaman aplikasi dirender di
 *      server dan isinya data jemaat; sekali masuk CacheStorage ia bertahan
 *      melewati logout dan bisa dibaca user berikutnya.
 *   3. Respons API TIDAK PERNAH masuk cache, dengan alasan yang sama.
 *
 * Yang di-cache hanya aset build yang tidak mengandung data siapa pun.
 */

/**
 * Versi cache diambil dari query `?v=` pada URL service worker ini.
 *
 * Klien mendaftarkannya sebagai `/sw.js?v=<BUILD_ID>` (lihat
 * src/features/pwa/lib/register.ts). Browser membandingkan service worker
 * per-URL, jadi query yang berubah berarti resource berbeda dan `install`
 * menyala — tanpa build script, tanpa route handler, aman untuk Turbopack.
 *
 * Ini memperbaiki mode kegagalan konstanta versi yang ditulis keras: konstanta
 * seperti itu tidak pernah berubah, sehingga cache lama nyangkut selamanya dan
 * setiap perbaikan berikutnya tidak pernah sampai ke user.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";

const CACHE_PREFIX = "sada-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

/** Halaman fallback saat navigasi gagal karena tidak ada jaringan. */
const OFFLINE_URL = "/offline";

/**
 * Yang di-precache saat install. Shell saja, BUKAN data.
 *
 * `/offline` sengaja satu-satunya halaman di sini: isinya statis dan nol data,
 * jadi aman bertahan di perangkat bersama.
 */
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
];

/**
 * Path yang tidak boleh disentuh sama sekali, meski se-origin.
 *
 * `/api/` di sini adalah PERTAHANAN UTAMA, bukan jaring pengaman. Dulu
 * seluruh panggilan API menuju origin be-sada yang berbeda, sehingga
 * pemeriksaan lintas-origin di bawah sudah menutupnya lebih dulu. Sejak ada
 * BFF di `src/app/api/[...path]/route.ts`, panggilan API justru SE-ORIGIN:
 * ia lolos pemeriksaan itu dan tiba di sini. Setiap responsnya membawa data
 * terautentikasi milik satu user, di perangkat yang sering dipakai bergantian
 * — kalau baris ini hilang, data itu ter-cache dan tersaji ke orang
 * berikutnya.
 */
const NEVER_TOUCH_PREFIXES = ["/api/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );

  // `skipWaiting()` SENGAJA tidak dipanggil di sini. Service worker baru
  // menunggu di `waiting` sampai user menyetujui lewat toast (lihat handler
  // pesan SKIP_WAITING di bawah).
  //
  // Alasannya bukan kehati-hatian abstrak: bila service worker baru mengambil
  // alih di tengah sesi, chunk yang dimuat lazy berikutnya berasal dari build
  // baru sementara HTML-nya dari build lama. Chunk 404 dan aplikasi mati. Pada
  // layar CRUD dengan form panjang, itu berarti user kehilangan isian yang
  // belum tersimpan.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/**
 * Apakah respons ini aman disimpan?
 *
 * Ketiga syarat wajib:
 * - `response.ok` — jangan menyimpan 404/500, kalau tidak error ikut tersaji
 *   saat offline dan terlihat seperti halaman rusak permanen.
 * - `response.type === "basic"` — respons opaque (status 0) tidak bisa
 *   diperiksa isinya dan menggelembungkan kuota karena di-padding browser.
 * - Bukan `Cache-Control: no-store` — server sudah menyatakan jangan disimpan.
 */
function isCacheable(response) {
  if (!response || !response.ok || response.type !== "basic") {
    return false;
  }

  const cacheControl = response.headers.get("Cache-Control") || "";
  return !cacheControl.includes("no-store");
}

/** Cache-first: aset build ber-hash, isinya tidak pernah berubah per URL. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

/** Stale-while-revalidate: tampilkan cache segera, perbarui di latar. */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (isCacheable(response)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    return cached;
  }

  const response = await network;
  if (response) {
    return response;
  }

  return Response.error();
}

/**
 * Network-first untuk navigasi, dengan `/offline` sebagai jaring terakhir.
 *
 * Perhatikan: respons jaringannya TIDAK PERNAH disimpan. Itu disengaja dan
 * merupakan inti aturan keamanan nomor 2 di atas.
 */
async function navigateNetworkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    if (offline) {
      return offline;
    }

    return new Response(
      "Tidak ada koneksi dan halaman offline belum tersedia di perangkat ini.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Non-GET tidak pernah disentuh. Melewatkan POST/PUT/DELETE lewat service
  // worker tidak memberi manfaat apa pun dan hanya menambah cara gagal.
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Lintas-origin dilewatkan apa adanya: CDN pihak ketiga, gambar eksternal,
  // apa pun yang bukan milik kita. Yang TIDAK lagi ditutup baris ini adalah
  // API SADA — sejak ada BFF, panggilan API berangkat ke origin yang sama
  // dengan halaman dan melewati pemeriksaan ini tanpa hambatan. Yang
  // menahannya sekarang `NEVER_TOUCH_PREFIXES` di atas.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (NEVER_TOUCH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigateNetworkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Tidak cocok daftar putih mana pun: biarkan lewat ke jaringan tanpa
  // disentuh. Ketiadaan cabang penutup di sinilah yang membedakan daftar
  // putih dari tangkap-semua.
});
