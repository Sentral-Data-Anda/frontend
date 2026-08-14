import type { MetadataRoute } from "next";

import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";

/**
 * Web App Manifest — disajikan di `/manifest.webmanifest`. Next menyuntikkan
 * `<link rel="manifest">` secara otomatis.
 *
 * JANGAN memakai `cookies()` atau `headers()` di berkas ini. Dokumentasi Next:
 * `manifest.js` adalah Route Handler yang "cached by default unless it uses a
 * Request-time API". Begitu menjadi dinamis, manifest ikut jalur auth dan bisa
 * gagal diambil browser — dan manifest yang gagal diambil berarti tombol
 * install hilang tanpa pesan error apa pun.
 *
 * Hal yang sama berlaku untuk proxy: `/manifest.webmanifest`, `/sw.js`, dan
 * `/icons/*` WAJIB dikecualikan dari pengalihan auth lewat `config.matcher` di
 * `src/proxy.ts`. Bila `/manifest.webmanifest` dialihkan ke `/login`, browser
 * menerima HTML alih-alih JSON dan menganggap manifest tidak valid — juga
 * tanpa error yang terlihat. Proxy itu belum ada; ditulis bersamaan dengan
 * auth nanti.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Identitas permanen. Bila `id` berubah, browser menganggapnya aplikasi
    // BARU: semua instalasi lama menjadi yatim dan user harus memasang ulang.
    // Tidak pernah diubah.
    id: "/",

    name: siteConfig.name,
    short_name: siteConfig.shortName,

    // Wajib ada. Tanpa `description`, dialog instalasi desktop Chrome tetap
    // generik meskipun screenshot-nya valid.
    description: siteConfig.description,

    // Landing yang mengalihkan sendiri: sudah login ke dashboard, belum ke
    // /login. URL di luar `scope` dibuka di browser biasa, bukan window app.
    start_url: "/",
    scope: "/",

    display: "standalone",
    display_override: ["standalone"],

    // Cegah window menumpuk saat notifikasi diklik berkali-kali di desktop.
    // Lapis kedua ada di handler `notificationclick` service worker (fase 2).
    launch_handler: { client_mode: "navigate-existing" },

    // `orientation` SENGAJA tidak diisi. Mengunci portrait akan menyulitkan
    // tabel CRUD di tablet, dan nilai default (`any`) sudah benar.

    background_color: brand.backgroundColor,
    theme_color: brand.themeColor.light,

    lang: "id",
    dir: "ltr",

    // Eksplisit: jangan arahkan user ke app store mana pun.
    prefer_related_applications: false,

    // Empat berkas terpisah, bukan satu yang di-resize:
    //
    // - `any`      — dipakai apa adanya oleh desktop dan dialog instalasi.
    //                Sudah membawa latar biru SADA sendiri.
    // - `maskable` — Android memotongnya menjadi lingkaran/squircle. Isinya
    //                dikecilkan ke 90% lalu di-pad warna latar yang sama,
    //                sehingga seluruh logo berada di dalam safe zone
    //                (lingkaran berdiameter 80% sisi ikon) tanpa terlihat
    //                seperti ditambal.
    //
    // `purpose: "any maskable"` pada satu berkas SENGAJA tidak dipakai:
    // sintaksnya sah, tapi artinya satu gambar melayani dua peran — Android
    // memotongnya, sementara desktop menampilkan versi ber-padding sehingga
    // logo tampak kekecilan.
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    // `screenshots` sengaja belum diisi (fase 1b). Screenshot harus tangkapan
    // layar asli, jadi baru bisa dibuat setelah app shell ada. Placeholder
    // lebih buruk daripada tidak ada: user melihat UI palsu di dialog
    // instalasi. Perhatikan saat mengisinya nanti — Chrome membuang SELURUH
    // set `wide` bila rasio aspek antar-screenshot tidak seragam, lalu jatuh
    // ke dialog generik tanpa memberi tahu kenapa.
    //
    // `shortcuts` juga ditunda ke fase 1b: targetnya belum ada, dan karena
    // shortcuts bersifat statis ia tidak bisa sadar-peran — targetnya harus
    // mengalihkan dengan anggun bila peran user tidak punya akses.
  };
}
