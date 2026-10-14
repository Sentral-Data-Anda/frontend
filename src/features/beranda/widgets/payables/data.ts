"use client";

import { MENU, menuHref, type MenuSlug } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { daysSince } from "@/lib/date";
import { APPROVAL_DOCUMENT_LABEL } from "@/types/persetujuan";

import {
  amountOf,
  useDraftCashExpenses,
  useFailedPayments,
  useOpenPayrolls,
  useUnpaidInvoices,
  useWaitingApprovals,
  type ApprovalItem,
  type CashExpenseItem,
  type PaymentItem,
  type PayrollItem,
  type SupplierInvoiceItem,
} from "../../api";
import { DUMMY_UNPOSTED_OFFERINGS, SHOW_DUMMY } from "../../fixtures";
import { formatDayMonth, toDateKey } from "../../model";

type Tone = "due" | "draft" | "wait" | "neutral";

export type Payable = {
  key: string;
  title: string;
  meta: string;
  kind: string;
  amount: number | null;
  status: { tone: Tone; label: string };
  href: string;
  isOverdue: boolean;
  since: string;
  isPayable: boolean;
  isDummy?: boolean;
};

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const dayKey = (iso: string) => iso.slice(0, 10);

const hrefOf = (group: MenuSlug, leaf: MenuSlug) => menuHref(group, leaf);

