"use client";

import Link from "next/link";

import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  APPROVED_EXPENSE_PATH,
  LINK_CLASS,
  POSTING_PERSEMBAHAN_PATH,
  draftJournalHref,
} from "../model";
import type { FiscalPeriodDetail } from "../types";

type Check = {
  key: string;
  text: string;
  linkText: string;
  href: string | null;
  isBlocking: boolean;
};

interface PropTypes {
  period: FiscalPeriodDetail;
}

export const CloseChecklist = (props: PropTypes) => {
  const { period } = props;

  const journal = useMenuAccess(MENU.JURNAL);
  const expense = useMenuAccess(MENU.KAS_KELUAR);
  const checks: Check[] = [];

  if (period.draftCount > 0) {
    checks.push({
      key: "draft",
      text: `${formatNumber(period.draftCount)} entri jurnal bulan ini masih draf. Posting atau hapus dulu; server menolak menutup bulan yang masih punya draf.`,
      linkText: "Lihat draf jurnal",
      href: journal.isCanView ? draftJournalHref(period) : null,
      isBlocking: true,
    });
  }

  if (period.unpostedPersembahanCount) {
    checks.push({
      key: "persembahan",
      text: `${formatNumber(period.unpostedPersembahanCount)} persembahan bulan ini belum diposting ke jurnal. Tidak menghalangi penutupan.`,
      linkText: "Posting persembahan",
      href: journal.isCanCreate ? POSTING_PERSEMBAHAN_PATH : null,
      isBlocking: false,
    });
  }

  if (period.unpaidApprovedExpenseCount) {
    checks.push({
      key: "expense",
      text: `${formatNumber(period.unpaidApprovedExpenseCount)} kas keluar sudah disetujui tapi belum dibayar. Tidak menghalangi penutupan.`,
      linkText: "Lihat kas keluar",
      href: expense.isCanView ? APPROVED_EXPENSE_PATH : null,
      isBlocking: false,
    });
  }

  if (checks.length === 0) return null;

  return (
    <section aria-label="Periksa sebelum tutup buku" className="space-y-2">
      <h2 className="text-body font-medium">Periksa dulu sebelum menutup</h2>

      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.key}
            className={cn(
              "rounded-control border p-3",
              check.isBlocking
                ? "border-warning bg-warning/10"
                : "border-border bg-card",
            )}
          >
            <p className="text-body">{check.text}</p>

            {check.href ? (
              <Link
                href={check.href}
                className={cn(
                  LINK_CLASS,
                  "inline-flex min-h-9 items-center text-body",
                )}
              >
                {check.linkText}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
