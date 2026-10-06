import {
  APPROVAL_STATUS_LABEL,
  type ApprovalStatus,
} from "@/types/persetujuan";

import { Badge, type badgeVariants } from "./badge";

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

/**
 * Empat salinan peta ini ada di repo: `features/persetujuan/\u2026/model.ts`
 * (PENDING \u2192 `wait`) dan tiga `approval-panel.tsx` di Kas Keluar, Program,
 * dan Laporan Budget (PENDING \u2192 `draft`, ketiganya byte-identik).
 * Yang dipakai di sini `wait`, sama dengan komponen khusus yang sudah ada:
 * "Menunggu" memang menunggu, dan `draft` berarti belum diajukan.
 *
 * Ketiga salinan `draft` TIDAK diubah di sini \u2014 mengubahnya menggeser
 * warna di tiga layar yang sudah ter-merge. Lihat catatan tindak lanjut.
 */
const VARIANT: Record<ApprovalStatus, BadgeVariant> = {
  PENDING: "wait",
  APPROVED: "success",
  REJECTED: "due",
  CANCELLED: "neutral",
};

interface PropTypes {
  status: ApprovalStatus;
}

export const ApprovalStatusBadge = (props: PropTypes) => (
  <Badge variant={VARIANT[props.status]}>
    {APPROVAL_STATUS_LABEL[props.status]}
  </Badge>
);
