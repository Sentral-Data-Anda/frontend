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
  useFormConfirm,
  NoFormAccess,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import {
  useAddKeluargaMember,
  useDeleteKeluarga,
  useKeluargaDetail,
  useEndKeluargaMember,
  useKeluargaMembers,
  useSaveKeluarga,
} from "../api";
import {
  EMPTY_KELUARGA_FORM,
  KELUARGA_LIST_PATH,
  keluargaCreateFormSchema,
  householdLabel,
  keluargaFormSchema,
  serverFieldError,
  toKeluargaForm,
  toKeluargaPayload,
  type KeluargaFormValues,
} from "../model";
import type { KeluargaMember } from "../types";

import { EndMembershipDialog } from "./end-membership-dialog";
import { KeluargaSection } from "./keluarga-section";
import { MemberSection } from "./member-section";

interface PropTypes {
  code?: string;
}

export const KeluargaFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.KELUARGA,
  );
  const listReturn = useListReturn(KELUARGA_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveKeluarga = useSaveKeluarga(code);
  const deleteKeluarga = useDeleteKeluarga(code);
  const addMember = useAddKeluargaMember(code);
  const members = useKeluargaMembers(code);
  const endMember = useEndKeluargaMember(code);
  const [endingMember, setEndingMember] = useState<KeluargaMember | null>(null);
  const liveMembers = (members.data ?? []).filter((row) => !row.endedAt);
  const detail = useKeluargaDetail(code);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<KeluargaFormValues>({
    resolver: zodResolver(
      isEdit ? keluargaFormSchema : keluargaCreateFormSchema,
    ),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_KELUARGA_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isDeleting = deleteKeluarga.isPending;
  const isBusy = isSubmitting || isDeleting;

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
    deleteKeluarga.reset();
    setRejectedField(null);

    try {
      const saved = await saveKeluarga.mutateAsync(toKeluargaPayload(values));

      // On edit the household already exists, so the rows added in the form go
      // against it one by one. Creating writes them in the same transaction.
      if (isEdit) {
        for (const row of values.members) {
          await addMember.mutateAsync({
            jemaatCode: row.jemaatCode,
            roleInFamily: row.roleInFamily,
            startedAt: row.startedAt || null,
          });
        }
      }

      toast.add({ title: saved.message });
      saveListFocus(KELUARGA_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteKeluarga.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toKeluargaForm(detail.data));
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
    if (deleteKeluarga.isError) deleteRef.current?.focus();
  }, [deleteKeluarga.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah keluarga"
            : "Tidak bisa menambah keluarga"
        }
        description={`Peran Anda hanya bisa melihat data keluarga. ${isEdit ? "Perubahan data" : "Penambahan keluarga baru"} biasanya dikerjakan sekretariat.`}
        backHref={KELUARGA_LIST_PATH}
        backLabel="Kembali ke Keluarga"
        isCanView={isCanView}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="keluarga"
        backHref={listReturn}
        backLabel="Kembali ke Keluarga"
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
              isLoading={isDeleting}
            >
              {isDeleting ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Keluarga" : "Tambah Keluarga"}
          subtitle={detail.data ? householdLabel(detail.data) : code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={8} label="Memuat data keluarga…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <KeluargaSection form={form} isDisabled={isBusy} />
        <MemberSection
          form={form}
          isDisabled={isBusy}
          saved={members.data}
          isCanEndMembership={isEdit && isCanUpdate}
          onEndMembership={setEndingMember}
        />

        <EndMembershipDialog
          member={endingMember}
          live={liveMembers}
          isPending={endMember.isPending}
          errorMessage={endMember.error?.message ?? null}
          onClose={() => {
            endMember.reset();
            setEndingMember(null);
          }}
          onSubmit={(payload) =>
            endMember.mutate(
              { memberId: endingMember?.id ?? "", payload },
              { onSuccess: () => setEndingMember(null) },
            )
          }
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteKeluarga.error ? (
          <FormAlert
            title="Keluarga belum terhapus."
            message={deleteKeluarga.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="keluarga"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
