/** Periode Fiskal — dipindahkan dari blok inline dev-mock (README §4 TL-4). */
import { MENU } from "../../../src/config/menu";
import { FISCAL_PERIOD, periodView } from "../keuangan-store";
import { denied, json, list, type MockHandler } from "../kit";

export const periodeFiskalMock: MockHandler = (ctx) => {
  const { path, method, url, can } = ctx;

  if (path !== "/periode-fiskal" && !path.startsWith("/periode-fiskal/")) {
    return null;
  }
  if (method !== "GET") return null;
  if (!can(MENU.PERIODE_FISKAL, "VIEW")) return denied();

  if (path === "/periode-fiskal") {
    const year = Number(url.searchParams.get("year")) || null;
    const status = url.searchParams.get("status");
    const rows = FISCAL_PERIOD.filter(
      (row) =>
        (!year || row.year === year) &&
        (!["OPEN", "CLOSED"].includes(status ?? "") || row.status === status),
    ).map(periodView);

    return list(rows, url, "Periode Fiskal", "Periode Fiskal");
  }

  const id = decodeURIComponent(path.slice("/periode-fiskal/".length));
  const row = FISCAL_PERIOD.find((item) => item.id === id);

  if (!row) {
    return json({ status: 404, error: "Periode Fiskal Tidak Ditemukan" }, 404);
  }

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Periode Fiskal",
    data: periodView(row),
  });
};
