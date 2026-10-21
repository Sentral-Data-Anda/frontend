"use client";

import { ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { createContext, useContext } from "react";

import { buttonVariants } from "@/components/common/control";
import { BottomSheet } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

export type RowAction = {
  href?: string;
  onSelect?: () => void;
  onNavigate?: () => void;
  // Dipakai apa adanya; bila kosong dirangkai dari kata kerja + RowActions.label.
  label?: string;
};

export type RowActions = {
  label: string;
  view?: RowAction;
  edit?: RowAction;
  remove?: RowAction;
};

const ICON_SIZE = "[&_svg]:size-4";

// Aksi baris yang sedang dirender, dari DataList ke DataListRow di layar sempit.
const RowActionsContext = createContext<RowActions | undefined>(undefined);

export const RowActionsProvider = RowActionsContext.Provider;

export const useRowActions = () => useContext(RowActionsContext);

interface PropTypes {
  actions: RowActions;
}

// Baris sengaja bukan tautan: satu-satunya jalan masuk ke form adalah tombol ini.
export const DataRowActions = (props: PropTypes) => {
  const { actions } = props;
  const { label, view, edit, remove } = actions;
  const isSheetOpen = useBoolean();

  if (!view && !edit && !remove) return null;

  const renderButton = (
    action: RowAction | undefined,
    Icon: typeof Pencil,
    verb: string,
    className: string,
    text?: string,
  ) => {
    if (!action) return null;

    const content = (
      <>
        <Icon aria-hidden />
        {text}
      </>
    );
    const ariaLabel = action.label ?? `${verb} ${label}`;

    if (action.href) {
      return (
        <Link
          href={action.href}
          onClick={() => action.onNavigate?.()}
          aria-label={ariaLabel}
          className={className}
        >
          {content}
        </Link>
      );
    }

    if (action.onSelect) {
      return (
        <button
          type="button"
          onClick={action.onSelect}
          aria-label={ariaLabel}
          className={className}
        >
          {content}
        </button>
      );
    }

    return null;
  };

  const iconClass = cn(
    buttonVariants({ variant: "ghost", size: "icon-sm" }),
    "cursor-pointer",
    ICON_SIZE,
  );
  const sheetClass = cn(
    buttonVariants({ variant: "ghost" }),
    "cursor-pointer justify-start gap-3",
    ICON_SIZE,
  );

  // Label warisan berbentuk "Ubah X" tidak boleh jadi judul sheet.
  const sheetTitle = label.replace(/^(Ubah|Lihat|Hapus)\s+/i, "");

  return (
    <>
      <span className="hidden items-center gap-0.5 @min-[52rem]:flex">
        {renderButton(view, ChevronRight, "Lihat", iconClass)}
        {renderButton(edit, Pencil, "Ubah", iconClass)}
        {renderButton(
          remove,
          Trash2,
          "Hapus",
          cn(iconClass, "text-muted-foreground hover:text-destructive"),
        )}
      </span>

      <button
        type="button"
        onClick={isSheetOpen.onTrue}
        aria-label={`Tindakan untuk ${label}`}
        className={cn(iconClass, "@min-[52rem]:hidden")}
      >
        <MoreVertical aria-hidden />
      </button>

      {/* <dialog> menyimpan isinya di DOM saat tertutup, jadi dirender hanya saat terbuka. */}
      {isSheetOpen.value ? (
        <BottomSheet
          isOpen
          title={sheetTitle}
          subtitle="Pilih tindakan"
          onClose={isSheetOpen.onFalse}
        >
          <div className="flex flex-col gap-1 pb-2">
            {renderButton(
              view,
              ChevronRight,
              "Lihat",
              sheetClass,
              "Lihat detail",
            )}
            {renderButton(edit, Pencil, "Ubah", sheetClass, "Ubah")}
            {remove?.onSelect ? (
              <button
                type="button"
                onClick={() => {
                  isSheetOpen.onFalse();
                  remove.onSelect?.();
                }}
                aria-label={`Hapus ${label}`}
                className={cn(sheetClass, "text-destructive")}
              >
                <Trash2 aria-hidden />
                Hapus
              </button>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
};
