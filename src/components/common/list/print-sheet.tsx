import type { ReactNode } from "react";

export interface PrintColumn<T> {
  key: string;
  header: string;
  align?: "start" | "end";
  cell: (row: T) => ReactNode;
}

interface PropTypes<T> {
  title: string;
  /** Periode dan filter yang menghasilkan daftar ini. */
  subtitle?: string;
  columns: readonly PrintColumn<T>[];
  rows: readonly T[];
  getKey: (row: T) => string;
  /** Baris penutup, biasanya jumlah. */
  footer?: ReactNode;
}

/**
 * Daftar lengkap untuk dicetak, tersembunyi di layar.
 *
 * Terpisah dari tabel di layar karena keduanya menjawab kebutuhan berbeda:
 * yang di layar berhalaman dan bisa diklik, yang ini utuh dan datar supaya
 * bisa dicocokkan baris demi baris dengan rekening koran.
 */
export function PrintSheet<T>(props: PropTypes<T>) {
  const { title, subtitle, columns, rows, getKey, footer } = props;

  return (
    <section className="hidden px-gutter print:block">
      <h2 className="text-lead font-semibold">{title}</h2>

      {subtitle ? <p className="text-body">{subtitle}</p> : null}

      <p className="text-muted-foreground pb-3 text-caption">
        {rows.length} baris
      </p>

      <table className="w-full border-collapse text-body">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`border-hairline border-b py-1 font-semibold ${
                  column.align === "end" ? "text-right" : "text-left"
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`border-hairline border-b py-1 align-top ${
                    column.align === "end" ? "text-right tabular-nums" : ""
                  }`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {footer ? <div className="pt-3 font-semibold">{footer}</div> : null}
    </section>
  );
}
