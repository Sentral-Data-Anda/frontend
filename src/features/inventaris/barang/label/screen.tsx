"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { Button, buttonVariants } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import {
  FormActions,
  FormLayout,
  FormSection,
  FormWide,
  LoadingForm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";

import { BARANG_LIST_PATH } from "../model";

import { useLabelAssets } from "./api";
import { LabelSheet } from "./label-sheet";
import { LABEL_LIMIT, labelSourceOf, sheetsOf } from "./model";
import { LabelPicker } from "./picker";

const TITLE = "Cetak label";

interface PropTypes {
  siteUrl: string;
}

export const BarangLabelScreen = (props: PropTypes) => {
  const { siteUrl } = props;

  const { isCanView } = useMenuAccess(MENU.BARANG);
  const searchParams = useSearchParams();
  const listReturn = useListReturn(BARANG_LIST_PATH);
  const source = useMemo(() => labelSourceOf(searchParams), [searchParams]);
  const labels = useLabelAssets(source, isCanView);
  const [excluded, setExcluded] = useState<string[]>([]);
  const assets = labels.data?.items ?? [];
  const picked = assets.filter((asset) => !excluded.includes(asset.code));
  const sheets = sheetsOf(picked);
  const missing = labels.data?.missing ?? [];
  const isTruncated = (labels.data?.total ?? 0) > assets.length;

  const onPick = (codes: string[]) =>
    setExcluded(
      assets.map((asset) => asset.code).filter((code) => !codes.includes(code)),
    );

  const onPrint = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.print();
  };

  if (!isCanView || !labels.data || assets.length === 0) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {!isCanView ? (
          <EmptyState
            title="Anda tidak memiliki akses ke Barang"
            description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
          />
        ) : labels.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat barang"
              description={labels.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={labels.isFetching}
                  onClick={() => void labels.refetch()}
                >
                  {labels.isFetching ? "Memuat…" : "Coba lagi"}
                </Button>
              }
            />
          </div>
        ) : labels.data ? (
          <EmptyState
            title="Tidak ada barang untuk dicetak"
            description={
              source.kind === "filter"
                ? "Tidak ada barang yang cocok dengan filter ini."
                : missing.length > 0
                  ? `Kode barang tidak ditemukan: ${missing.join(", ")}.`
                  : "Pilih barang dari daftar Barang."
            }
            action={
              <Link
                href={listReturn}
                className={buttonVariants({ variant: "outline" })}
              >
                Kembali ke Barang
              </Link>
            }
          />
        ) : (
          <LoadingForm fields={4} label="Memuat barang…" />
        )}
      </div>
    );
  }

  return (
    <FormLayout
      onSubmit={onPrint}
      className="print:*:max-w-none!"
      header={
        <PageHeader
          title={TITLE}
          subtitle={`${picked.length} dipilih`}
          backHref={listReturn}
          isBackPersistent
        />
      }
      actions={
        <FormActions
          status={
            picked.length === 0
              ? "Pilih minimal satu barang"
              : `${picked.length} label di ${sheets.length} lembar A4`
          }
        >
          <Button type="submit" disabled={picked.length === 0}>
            Cetak {picked.length} label
          </Button>
        </FormActions>
      }
    >
      <div className="print:hidden">
        <FormSection
          legend="Pilih barang"
          note="Centang barang yang labelnya ingin dicetak."
        >
          <FormWide>
            <LabelPicker
              assets={assets}
              value={picked.map((asset) => asset.code)}
              onValueChange={onPick}
              hint={
                missing.length > 0
                  ? `Kode tidak ditemukan: ${missing.join(", ")}`
                  : isTruncated
                    ? `Hanya ${LABEL_LIMIT} barang pertama. Persempit filter.`
                    : undefined
              }
            />
          </FormWide>
        </FormSection>
      </div>

      <section
        aria-labelledby="label-preview"
        className="space-y-4 px-gutter pb-8 print:space-y-0 print:p-0"
      >
        <h2
          id="label-preview"
          className="text-title font-semibold print:hidden"
        >
          Pratinjau
        </h2>
        {sheets.length === 0 ? (
          <EmptyState title="Belum ada label yang dipilih" isCompact />
        ) : (
          sheets.map((sheet, index) => (
            <LabelSheet
              key={index}
              assets={sheet}
              siteUrl={siteUrl}
              caption={`Lembar ${index + 1} dari ${sheets.length}`}
            />
          ))
        )}
      </section>
    </FormLayout>
  );
};
