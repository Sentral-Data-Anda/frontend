import type { MockHandler } from "../kit";

import { activityLogMock } from "./activity-log";
import { akunMock } from "./akun";
import { bapelMock } from "./bapel";
import { barangMock } from "./barang";
import { barangPersediaanMock } from "./barang-persediaan";
import { eventMock } from "./event";
import { fasilitasMock } from "./fasilitas";
import { galeriMock } from "./galeri";
import { hariLiburMock } from "./hari-libur";
import { ibadahMock } from "./ibadah";
import { inventarisMock } from "./inventaris";
import { jadwalPelayanMock } from "./jadwal-pelayan";
import { jadwalSayaMock } from "./jadwal-saya";
import { jurnalMock } from "./jurnal";
import { kasKeluarMock } from "./kas-keluar";
import { kasMasukMock } from "./kas-masuk";
import { kegiatanMock } from "./kegiatan";
import { keluargaMock } from "./keluarga";
import { keuanganMock } from "./keuangan";
import { laporanKeuanganMock } from "./laporan-keuangan";
import { masterJemaatMock } from "./master-jemaat";
import { mataUangMock } from "./mata-uang";
import { mutasiStokMock } from "./mutasi-stok";
import { pelayanMock } from "./pelayan";
import { pelayananDdlMock } from "./pelayanan-ddl";
import { pembayaranMock } from "./pembayaran";
import { peminjamanRuangMock } from "./peminjaman-ruang";
import { pendaftaranEventMock } from "./pendaftaran-event";
import { penerimaanBarangMock } from "./penerimaan-barang";
import { pengadaanMock } from "./pengadaan";
import { pengumumanMock } from "./pengumuman";
import { pengumumanFeedMock } from "./pengumuman-feed";
import { penyusutanMock } from "./penyusutan";
import { periodeFiskalMock } from "./periode-fiskal";
import { permintaanPembelianMock } from "./permintaan-pembelian";
import { permintaanPersetujuanMock } from "./permintaan-persetujuan";
import { pernikahanMock } from "./pernikahan";
import { persembahanMock } from "./persembahan";
import { pesananPembelianMock } from "./pesanan-pembelian";
import { reportJemaatMock } from "./report-jemaat";
import { riwayatJemaatMock } from "./riwayat-jemaat";
import { roleJemaatMock } from "./role-jemaat";
import { rolePelayanMock } from "./role-pelayan";
import { roleUserMock } from "./role-user";
import { ruangMock } from "./ruang";
import { satuanMock } from "./satuan";
import { setelanPersetujuanMock } from "./setelan-persetujuan";
import { setoranMock } from "./setoran";
import { siklusAsetMock } from "./siklus-aset";
import { skillMusikMock } from "./skill-musik";
import { stokOpnameMock } from "./stok-opname";
import { supplierMock } from "./supplier";
import { templateJadwalMock } from "./template-jadwal";
import { tipeBarangMock } from "./tipe-barang";
import { tipeIbadahMock } from "./tipe-ibadah";
import { userMock } from "./user";
import { wilayahMock } from "./wilayah";

// Satu berkas per sub menu; berkas ini tidak perlu disentuh agent fitur.
export const MOCK_HANDLERS: MockHandler[] = [
  keluargaMock,
  pernikahanMock,
  riwayatJemaatMock,
  roleJemaatMock,
  bapelMock,
  reportJemaatMock,
  wilayahMock,
  masterJemaatMock,
  userMock,
  roleUserMock,
  activityLogMock,
  hariLiburMock,
  permintaanPersetujuanMock,
  setelanPersetujuanMock,
  tipeIbadahMock,
  ibadahMock,
  pelayananDdlMock,
  rolePelayanMock,
  skillMusikMock,
  pelayanMock,
  templateJadwalMock,
  jadwalSayaMock,
  jadwalPelayanMock,
  eventMock,
  pendaftaranEventMock,
  galeriMock,
  pengumumanFeedMock,
  pengumumanMock,
  kegiatanMock,
  ruangMock,
  peminjamanRuangMock,
  fasilitasMock,
  tipeBarangMock,
  satuanMock,
  barangMock,
  barangPersediaanMock,
  mutasiStokMock,
  stokOpnameMock,
  siklusAsetMock,
  penyusutanMock,
  supplierMock,
  permintaanPembelianMock,
  pesananPembelianMock,
  penerimaanBarangMock,
  mataUangMock,
  akunMock,
  periodeFiskalMock,
  jurnalMock,
  persembahanMock,
  kasMasukMock,
  kasKeluarMock,
  setoranMock,
  pembayaranMock,
  laporanKeuanganMock,
  pengadaanMock,
  inventarisMock,
  keuanganMock,
];
