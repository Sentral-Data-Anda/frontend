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

import {
  useDeleteOfferingType,
  useOfferingTypeDetail,
  useSaveOfferingType,
} from "../api";
import {
  EMPTY_OFFERING_TYPE_FORM,
  NO_VIEW,
  TIPE_PERSEMBAHAN_LIST_PATH,
  offeringTypeDeleteText,
  offeringTypeFormSchema,
  serverFieldError,
  toOfferingTypeForm,
  toOfferingTypePayload,
  type OfferingTypeFormValues,
} from "../model";

import { TypeSection } from "./type-section";

interface PropTypes {
  code?: string;
}

export const OfferingTypeFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.TIPE_PERSEMBAHAN,
  );
  const listReturn = useListReturn(TIPE_PERSEMBAHAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveOfferingType = useSaveOfferingType(code);
  const deleteOfferingType = useDeleteOfferingType(code);
  const detail = useOfferingTypeDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<OfferingTypeFormValues>({
    resolver: zodResolver(offeringTypeFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_OFFERING_TYPE_FORM,
  });

  const status = useWatch({ control: form.control, name: "isActive" });
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteOfferingType.isPending;
  const isHidden = isEdit && !detail.data;
  const deleteError = deleteOfferingType.error;
  const isInUse =
    deleteError instanceof FetchError && deleteError.status === 400;

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

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteOfferingType.reset();
    setRejectedField(null);

    try {
      const saved = await saveOfferingType.mutateAsync(
        toOfferingTypePayload(values),
      );

      toast.add({ title: saved.message });
      saveListFocus(TIPE_PERSEMBAHAN_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteOfferingType.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onDeactivate = () => {
    form.setValue("isActive", "false", { shouldDirty: true });
    revealField("isActive");
    // Fieldset tidak bisa difokus, dan tombol ini hilang sesudah diklik.
    document
      .querySelector<HTMLInputElement>('input[name="isActive"][value="false"]')
      ?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!detail.data) return;

    form.reset(toOfferingTypeForm(detail.data), { keepDirtyValues: true });
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
    if (deleteOfferingType.isError) deleteRef.current?.focus();
  }, [deleteOfferingType.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah tipe persembahan"
            : "Tidak bisa menambah tipe persembahan"
        }
        description={
          isCanView
            ? "Peran Anda hanya bisa melihat tipe persembahan."
            : NO_VIEW
        }
        backHref={listReturn}
        backLabel="Kembali ke Tipe Persembahan"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="tipe persembahan"
        backHref={listReturn}
        backLabel="Kembali ke Tipe Persembahan"
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
              disabled={isBusy || isHidden}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteOfferingType.isPending ? "Menghapus…" : "Hapus"}
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
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Tipe Persembahan" : "Tambah Tipe Persembahan"}
          subtitle={detail.data?.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={5} label="Memuat data tipe persembahan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <TypeSection form={form} isDisabled={isBusy} isEdit={isEdit} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteError ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              title="Tipe persembahan belum terhapus."
              message={deleteError.message}
            />
            {isInUse && status === "true" ? (
              <Button type="button" variant="outline" onClick={onDeactivate}>
                Nonaktifkan
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="tipe persembahan"
        descriptions={{ delete: offeringTypeDeleteText }}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
