"use client";

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  DETAIL_LINK,
  PANEL_TITLE,
  Panel,
} from "@/components/common/display";
import { MENU, detailHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatAmount, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FULL_MONTH_NOTE, VARIABLE_WAGE_NOTE, periodLabel } from "../model";
import type { PayrollRunDetail } from "../types";

interface PropTypes {
  run: PayrollRunDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { run } = props;

  const { isCanView: isCanViewJournal } = useMenuAccess(MENU.JURNAL);
  const { journal } = run;
  // `markPaid` menjawab `journal: { code }` SAJA — tanpa `publicId`. Tautan di
  // bawah aman hanya karena `usePayrollAction` meng-invalidate detailnya alih-
  // alih menulis responsnya ke cache: yang dirender selalu hasil baca ulang,
  // yang membawa `publicId`. Mengganti invalidate itu dengan `setQueryData`
  // mematahkan tautan ini tanpa satu pun test merah.
  // Nol klaim tentang jurnal untuk run yang sudah dibayar tapi datanya tidak
  // membawa entry-nya: `markPaid` menulisnya, jadi "Belum diposting" di situ
  // akan salah. Sebelum dibayar, "Belum diposting" benar dari mesin statusnya.
  const isJournalShown = run.status !== "PAID" || Boolean(journal);

  return (
    <Panel label="Ringkasan penggajian">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Ringkasan</h2>

      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Periode">
          <span className="tabular-nums">{periodLabel(run)}</span>
        </DescriptionItem>

        <DescriptionItem label="Kode">
          <span className="tabular-nums">{run.code}</span>
        </DescriptionItem>

        <DescriptionItem label="Bruto">
          <span className="tabular-nums">{formatAmount(run.totalGross)}</span>
        </DescriptionItem>

        <DescriptionItem label="Potongan">
          <span className="tabular-nums">
            {formatAmount(run.totalDeduction)}
          </span>
        </DescriptionItem>

        <DescriptionItem label="Bersih">
          <span className="font-semibold tabular-nums">
            {formatAmount(run.totalNet)}
          </span>
        </DescriptionItem>

        <DescriptionItem label="Slip gaji">
          <span className="tabular-nums">{run.payslips.length}</span>
        </DescriptionItem>

        {run.approvedAt ? (
          <DescriptionItem label="Disetujui">
            <span className="tabular-nums">
              {formatDateTime(run.approvedAt)}
            </span>
          </DescriptionItem>
        ) : null}

        {run.paidAt ? (
          <DescriptionItem label="Dibayar">
            <span className="tabular-nums">{formatDateTime(run.paidAt)}</span>
          </DescriptionItem>
        ) : null}

        {isJournalShown ? (
          <DescriptionItem label="Entri jurnal">
            {journal ? (
              isCanViewJournal ? (
                <Link
                  href={detailHref(
                    MENU.KEUANGAN,
                    MENU.JURNAL,
                    journal.publicId,
                  )}
                  className={`tabular-nums ${DETAIL_LINK}`}
                >
                  {journal.code}
                </Link>
              ) : (
                <span className="tabular-nums">{journal.code}</span>
              )
            ) : (
              <span className="text-muted-foreground font-normal">
                Belum diposting
              </span>
            )}
          </DescriptionItem>
        ) : null}
      </DescriptionList>

      <div className="border-hairline space-y-1 border-t px-gutter py-3">
        <p className="text-muted-foreground text-caption">{FULL_MONTH_NOTE}</p>
        <p className="text-muted-foreground text-caption">
          {VARIABLE_WAGE_NOTE}
        </p>
      </div>
    </Panel>
  );
};
