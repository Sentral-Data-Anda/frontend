import type { MockHandler } from "../kit";

import { bapelMock } from "./bapel";
import { keluargaMock } from "./keluarga";
import { masterJemaatMock } from "./master-jemaat";
import { pernikahanMock } from "./pernikahan";
import { reportJemaatMock } from "./report-jemaat";
import { riwayatJemaatMock } from "./riwayat-jemaat";
import { roleJemaatMock } from "./role-jemaat";
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
];
