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

import { useAccountDetail, useDeleteAccount, useSaveAccount } from "../api";
import {
  AKUN_LIST_PATH,
  EMPTY_ACCOUNT_FORM,
  NO_VIEW,
  accountDeleteText,
  accountDetailHref,
  accountFormSchema,
  accountServerError,
  isDeactivateOffered,
  toAccountForm,
  toAccountPayload,
  type AccountFormValues,
} from "../model";

import { AccountSection } from "./account-section";

interface PropTypes {
  code?: string;
}

export const AccountFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.AKUN,
  );
  const listReturn = useListReturn(AKUN_LIST_PATH);
  const leaveHref = code ? accountDetailHref(code) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveAccount = useSaveAccount(code);
  const deleteAccount = useDeleteAccount(code);
  const detail = useAccountDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_ACCOUNT_FORM,
  });

  const status = useWatch({ control: form.control, name: "isActive" });
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteAccount.isPending;
  const isHidden = isEdit && !detail.data;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const deleteError = deleteAccount.error;

  const onLeave = () => router.replace(leaveHref);

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
    deleteAccount.reset();
    setRejectedField(null);

    try {
      const saved = await saveAccount.mutateAsync(toAccountPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(AKUN_LIST_PATH, saved.data.code);
      router.replace(accountDetailHref(saved.data.code));
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, accountServerError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteAccount.mutate(undefined, {
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

  const onRetryDetail = () => void detail.refetch();

  useEffect(() => {
    if (!detail.data) return;

    form.reset(toAccountForm(detail.data), { keepDirtyValues: true });
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
    if (deleteAccount.isError) deleteRef.current?.focus();
  }, [deleteAccount.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={isEdit ? "Tidak bisa mengubah akun" : "Tidak bisa menambah akun"}
        description={
          isCanView ? "Peran Anda hanya bisa melihat daftar akun." : NO_VIEW
        }
        backHref={leaveHref}
        backLabel="Kembali ke Akun"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="akun"
        backHref={listReturn}
        backLabel="Kembali ke Akun"
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
              disabled={isLocked}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteAccount.isPending ? "Menghapus…" : "Hapus"}
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

          <Button ref={saveRef} type="submit" disabled={isLocked}>
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Akun" : "Tambah Akun"}
          subtitle={
            detail.data ? `${detail.data.code} — ${detail.data.name}` : code
          }
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.error && !isNotFound && !detail.data ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Data akun gagal dimuat."
            message="Form belum bisa diisi sampai datanya termuat."
          />

          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={onRetryDetail}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      {detail.isLoading ? (
        <LoadingForm fields={5} label="Memuat data akun…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <AccountSection
          form={form}
          isDisabled={isBusy}
          isEdit={isEdit}
          isTypeLocked={detail.data?.hasJournalLines === true}
        />
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
              title="Akun belum terhapus."
              message={deleteError.message}
            />

            {isDeactivateOffered(deleteError) && status === "true" ? (
              <Button type="button" variant="outline" onClick={onDeactivate}>
                Nonaktifkan
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="akun"
        descriptions={
          detail.data ? { delete: accountDeleteText(detail.data) } : undefined
        }
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
