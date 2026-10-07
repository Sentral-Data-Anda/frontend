import { PANEL_TITLE, Panel } from "@/components/common/display";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { PayslipLine } from "../types";

/**
 * Baris yang DATANG dirender; nol cabang khusus untuk baris yang tidak ada.
 * Gereja ini tidak memotong PPh21, jadi slip tanpa baris pajak adalah hasil
 * yang benar — bukan sesuatu yang layar ini tandai atau isi dengan "Rp 0".
 */
interface PropTypes {
  label: string;
  lines: readonly PayslipLine[];
  total: string;
  totalLabel: string;
}

export const SlipLinePanel = (props: PropTypes) => {
  const { label, lines, total, totalLabel } = props;

  if (lines.length === 0) return null;

  return (
    <Panel label={label}>
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4 pb-2")}>{label}</h2>

      <ul className="divide-hairline divide-y border-hairline border-t">
        {lines.map((line) => (
          <li
            key={line.publicId}
            className="flex items-baseline gap-4 px-gutter py-2.5"
          >
            <span
              className="min-w-0 flex-1 text-body wrap-break-word"
              title={line.componentName}
            >
              {line.componentName}
            </span>
            <span className="shrink-0 text-body tabular-nums">
              {formatAmount(line.amount)}
            </span>
          </li>
        ))}

        <li className="bg-muted/40 flex items-baseline gap-4 px-gutter py-2.5">
          <span className="text-muted-foreground min-w-0 flex-1 text-body">
            {totalLabel}
          </span>
          <span className="shrink-0 text-body font-semibold tabular-nums">
            {formatAmount(total)}
          </span>
        </li>
      </ul>
    </Panel>
  );
};
