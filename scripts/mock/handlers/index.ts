import type { MockHandler } from "../kit";

import { activityLogMock } from "./activity-log";
import { bapelMock } from "./bapel";
import { eventMock } from "./event";
import { galeriMock } from "./galeri";
import { hariLiburMock } from "./hari-libur";
import { ibadahMock } from "./ibadah";
import { jadwalPelayanMock } from "./jadwal-pelayan";
import { jadwalSayaMock } from "./jadwal-saya";
import { kegiatanMock } from "./kegiatan";
import { keluargaMock } from "./keluarga";
import { masterJemaatMock } from "./master-jemaat";
import { pelayanMock } from "./pelayan";
import { pelayananDdlMock } from "./pelayanan-ddl";
import { pendaftaranEventMock } from "./pendaftaran-event";
import { pengumumanMock } from "./pengumuman";
import { pengumumanFeedMock } from "./pengumuman-feed";
import { permintaanPersetujuanMock } from "./permintaan-persetujuan";
import { pernikahanMock } from "./pernikahan";
import { reportJemaatMock } from "./report-jemaat";
import { riwayatJemaatMock } from "./riwayat-jemaat";
import { roleJemaatMock } from "./role-jemaat";
import { rolePelayanMock } from "./role-pelayan";
import { roleUserMock } from "./role-user";
import { setelanPersetujuanMock } from "./setelan-persetujuan";
import { skillMusikMock } from "./skill-musik";
import { templateJadwalMock } from "./template-jadwal";
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
];
