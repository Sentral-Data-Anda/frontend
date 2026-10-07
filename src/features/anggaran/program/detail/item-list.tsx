import { Panel } from "@/components/common/display";
import { formatAmount, formatNumber } from "@/lib/format";
import { sumAmounts } from "@/lib/number";

import type { ProgramItem } from "../types";

interface PropTypes {
  items: readonly ProgramItem[];
}

export const ItemList = (props: PropTypes) => {
  const { items } = props;

  const total = sumAmounts(items.map((item) => item.amount));

  return (
    <Panel label="Rincian anggaran">
      <div className="px-gutter py-3">
        <h2 className="text-title font-semibold">Rincian anggaran</h2>
      </div>

      <ul className="divide-hairline divide-y">
        {items.map((item) => (
          <li
            key={item.publicId}
            className="flex items-baseline gap-3 px-gutter py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-medium">
                {item.description}
              </span>
              <span className="text-muted-foreground block truncate text-caption">
                {[
                  item.account
                    ? `${item.account.code} · ${item.account.name}`
                    : null,
                  `${formatNumber(Number(item.quantity))} × ${formatAmount(item.unitPrice)}`,
                  item.note,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>

            <span className="shrink-0 text-body font-medium tabular-nums">
              {formatAmount(item.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-hairline flex items-baseline justify-between gap-3 border-t px-gutter py-3 text-body font-medium">
        <span>Total usulan</span>
        <span className="tabular-nums">{formatAmount(total)}</span>
      </div>
    </Panel>
  );
};
