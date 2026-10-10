"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  FormNotFound,
  LoadingForm,
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";
import { normalizeName } from "@/lib/name";

import { useDeletePelayan, usePelayanDetail, useSavePelayan } from "../api";
import {
  DAFTAR_PELAYAN_LIST_PATH,
  EMPTY_PELAYAN_FORM,
  futureSlotLines,
  futureSlotsTitle,
  nameOfDetail,
  pelayanFormSchema,
  serverFieldError,
  toPelayanForm,
  toPelayanPayload,
  withFieldMessages,
  type PelayanFormValues,
} from "../model";
import type { FutureSlot } from "../types";

import { AnggotaSection } from "./anggota-section";
import { IdentitySection } from "./identity-section";
import { TugasSection } from "./tugas-section";

interface PropTypes {
  code?: string;
}

export const DaftarPelayanFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.DAFTAR_PELAYAN,
  );
  const listReturn = useListReturn(DAFTAR_PELAYAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const savePelayan = useSavePelayan(code);
  const deletePelayan = useDeletePelayan(code);
  const detail = usePelayanDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<PelayanFormValues>({
    resolver: zodResolver(pelayanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_PELAYAN_FORM,
  });

  const typePelayan = useWatch({ control: form.control, name: "typePelayan" });
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deletePelayan.isPending;
  const title = nameOfDetail(detail.data);

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onToastSaved = (
    message: string,
    values: PelayanFormValues,
    slots: FutureSlot[],
  ) => {
    if (slots.length === 0) {
      toast.add({ title: message });
      return;
    }

    const name =
      values.typePelayan === "GROUP" ? normalizeName(values.name) : title;

    toast.add({
      type: "warning",
      timeout: 0,
      priority: "high",
      title: futureSlotsTitle(name, slots),
      description: futureSlotLines(slots).map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      )),
    });
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deletePelayan.reset();
    setRejectedField(null);

    try {
      const saved = await savePelayan.mutateAsync(toPelayanPayload(values));

      onToastSaved(saved.message, values, saved.futureSlots ?? []);
      saveListFocus(DAFTAR_PELAYAN_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(
          withFieldMessages(error, isEdit),
          form.setError,
          (message) => serverFieldError(message, isEdit),
        ),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deletePelayan.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toPelayanForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  useEffect(() => {
    if (deletePelayan.isError) deleteRef.current?.focus();
  }, [deletePelayan.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah pelayan" : "Tidak bisa menambah pelayan"
        }
        description="Peran Anda hanya bisa melihat data pelayan."
        isCanView={isCanView}
        backHref={DAFTAR_PELAYAN_LIST_PATH}
        backLabel="Kembali ke Daftar Pelayan"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="pelayan"
        backHref={listReturn}
        backLabel="Kembali ke Daftar Pelayan"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isEdit && isCanDelete ? (
            <Button
              ref={deleteRef}
              type="button"
              variant="destructive"
              disabled={isBusy || detail.isLoading}
              onClick={() => confirm.onOpen("delete")}
              isLoading={deletePelayan.isPending}
            >
              {deletePelayan.isPending ? "Menghapus…" : "Hapus"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
          >
            Batal
          </Button>

          <Button
            ref={saveRef}
            type="submit"
            disabled={isBusy || detail.isLoading}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Pelayan" : "Tambah Pelayan"}
          subtitle={title || code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={6} label="Memuat data pelayan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <IdentitySection form={form} isDisabled={isBusy} saved={detail.data} />

        <TugasSection form={form} isDisabled={isBusy} />

        {typePelayan === "GROUP" ? (
          <AnggotaSection form={form} isDisabled={isBusy} />
        ) : null}
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deletePelayan.error ? (
          <FormAlert
            title="Pelayan belum terhapus."
            message={deletePelayan.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="pelayan"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
