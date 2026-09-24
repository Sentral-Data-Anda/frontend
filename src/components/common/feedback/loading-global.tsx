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
