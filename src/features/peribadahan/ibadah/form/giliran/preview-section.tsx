"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { FormSection, FormWide } from "@/components/common/form";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useIsTableWidth } from "@/hooks/use-media";
import { endOfYearIso } from "@/lib/date";

import type { PreviewRow as Row, RowError, RowWarning } from "./model";
import { PreviewRow } from "./preview-row";

const GRID = "grid grid-cols-[2.25rem_10.5rem_minmax(0,1fr)] gap-x-3";

interface PropTypes {
  rows: readonly Row[] | null;
  warnings: readonly RowWarning[];
  errors: ReadonlyMap<number, RowError>;
  typeIbadahId: string;
  zoneChurchId: string;
  isEmpty: boolean;
  isDisabled: boolean;
  onChange: (index: number, patch: Partial<Row>) => void;
}

export const PreviewSection = (props: PropTypes) => {
  const {
    rows,
    warnings,
    errors,
    typeIbadahId,
    zoneChurchId,
    isEmpty,
    isDisabled,
    onChange,
  } = props;

  const isTable = useIsTableWidth() === true;
  const keluarga = useMenuAccess(MENU.KELUARGA);
  const dateMax = endOfYearIso(6);
  const ticked = rows?.filter((row) => row.isTicked).length ?? 0;
  const skipped = (rows?.length ?? 0) - ticked;

  const items = rows?.map((row, index) => (
    <PreviewRow
      key={index}
      index={index}
      row={row}
      isExisting={warnings[index].isExisting}
      hostWarning={warnings[index].hostWarning}
      dateError={warnings[index].dateError}
      error={errors.get(index)}
      typeIbadahId={typeIbadahId}
      zoneChurchId={zoneChurchId}
      dateMax={dateMax}
      isTable={isTable}
      isDisabled={isDisabled}
      onChange={onChange}
    />
  ));

  if (!rows && !isEmpty) return null;

  return (
    <FormSection
      legend="Pratinjau"
      note="Ganti tuan rumah atau tanggal, atau hapus centang untuk melewati. Alamat bisa diubah per ibadah sesudah disimpan."
      disabled={isDisabled}
    >
      <FormWide>
        {isEmpty ? (
          <EmptyState
            title="Belum ada keluarga di wilayah ini yang bisa menjadi tuan rumah"
            description={
              keluarga.isCanView
                ? "Tuan rumah diambil dari keluarga di wilayah ini yang beribadah di sini dan punya anggota aktif."
                : "Tuan rumah diambil dari keluarga di wilayah ini yang beribadah di sini dan punya anggota aktif. Minta pengurus Kejemaatan melengkapi data keluarga."
            }
            action={
              keluarga.isCanView ? (
                <Link
                  href={menuHref(MENU.KEJEMAATAN, MENU.KELUARGA)}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Buka Keluarga
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            <p
              aria-live="polite"
              className="mb-3 text-body font-medium tabular-nums"
            >
              {`${ticked} ibadah akan dibuat · ${skipped} dilewati`}
            </p>

            {isTable ? (
              <div className="border-border bg-card rounded-control border">
                <div
                  aria-hidden
                  className={`${GRID} text-muted-foreground px-3 py-2 text-caption font-medium`}
                >
                  <span className="text-center">Buat</span>
                  <span>Tanggal</span>
                  <span>Tuan rumah</span>
                </div>
                <ol className={GRID}>{items}</ol>
              </div>
            ) : (
              <ol className="space-y-2">{items}</ol>
            )}
          </>
        )}
      </FormWide>
    </FormSection>
  );
};