export function dueLabel(dueDate: string, today: string): Payable["status"] {
  const due = dayKey(dueDate);
  if (due < today) return { tone: "due", label: "Lewat" };
  if (due === today) return { tone: "due", label: "Hari ini" };
  const days = Math.round(
    (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86_400_000,
  );
  if (days === 1) return { tone: "wait", label: "Besok" };
  return { tone: "wait", label: formatDayMonth(due) };
}

export function buildPayables(
  sources: {
    cashExpenses?: CashExpenseItem[];
    invoices?: SupplierInvoiceItem[];
    approvals?: ApprovalItem[];
    payments?: PaymentItem[];
    payrolls?: PayrollItem[];
    isUnpostedShown?: boolean;
  },
  now: Date,
): Payable[] {
  const today = toDateKey(now);
  const rows: Payable[] = [
    ...(sources.invoices ?? []).map((row): Payable => {
      const status = dueLabel(row.dueDate, today);
      return {
        key: `inv-${row.code}`,
        title: `${row.code} · ${row.supplier.name}`,
        meta: `Faktur supplier · jatuh tempo ${formatDayMonth(row.dueDate)}`,
        kind: "Faktur",
        amount: amountOf(row.totalIDR) - amountOf(row.paidAmountIDR),
        status,
        href: hrefOf(MENU.PROCUREMENT, MENU.SUPPLIER_INVOICE),
        isOverdue: dayKey(row.dueDate) < today,
        since: dayKey(row.dueDate),
        isPayable: true,
      };
    }),
    ...(sources.cashExpenses ?? []).map((row): Payable => ({
      key: `kk-${row.code}`,
      title: `${row.code} · ${row.description}`,
      meta: ["Kas keluar", row.bapel?.name ?? row.payee]
        .filter(Boolean)
        .join(" · "),
      kind: "Kas keluar",
      amount: amountOf(row.totalAmount),
      status: { tone: "draft", label: "Draf" },
      href: hrefOf(MENU.FINANCE, MENU.KAS_KELUAR),
      isOverdue: false,
      since: dayKey(row.expenseDate),
      isPayable: true,
    })),
    ...(sources.payrolls ?? []).map((row): Payable => ({
      key: `pyr-${row.code}`,
      title: `${row.code} · Gaji ${MONTHS[row.month - 1]} ${row.year}`,
      meta: "Penggajian",
      kind: "Payroll",
      amount: amountOf(row.totalNet),
      status:
        row.status === "APPROVED"
          ? { tone: "wait", label: "Disetujui" }
          : row.status === "CALCULATED"
            ? { tone: "draft", label: "Dihitung" }
            : { tone: "draft", label: "Draf" },
      href: hrefOf(MENU.HR, MENU.PAYROLL),
      isOverdue: false,
      since: dayKey(row.createdAt),
      isPayable: true,
    })),
    ...(sources.approvals ?? []).map((row): Payable => ({
      key: `pst-${row.code}`,
      title: `${row.code} · ${APPROVAL_DOCUMENT_LABEL[row.documentType]}`,
      meta: [
        "Persetujuan",
        row.steps.find((step) => step.order === row.currentOrder)?.approverBapel
          ?.name,
        `${daysSince(row.submittedAt, now)} hari`,
      ]
        .filter(Boolean)
        .join(" · "),
      kind: APPROVAL_DOCUMENT_LABEL[row.documentType],
      amount: amountOf(row.amount) || null,
      status: { tone: "wait", label: "Menunggu" },
      href: hrefOf(MENU.APPROVAL, MENU.APPROVAL_REQUEST),
      isOverdue: false,
      since: dayKey(toDateKey(new Date(row.submittedAt))),
      isPayable: false,
    })),
    ...(sources.payments ?? []).map((row): Payable => ({
      key: `pay-${row.code}`,
      title: `${row.code} · ${row.purpose === "PERSEMBAHAN" ? "Persembahan online" : "Pendaftaran kegiatan"}`,
      // Nama pemberi tidak pernah muncul di widget (BA §8): kode dan nominal
      // cukup untuk menindaklanjuti, dan Beranda terlihat lebih luas daripada
      // layar Pembayaran.
      meta: "Pembayaran",
      kind: "Pembayaran",
      amount: amountOf(row.amount),
      status:
        row.status === "FAILED"
          ? { tone: "due", label: "Gagal" }
          : { tone: "neutral", label: "Kedaluwarsa" },
      href: hrefOf(MENU.FINANCE, MENU.PAYMENT),
      isOverdue: false,
      since: dayKey(toDateKey(new Date(row.createdAt))),
      isPayable: false,
    })),
    ...(sources.isUnpostedShown
      ? [
          {
            key: "unposted",
            title: DUMMY_UNPOSTED_OFFERINGS.title,
            meta: `${DUMMY_UNPOSTED_OFFERINGS.count} transaksi belum diposting`,
            kind: "Jurnal",
            amount: null,
            status: { tone: "wait", label: "Buka" },
            href: hrefOf(MENU.FINANCE, MENU.JOURNAL_ENTRY),
            isOverdue: false,
            since: today,
            isPayable: false,
            isDummy: true,
          } satisfies Payable,
        ]
      : []),
  ];

  return rows.sort(
    (a, b) =>
      Number(b.isOverdue) - Number(a.isOverdue) ||
      a.since.localeCompare(b.since),
  );
}

/**
 * Apa yang layar tampilkan ketika sebagian sumbernya gagal.
 *
 * Lima sumber dijadikan satu daftar, dan sebelumnya satu saja yang gagal
 * mengubah seluruh kartu menjadi "Gagal memuat": empat sumber yang baik-baik
 * saja ikut lenyap dari layar, dan tidak ada yang memberi tahu bendahara yang
 * mana yang bermasalah. Sekarang yang berhasil tetap tampil dan yang gagal
 * disebut namanya; kartunya baru menyerah ketika tidak ada satu baris pun yang
 * berhasil dimuat.
 *
 * 404 tidak pernah sampai ke sini: `fetchList` sudah membacanya sebagai daftar
 * kosong, bukan kegagalan.
 */
export function payableState(
  rowCount: number,
  sources: readonly { label: string; error: Error | null }[],
): { failed: string[]; error: Error | null } {
  const broken = sources.filter((source) => source.error !== null);

  return {
    failed: broken.map((source) => source.label),
    error: rowCount > 0 ? null : (broken[0]?.error ?? null),
  };
}

export function usePayables() {
  const cash = useMenuAccess(MENU.KAS_KELUAR).isCanView;
  const invoice = useMenuAccess(MENU.SUPPLIER_INVOICE).isCanView;
  const approval = useMenuAccess(MENU.APPROVAL_REQUEST).isCanView;
  const payment = useMenuAccess(MENU.PAYMENT).isCanView;
  const payroll = useMenuAccess(MENU.PAYROLL).isCanView;
  const journal = useMenuAccess(MENU.JOURNAL_ENTRY).isCanView;

  const cashQ = useDraftCashExpenses(cash);
  const invoiceQ = useUnpaidInvoices(invoice);
  const approvalQ = useWaitingApprovals(approval);
  const paymentQ = useFailedPayments(payment);
  const payrollQ = useOpenPayrolls(payroll);

  const active = [
    ["Kas keluar", cash, cashQ],
    ["Faktur supplier", invoice, invoiceQ],
    ["Persetujuan", approval, approvalQ],
    ["Pembayaran", payment, paymentQ],
    ["Payroll", payroll, payrollQ],
  ] as const;
  const live = active.filter(([, isOn]) => isOn);
  const queries = live.map(([, , query]) => query);

  const rows = buildPayables(
    {
      cashExpenses: cash ? cashQ.data?.data : undefined,
      invoices: invoice ? invoiceQ.data : undefined,
      approvals: approval ? approvalQ.data?.data : undefined,
      payments: payment ? paymentQ.data : undefined,
      payrolls: payroll ? payrollQ.data : undefined,
      isUnpostedShown: SHOW_DUMMY && journal,
    },
    new Date(),
  );

  const { failed, error } = payableState(
    rows.length,
    live.map(([label, , query]) => ({ label, error: query.error })),
  );

  return {
    rows,
    failed,
    error,
    isPending: queries.some((query) => query.isPending),
    isFetching: queries.some((query) => query.isFetching),
    refetch: () => queries.forEach((query) => void query.refetch()),
  };
}
