import type { MockHandler } from "../kit";

import { absensiKaryawanMock } from "./absensi-karyawan";
import { activityLogMock } from "./activity-log";
import { akunMock } from "./akun";
import { anggaranMock } from "./anggaran";
import { bapelMock } from "./bapel";
import { barangMock } from "./barang";
import { barangPersediaanMock } from "./barang-persediaan";
import { cutiMock } from "./cuti";
import { eventMock } from "./event";
import { fasilitasMock } from "./fasilitas";
import { galeriMock } from "./galeri";
import { hariLiburMock } from "./hari-libur";
import { ibadahMock } from "./ibadah";
import { inventarisMock } from "./inventaris";
import { jadwalPelayanMock } from "./jadwal-pelayan";
import { jadwalSayaMock } from "./jadwal-saya";
import { jurnalMock } from "./jurnal";
import { karyawanMock } from "./karyawan";
import { kasKeluarMock } from "./kas-keluar";
import { kasMasukMock } from "./kas-masuk";
import { kegiatanMock } from "./kegiatan";
import { keluargaMock } from "./keluarga";
import { keuanganMock } from "./keuangan";
import { komponenPayrollMock } from "./komponen-payroll";
import { kontrakKaryawanMock } from "./kontrak-karyawan";
import { laporanBudgetMock } from "./laporan-budget";
import { laporanKeuanganMock } from "./laporan-keuangan";
import { masterJemaatMock } from "./master-jemaat";
import { mataUangMock } from "./mata-uang";
import { mutasiStokMock } from "./mutasi-stok";
import { paguAnggaranMock } from "./pagu-anggaran";
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
import { programMock } from "./program";
import { reportJemaatMock } from "./report-jemaat";
import { riwayatJemaatMock } from "./riwayat-jemaat";
import { roleJemaatMock } from "./role-jemaat";
import { rolePelayanMock } from "./role-pelayan";
import { roleUserMock } from "./role-user";
import { ruangMock } from "./ruang";
import { satuanMock } from "./satuan";
import { setelanAkuntansiMock } from "./setelan-akuntansi";
import { setelanAnggaranMock } from "./setelan-anggaran";
import { setelanPersetujuanMock } from "./setelan-persetujuan";
import { setoranMock } from "./setoran";
import { siklusAsetMock } from "./siklus-aset";
import { skillMusikMock } from "./skill-musik";
import { stokOpnameMock } from "./stok-opname";
import { supplierMock } from "./supplier";
import { templateJadwalMock } from "./template-jadwal";
import { tipeBarangMock } from "./tipe-barang";
import { tipeCutiMock } from "./tipe-cuti";
import { tipeIbadahMock } from "./tipe-ibadah";
import { tipePersembahanMock } from "./tipe-persembahan";
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
  tipeCutiMock,
  cutiMock,
  karyawanMock,
  absensiKaryawanMock,
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
  setelanAkuntansiMock,
  tipePersembahanMock,
  periodeFiskalMock,
  jurnalMock,
  persembahanMock,
  kasMasukMock,
  kasKeluarMock,
  setoranMock,
  pembayaranMock,
  laporanKeuanganMock,
  setelanAnggaranMock,
  paguAnggaranMock,
  programMock,
  laporanBudgetMock,
  komponenPayrollMock,
  kontrakKaryawanMock,
  pengadaanMock,
  inventarisMock,
  keuanganMock,
  anggaranMock,
];
