import Link from "next/link";

import { MediaThumb, OptionalText } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import {
  albumMetaOf,
  GALERI_LIST_PATH,
  galeriDetailHref,
  galeriEditHref,
  websiteCellOf,
} from "../model";
import type { Album } from "../types";
import { AlbumStatus } from "../ui";

const saveFocus = (album: Album) => saveListFocus(GALERI_LIST_PATH, album.code);

const detailHrefOf = (album: Album) => galeriDetailHref(album.code);

const viewLabelOf = (album: Album) => `Lihat album ${album.name}`;

const coverOf = (album: Album) => (
  <MediaThumb
    src={album.listImage[0]?.url ?? null}
    alt={album.listImage[0]?.name ?? album.name}
  />
);

interface PropTypes {
  album: Album;
}

export const GaleriListItemRow = (props: PropTypes) => {
  const { album } = props;

  return (
    <DataListRow
      id={album.code}
      className="hover:bg-card relative transition-colors"
      leading={coverOf(album)}
      title={
        <Link
          href={detailHrefOf(album)}
          onClick={() => saveFocus(album)}
          aria-label={viewLabelOf(album)}
          className={TABLE_ROW_LINK}
        >
          {album.name}
        </Link>
      }
      meta={albumMetaOf(album)}
      trailing={
        <>
          <AlbumStatus isPublish={album.isPublish} />
        </>
      }
    />
  );
};

type Column = DataTableColumn<Album>;

const COLUMNS: Column[] = [
  {
    key: "album",
    header: "Album",
    width: "minmax(0,2.5fr)",
    cell: (album) => (
      <span className="flex min-w-0 items-center gap-3">
        {coverOf(album)}
        <span className="min-w-0">
          <span className="block truncate font-medium" title={album.name}>
            {album.name}
          </span>
          <span className="text-muted-foreground block truncate text-caption tabular-nums">
            {album.code}
          </span>
        </span>
      </span>
    ),
  },
  {
    key: "bapel",
    header: "Badan pelayanan",
    width: "minmax(0,1.5fr)",
    cell: (album) => <OptionalText text={album.bapel.name} empty="—" />,
  },
  {
    key: "photos",
    header: "Foto",
    width: "minmax(0,0.6fr)",
    cell: (album) => (
      <span className="block truncate tabular-nums">
        {album.listImage.length}
      </span>
    ),
  },
  {
    key: "website",
    header: "Di website",
    width: "minmax(0,1fr)",
    isSecondary: true,
    cell: (album) => (
      <OptionalText
        text={websiteCellOf(album)}
        empty="Album draf belum tampil di website"
      />
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1fr)",
    cell: (album) => <AlbumStatus isPublish={album.isPublish} />,
  },
];

const deleteLabelOf = (x: Album) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: Album) => `${x.name}`;

export function galeriTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Album) => void,
): DataTableConfig<Album> {
  return {
    columns: COLUMNS,
    getRowActions: (x) => ({
      label: viewLabelOf(x),
      view: {
        href: detailHrefOf(x),
        onNavigate: () => saveFocus(x),
        label: viewLabelOf(x),
      },
      edit: isCanUpdate
        ? {
            href: galeriEditHref(x.publicId),
            onNavigate: () => saveListFocus(GALERI_LIST_PATH, x.code),
            label: `Ubah ${x.name}`,
          }
        : undefined,
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
