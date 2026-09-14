import { notFound } from "next/navigation";

/**
 * Penampung setiap layar `/<domain>/<layar>` yang belum dibangun.
 *
 * Kenapa berkas ini ada, padahal sudah ada `(app)/not-found.tsx`: di Next, URL
 * yang tidak cocok dengan rute mana pun TIDAK dilayani oleh `not-found.tsx`
 * milik route group — ia diselesaikan di tingkat routing dan jatuh ke
 * `src/app/not-found.tsx` yang ada di ROOT, di luar `(app)`. Dibuktikan
 * langsung: sebelum berkas ini ada, `/ibadah/jadwal` membalas "Halaman tidak
 * ditemukan" tanpa `AppShell` maupun bottom tab, dan `(app)/not-found.tsx`
 * tidak pernah dipanggil sama sekali. `notFound()` di sini yang
 * menyambungkannya: segmen ini berada DI DALAM `(app)`, jadi Next merender
 * `not-found.tsx` terdekat — yang milik `(app)` — beserta layout di atasnya.
 *
 * KENAPA DUA SEGMEN, BUKAN `[...slug]`. Percobaan pertama memakai catch-all
 * `(app)/[...slug]`, dan itu MERUSAK ASET: catch-all di level root menarik
 * juga `/favicon.ico`, yang tadinya 404 polos, menjadi HALAMAN HTML berstatus
 * 200. Itu persis kelas kegagalan yang diperingatkan blok komentar di
 * `src/proxy.ts` — aset yang dijawab HTML gagal diam-diam tanpa pesan apa pun.
 *
 * Dua segmen bukan kompromi, melainkan bentuk yang benar: `menuHref` di
 * `src/config/menu.ts` menurunkan SETIAP dari 61 layar sebagai
 * `/<domain>/<layar>`, tidak pernah lebih dalam dan tidak pernah lebih
 * dangkal. Path satu segmen (`/favicon.ico`, `/robots.txt`, salah ketik)
 * karena itu tidak lagi tersentuh dan tetap jatuh ke 404 root, sebagaimana
 * mestinya.
 *
 * Rute yang sudah punya berkasnya sendiri tidak terpengaruh: segmen statis
 * selalu menang atas segmen dinamis. Begitu satu dari 61 layar itu dibangun,
 * ia otomatis berhenti lewat sini — tidak ada daftar yang perlu diperbarui.
 */
export default function Page() {
  notFound();
}
