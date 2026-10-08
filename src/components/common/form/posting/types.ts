/**
 * Apa yang dijawab sebuah batch posting.
 *
 * Satu bentuk, dipakai setiap layar posting. Tiga angka dan bukan sebuah
 * pengecualian: batch yang hanya melaporkan keberhasilan menyembunyikan baris
 * yang tidak pernah sampai ke buku, dan itu muncul jauh belakangan sebagai
 * neraca yang tidak cocok.
 */
export type PostingRefusal = {
  code: string;
  reason: string;
  reasonCode: string;
};

export type PostingResult = {
  posted: number;
  skipped: number;
  refused: PostingRefusal[];
};
