"use client";

import { Button } from "@/components/common/control";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  NoFormAccess,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { PERSEMBAHAN_LIST_PATH } from "../model";
import { FixLink } from "../ui";
import { usePersembahanForm } from "../use-persembahan-form";

import { HeaderSection } from "./header-section";
import { OfferingSection } from "./offering-section";

export const PersembahanFormScreen = () => {
  const { isCanView, isCanCreate } = useMenuAccess(MENU.PERSEMBAHAN);
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

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa mencatat persembahan"
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
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Catat Satu Persembahan"
          subtitle="Untuk transfer susulan dan koreksi"
          backHref={PERSEMBAHAN_LIST_PATH}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <HeaderSection form={form} isDisabled={isSubmitting} />

      <OfferingSection form={form} isDisabled={isSubmitting} />

      <div className="space-y-2 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Persembahan belum tersimpan. Perbaiki lalu simpan lagi."
            message={rootError}
          />
        ) : null}
        <FixLink error={failure} />
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="persembahan"
        descriptions={{
          save: "Apakah Anda ingin menyimpan persembahan ini? Persembahan yang tersimpan tidak bisa diubah, hanya dibatalkan. Banyak amplop sekaligus lebih cepat dicatat lewat Catat Kolekte.",
        }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
