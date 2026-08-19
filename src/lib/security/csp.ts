/**
 * Penyusun Content Security Policy.
 *
 * Dipisah dari `src/proxy.ts` supaya bisa diuji sebagai fungsi murni — CSP yang
 * salah satu direktifnya hilang tidak menimbulkan error apa pun, ia cuma
 * berhenti melindungi. Satu-satunya cara tahu ia benar adalah mengujinya.
 *
 * === KENAPA NONCE, BUKAN CSP STATIS DI next.config.ts ===
 * Next menyuntikkan `<script>` inline untuk hidrasi dan streaming. Dengan
 * `script-src 'self'` tanpa nonce, skrip itu ikut diblokir dan aplikasi mati
 * total. Satu-satunya jalan keluar tanpa nonce adalah `'unsafe-inline'`, dan
 * itu membuat seluruh CSP tidak ada gunanya terhadap XSS — persis serangan
 * yang ingin dicegah.
 *
 * Konsekuensinya, sesuai dokumentasi Next: halaman yang memakai nonce WAJIB
 * dirender dinamis, karena nonce dibuat per-request sementara halaman statis
 * dibangun saat build ketika request belum ada. Untuk SADA itu bukan
 * pengorbanan — hampir seluruh halamannya terautentikasi dan memang dinamis.
 */

type CspOptions = {
  nonce: string;
  /**
   * `'unsafe-eval'` hanya untuk development.
   *
   * Dokumentasi Next: "In development, 'unsafe-eval' is required because React
   * uses eval to provide enhanced debugging information, such as reconstructing
   * server-side error stacks in the browser. unsafe-eval is not required for
   * production."
   */
  isDev: boolean;
};

export function buildContentSecurityPolicy({
  nonce,
  isDev,
}: CspOptions): string {
  const directives = [
    // Titik awal yang menolak segalanya; direktif di bawah membuka seperlunya.
    `default-src 'self'`,

    // `'strict-dynamic'` membuat skrip yang sudah dipercaya lewat nonce boleh
    // memuat skrip turunannya. Ini yang membuat chunk Next bekerja tanpa perlu
    // mendaftar setiap berkas satu per satu.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,

    `style-src 'self' 'nonce-${nonce}'`,

    // `data:` dipakai untuk gambar inline kecil; `blob:` untuk pratinjau berkas
    // sebelum diunggah (unggah foto jemaat nanti butuh ini).
    `img-src 'self' blob: data:`,

    // Font Geist di-hosting sendiri oleh `next/font/google` saat build, jadi
    // tidak perlu membuka fonts.gstatic.com.
    `font-src 'self'`,

    // PENTING SAAT MENAMBAH PANGGILAN API DARI BROWSER.
    // Sekarang seluruh panggilan API terjadi di server (Server Component lewat
    // apiClient), jadi `'self'` cukup. Begitu ada fetch dari komponen client
    // atau koneksi socket.io ke backend, origin backend HARUS ditambahkan di
    // sini — termasuk skema `wss:` untuk socket. Tanpa itu koneksinya diblokir
    // diam-diam dan hanya terlihat di console browser production.
    `connect-src 'self'`,

    // Dua direktif khusus PWA. Tanpa keduanya, registrasi service worker dan
    // pengambilan manifest bisa terblokir, dan aplikasi berhenti installable.
    `worker-src 'self'`,
    `manifest-src 'self'`,

    // Matikan plugin lawas sepenuhnya.
    `object-src 'none'`,

    // Cegah penyerang mengubah basis resolusi URL relatif lewat `<base>` yang
    // disuntikkan.
    `base-uri 'self'`,

    // Form hanya boleh mengirim ke origin sendiri.
    `form-action 'self'`,

    // Anti-clickjacking. Menggantikan peran `X-Frame-Options: DENY` di browser
    // modern; header itu tetap dipertahankan untuk browser lama.
    `frame-ancestors 'none'`,

    // Naikkan sisa permintaan http:// menjadi https://.
    `upgrade-insecure-requests`,
  ];

  return directives.join("; ");
}

/**
 * Nonce acak per-request.
 *
 * Memakai Web Crypto, bukan `Buffer`, supaya berjalan apa adanya di runtime
 * Edge tempat proxy dieksekusi. 16 byte acak sudah jauh melewati anjuran
 * minimum 128 bit.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
