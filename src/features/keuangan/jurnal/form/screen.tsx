"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/common/control";
import { EmptyState, useToast } from "@/components/common/feedback";
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

import { useJournalDetail, useSaveJournal } from "../api";
import {
  JURNAL_LIST_PATH,
  NO_VIEW,
  emptyJournalForm,
  isEditable,
  journalFormSchema,
  journalHref,
  toJournalForm,
  toJournalPayload,
  type JournalFormValues,
} from "../model";
import { FixLink } from "../ui";

import { EntrySection } from "./entry-section";

const NOUN = "entri jurnal";

interface PropTypes {
  publicId?: string;
}

export const JournalFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(MENU.JURNAL);
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(JURNAL_LIST_PATH);
  const leaveHref = publicId ? journalHref(publicId) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveJournal = useSaveJournal(publicId);
  const detail = useJournalDetail(isAllowed ? publicId : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyJournalForm(),
  });

  const entry = detail.data;
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const rootCode =
    saveJournal.error instanceof FetchError ? saveJournal.error.code : null;
  const isWaiting = isEdit && !entry;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

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
    setRejectedField(null);

    try {
      const saved = await saveJournal.mutateAsync(toJournalPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(JURNAL_LIST_PATH, saved.data.publicId);
      router.replace(journalHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    if (entry && isEditable(entry)) form.reset(toJournalForm(entry));
  }, [entry, form]);

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

  if (!isAllowed) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah entri jurnal"
            : "Tidak bisa menambah entri jurnal"
        }
        description={
          isCanView ? "Peran Anda hanya bisa melihat jurnal." : NO_VIEW
        }
        backHref={leaveHref}
        backLabel="Kembali ke Jurnal"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun={NOUN}
        backHref={listReturn}
        backLabel="Kembali ke Jurnal"
      />
    );
  }

  if (publicId && entry && !isEditable(entry)) {
    return (
      <div className="pb-8">
        <PageHeader
          title="Ubah Entri Jurnal"
          subtitle={entry.code}
          backHref={journalHref(publicId)}
          isBackPersistent
        />
        <EmptyState
          title="Entri ini tidak bisa diubah"
          description="Hanya draf yang bisa diubah. Entri yang sudah diposting dikoreksi dengan pembalikan."
          action={
            <Link
              href={journalHref(publicId)}
              className={buttonVariants({ variant: "outline" })}
            >
              Lihat entri
            </Link>
          }
        />
      </div>
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

          <Button
            ref={saveRef}
            type="submit"
            disabled={isSubmitting || isWaiting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan draf"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Entri Jurnal" : "Tambah Entri Jurnal"}
          subtitle={entry?.code}
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={5} label="Memuat entri jurnal…" />
      ) : null}

      {detail.error && !isNotFound && !entry ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Entri jurnal gagal dimuat."
            message="Form belum bisa diisi sampai datanya termuat."
          />

          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={() => void detail.refetch()}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      <div className={isWaiting ? "hidden" : undefined}>
        <EntrySection form={form} isDisabled={isSubmitting} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              title="Draf belum tersimpan. Coba simpan lagi."
              message={rootError}
            />
            <FixLink code={rootCode} />
          </div>
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun={NOUN}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
