"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

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
  useDeleteRolePelayan,
  useSaveRolePelayan,
  useRolePelayanDetail,
} from "../api";
import {
  EMPTY_ROLE_PELAYAN_FORM,
  ROLE_PELAYAN_LIST_PATH,
  isPemusikRole,
  serverFieldError,
  rolePelayanFormSchema,
  toRolePelayanForm,
  toRolePelayanPayload,
  type RolePelayanFormValues,
} from "../model";

import { RolePelayanSection } from "./role-pelayan-section";

interface PropTypes {
  id?: string;
}

export const RolePelayanFormScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.ROLE_PELAYAN,
  );
  const listReturn = useListReturn(ROLE_PELAYAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveRolePelayan = useSaveRolePelayan(id);
  const deleteRolePelayan = useDeleteRolePelayan(id);
  const detail = useRolePelayanDetail(isCanUpdate ? id : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RolePelayanFormValues>({
    resolver: zodResolver(rolePelayanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_ROLE_PELAYAN_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteRolePelayan.isPending;
  const isLocked = isPemusikRole(detail.data?.name);

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked) return;
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteRolePelayan.reset();
    setRejectedField(null);

    try {
      const saved = await saveRolePelayan.mutateAsync(
        toRolePelayanPayload(values),
      );

      toast.add({ title: saved.message });
      saveListFocus(ROLE_PELAYAN_LIST_PATH, String(saved.data.id));
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteRolePelayan.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toRolePelayanForm(detail.data));
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
    if (deleteRolePelayan.isError) deleteRef.current?.focus();
  }, [deleteRolePelayan.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah role pelayan"
            : "Tidak bisa menambah role pelayan"
        }
        description="Peran Anda hanya bisa melihat data role pelayan."
        isCanView={isCanView}
        backHref={ROLE_PELAYAN_LIST_PATH}
        backLabel="Kembali ke Role Pelayan"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="role pelayan"
        backHref={listReturn}
        backLabel="Kembali ke Role Pelayan"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isLocked ? (
            <Button type="button" variant="outline" onClick={onLeave}>
              Kembali
            </Button>
          ) : (
            <>
              {isEdit && isCanDelete ? (
                <Button
                  ref={deleteRef}
                  type="button"
                  variant="destructive"
                  disabled={isBusy || detail.isLoading}
                  onClick={() => confirm.onOpen("delete")}
                >
                  {deleteRolePelayan.isPending ? "Menghapus…" : "Hapus"}
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
            </>
          )}
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Role Pelayan" : "Tambah Role Pelayan"}
          subtitle={detail.data?.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={1} label="Memuat data role pelayan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <RolePelayanSection
          form={form}
          isDisabled={isBusy}
          isLocked={isLocked}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteRolePelayan.error ? (
          <FormAlert
            title="Role pelayan belum terhapus."
            message={deleteRolePelayan.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="role pelayan"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
