"use client";

import Link from "next/link";
import { useFieldArray, useFormState } from "react-hook-form";

import { Button, buttonVariants } from "@/components/common/control";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  FormSection,
  FormWide,
  LineItemList,
  NoFormAccess,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import {
  EMPTY_ITEM,
  MAX_ITEMS,
  PERSEMBAHAN_LIST_PATH,
  TIPE_PERSEMBAHAN_PATH,
  itemsSummary,
} from "../model";
import type { OfferingTypeOption } from "../types";
import { FixLink } from "../ui";
import { usePersembahanForm } from "../use-persembahan-form";

import { CountCheck } from "./count-check";
import { HeaderSection } from "./header-section";
import { KolekteRow } from "./kolekte-row";

export const KolekteScreen = () => {
  const { isCanView, isCanCreate } = useMenuAccess(MENU.PERSEMBAHAN);
  const typeAccess = useMenuAccess(MENU.TIPE_PERSEMBAHAN);
  const {
    form,
    confirm,
    isDirty,
    isSubmitting,
    saveRef,
    failure,
    rootError,
    onConfirm,
    onSave,
    onLeave,
  } = usePersembahanForm();
  const rows = useFieldArray({ control: form.control, name: "items" });
  const { errors } = useFormState({ control: form.control, name: "items" });
  const types = useDdlOptions<OfferingTypeOption>("tipe-persembahan");
  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const isFull = rows.fields.length >= MAX_ITEMS;

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa mencatat kolekte"
        description="Peran Anda hanya bisa melihat persembahan."
        isCanView={isCanView}
        backHref={PERSEMBAHAN_LIST_PATH}
        backLabel="Kembali ke Persembahan"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
          >
            Batal
          </Button>

          <Button ref={saveRef} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan kolekte"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Catat Kolekte"
          subtitle="Satu tanggal, satu cara terima, satu baris per amplop"
          backHref={PERSEMBAHAN_LIST_PATH}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <HeaderSection form={form} isDisabled={isSubmitting} />

      <FormSection
        legend="Amplop"
        note={`Satu baris per amplop, maksimal ${MAX_ITEMS} baris. Seluruh baris disimpan sekali.`}
        disabled={isSubmitting}
      >
        <FormWide className="space-y-3">
          <LineItemList
            label="Baris kolekte"
            count={rows.fields.length}
            addLabel="Tambah baris"
            isAddDisabled={isSubmitting || isFull}
            onAdd={() => rows.append({ ...EMPTY_ITEM })}
            empty="Belum ada baris. Tambahkan satu baris per amplop."
            summary={itemsSummary(form.watch("items"))}
            error={itemsError}
            errorId="items-error"
          >
            {rows.fields.map((row, index) => (
              <KolekteRow
                key={row.id}
                form={form}
                index={index}
                types={types.rows}
                typeOptions={types.options}
                isLoadingTypes={types.isLoading}
                isDisabled={isSubmitting}
                onRemove={rows.fields.length > 1 ? rows.remove : undefined}
              />
            ))}
          </LineItemList>

          {isFull ? (
            <p role="status" className="text-muted-foreground text-body">
              Batas {MAX_ITEMS} baris tercapai. Simpan kolekte ini, lalu catat
              sisanya sebagai kolekte berikutnya.
            </p>
          ) : null}

          {types.options.length === 0 && !types.isLoading ? (
            <p className="text-muted-foreground text-body">
              Belum ada tipe persembahan, jadi belum ada yang bisa dicatat.{" "}
              {typeAccess.isCanCreate ? (
                <Link
                  href={TIPE_PERSEMBAHAN_PATH}
                  className={buttonVariants({ variant: "link" })}
                >
                  Buat tipe persembahan dulu
                </Link>
              ) : null}
            </p>
          ) : null}
        </FormWide>
      </FormSection>

      <CountCheck form={form} isDisabled={isSubmitting} />

      <div className="space-y-2 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Tidak ada baris yang tersimpan. Perbaiki lalu simpan lagi."
            message={rootError}
          />
        ) : null}
        <FixLink error={failure} />
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="kolekte"
        descriptions={{
          save: `Apakah Anda ingin menyimpan ${rows.fields.length} baris kolekte ini? Persembahan yang tersimpan tidak bisa diubah, hanya dibatalkan.`,
        }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
