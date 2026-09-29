/** Jurnal — dipindahkan dari blok inline dev-mock (README §4 TL-4). */
import { MENU } from "../../../src/config/menu";
import { JOURNAL_ENTRY, journalList, journalView } from "../keuangan-store";
import { denied, json, list, type MockHandler } from "../kit";

export const jurnalMock: MockHandler = (ctx) => {
  const { path, method, url, can } = ctx;

  if (path !== "/jurnal" && !path.startsWith("/jurnal/")) return null;
  if (method !== "GET") return null;
  if (!can(MENU.JURNAL, "VIEW")) return denied();

  if (path === "/jurnal") {
    return list(
      journalList(url.searchParams).map((row) => journalView(row)),
      url,
      "Jurnal",
      "Jurnal",
    );
  }

  const code = decodeURIComponent(path.slice("/jurnal/".length)).toLowerCase();
  const row = JOURNAL_ENTRY.find(
    (item) => item.code.toLowerCase() === code || item.publicId === code,
  );

  if (!row) return json({ status: 404, error: "Jurnal Tidak Ditemukan" }, 404);

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Jurnal",
    data: journalView(row, true),
  });
};
