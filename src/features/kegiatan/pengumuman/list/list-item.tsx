import { Pin } from "lucide-react";

import { Badge, OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { ANNOUNCEMENT_STATUS_LABEL, categoryLabelOf } from "@/lib/announcement";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  PENGUMUMAN_LIST_PATH,
  STATUS_BADGE,
  isOnWebsite,
  periodOf,
} from "../model";
import type { Announcement } from "../types";

const editHrefOf = (announcement: Announcement) =>
  editHref(MENU.KEGIATAN, MENU.PENGUMUMAN, announcement.publicId);

const saveFocus = (announcement: Announcement) =>
  saveListFocus(PENGUMUMAN_LIST_PATH, announcement.code);

const labelOf = (announcement: Announcement) => `Ubah ${announcement.title}`;

const statusOf = (announcement: Announcement) => (
  <Badge variant={STATUS_BADGE[announcement.status]}>
    {ANNOUNCEMENT_STATUS_LABEL[announcement.status]}
  </Badge>
);

const titleOf = (announcement: Announcement) =>
  announcement.isPinned ? (
    <>
      <Pin
        aria-hidden
        className="text-primary mr-1 inline size-3.5 -translate-y-px"
      />
      <span className="sr-only">Disematkan: </span>
      {announcement.title}
    </>
  ) : (
    announcement.title
  );

interface PropTypes {
  announcement: Announcement;
}

export const PengumumanListItemRow = (props: PropTypes) => {
  const { announcement } = props;

  return (
    <DataListRow
      id={announcement.code}
      title={titleOf(announcement)}
      meta={`${categoryLabelOf(announcement.category)} · ${periodOf(announcement)}`}
      trailing={<>{statusOf(announcement)}</>}
    />
  );
};

const deleteLabelOf = (x: Announcement) => `Hapus ${x.title}`;

export const deleteTargetLabelOf = (x: Announcement) => `${x.title}`;

export function pengumumanTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Announcement) => void,
): DataTableConfig<Announcement> {
  return {
    columns: [
      {
        key: "title",
        header: "Judul",
        width: "minmax(0,3fr)",
        narrowWidth: "minmax(0,2.4fr)",
        cell: (announcement) => (
          <span
            className="block truncate font-medium"
            title={announcement.title}
          >
            {titleOf(announcement)}
          </span>
        ),
      },
      {
        key: "category",
        header: "Kategori",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (announcement) => (
          <span className="block truncate">
            {categoryLabelOf(announcement.category)}
          </span>
        ),
      },
      {
        key: "publishDate",
        header: "Terbit",
        width: "minmax(0,1.1fr)",
        narrowWidth: "minmax(0,1.1fr)",
        cell: (announcement) => (
          <span className="block truncate tabular-nums">
            {formatDateShort(announcement.publishDate)}
          </span>
        ),
      },
      {
        key: "expiryDate",
        header: "Berakhir",
        width: "minmax(0,1.1fr)",
        isSecondary: true,
        cell: (announcement) => (
          <OptionalText
            text={
              announcement.expiryDate
                ? formatDateShort(announcement.expiryDate)
                : null
            }
            empty="Tanpa tanggal berakhir"
          />
        ),
      },
      {
        key: "bapel",
        header: "Untuk",
        width: "minmax(0,1.3fr)",
        isSecondary: true,
        cell: (announcement) => (
          <span
            className="text-muted-foreground block truncate"
            title={announcement.bapel?.name ?? "Seluruh jemaat"}
          >
            {announcement.bapel?.name ?? "Seluruh jemaat"}
          </span>
        ),
      },
      {
        key: "website",
        header: "Website",
        width: "minmax(0,0.8fr)",
        isSecondary: true,
        cell: (announcement) => (
          <span className="text-muted-foreground block truncate">
            {isOnWebsite(announcement) ? "Ya" : "Tidak"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: statusOf,
      },
    ],
    getRowActions: (x) => ({
      label: labelOf(x),
      edit: {
        href: isCanUpdate ? editHrefOf(x) : undefined,
        onNavigate: () => saveFocus(x),
        label: labelOf(x),
      },
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
