/**
 * Gaya tautan ke halaman detail. Tiga fitur memegang salinan `link-style.ts`
 * sendiri (Program, Laporan Budget, Kas Keluar) dan DUA di antaranya sudah
 * menyimpang \u2014 Kas Keluar kehilangan cincin `focus-visible`. Salinan itu
 * tidak disentuh di sini: mengubahnya mengubah tampilan tiga layar yang sudah
 * ter-merge, dan itu butuh review visual sendiri. Yang baru memakai ini.
 */
export const DETAIL_LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 outline-none transition-colors hover:decoration-primary focus-visible:ring-ring focus-visible:rounded-sm focus-visible:ring-2";
