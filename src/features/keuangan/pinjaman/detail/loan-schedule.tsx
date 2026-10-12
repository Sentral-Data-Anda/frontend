"use client";

import { PANEL_TITLE, Panel } from "@/components/common/display";

import { money } from "../model";
import type { LoanScheduleRow } from "../types";

interface PropTypes {
  rows: readonly LoanScheduleRow[];
}

/**
 * Jadwal angsuran yang disepakati.
 *
 * Diturunkan dari pinjamannya, bukan disimpan: seluruh masukannya sudah beku,
 * jadi barisnya sama setiap kali diminta. Ini rencana, bukan catatan — yang
 * benar-benar dibayar ada di bagian catatan kas di bawahnya.
 */
export const LoanSchedule = (props: PropTypes) => {
  const { rows } = props;

  return (
    <Panel label="Jadwal angsuran">
      <h2 className={`${PANEL_TITLE} pb-1`}>Jadwal angsuran</h2>

      <p className="text-muted-foreground pb-3 text-body">
        Rencana menurut kesepakatan. Pembayaran yang sebenarnya dicatat lewat
        Kas Masuk atau Kas Keluar.
      </p>

      <div className="-mx-2.5 max-h-80 overflow-y-auto overscroll-contain px-2.5">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr>
              {["Bulan", "Pokok", "Bunga", "Jumlah"].map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={`border-hairline text-muted-foreground sticky top-0 border-b bg-card py-1 text-caption font-medium ${
                    index === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <td className="border-hairline border-b py-1 tabular-nums">
                  {row.month}
                </td>
                <td className="border-hairline border-b py-1 text-right tabular-nums">
                  {money(row.principal)}
                </td>
                <td className="border-hairline border-b py-1 text-right tabular-nums">
                  {Number(row.interest) === 0 ? "—" : money(row.interest)}
                </td>
                <td className="border-hairline border-b py-1 text-right font-medium tabular-nums">
                  {money(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};
