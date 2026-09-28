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
  useDeletePengumuman,
  usePengumumanDetail,
  useSavePengumuman,
} from "../api";
import {
  PENGUMUMAN_LIST_PATH,
  announcementFormSchema,
  emptyAnnouncementForm,
  toAnnouncementBody,
  toAnnouncementForm,
  toFormError,
  type AnnouncementFormValues,
} from "../model";

import { AttachmentSection } from "./attachment-section";
import { ContentSection } from "./content-section";
import { ScheduleSection } from "./schedule-section";

interface PropTypes {
  code?: string;
}

export const PengumumanFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PENGUMUMAN,
  );
  const listReturn = useListReturn(PENGUMUMAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const savePengumuman = useSavePengumuman(code);
  const deletePengumuman = useDeletePengumuman(code);
  const detail = usePengumumanDetail(code);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyAnnouncementForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deletePengumuman.isPending;
  const isHidden = isEdit && !detail.data;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

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
    deletePengumuman.reset();
    setRejectedField(null);

    try {
      const saved = await savePengumuman.mutateAsync(
        toAnnouncementBody(values, isEdit),
      );

      toast.add({ title: saved.message });
      saveListFocus(PENGUMUMAN_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(toFormError(error), form.setError));
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deletePengumuman.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetryDetail = () => void detail.refetch();

  useEffect(() => {
    if (detail.data) form.reset(toAnnouncementForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  useEffect(() => {
    if (deletePengumuman.isError) deleteRef.current?.focus();
  }, [deletePengumuman.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah pengumuman"
            : "Tidak bisa menambah pengumuman"
        }
        description="Peran Anda hanya bisa melihat pengumuman."
        backHref={PENGUMUMAN_LIST_PATH}
        backLabel="Kembali ke Pengumuman"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="pengumuman"
        backHref={listReturn}
        backLabel="Kembali ke Pengumuman"
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
              {deletePengumuman.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Pengumuman" : "Buat Pengumuman"}
          subtitle={detail.data?.title}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.error && !isNotFound ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Data pengumuman gagal dimuat."
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
        <LoadingForm fields={8} label="Memuat data pengumuman…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <ContentSection form={form} isDisabled={isBusy} />
        <ScheduleSection form={form} isDisabled={isBusy} />
        <AttachmentSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deletePengumuman.error ? (
          <FormAlert
            title="Pengumuman belum terhapus."
            message={deletePengumuman.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="pengumuman"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
