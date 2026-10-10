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
import { MENU, endHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { FIRST_INVALID, applyServerError, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import {
  useDeleteMarriage,
  useJemaatNameOf,
  useMarriageDetail,
  useSaveMarriage,
} from "../api";
import {
  EMPTY_MARRIAGE_FORM,
  MARRIAGE_LIST_PATH,
  coupleName,
  marriageFormSchema,
  serverFieldError,
  toMarriageForm,
  toMarriagePayload,
  type JemaatPartyNames,
  type MarriageFormValues,
} from "../model";
import type { MarriageParty } from "../types";

import { MarriageSection } from "./marriage-section";
import { PartySection } from "./party-section";

interface PropTypes {
  id?: string;
}

export const MarriageFormScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PERNIKAHAN,
  );
  const listReturn = useListReturn(MARRIAGE_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveMarriage = useSaveMarriage(id);
  const deleteMarriage = useDeleteMarriage(id);
  const detail = useMarriageDetail(id);
  const jemaatNameOf = useJemaatNameOf();
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<MarriageFormValues>({
    resolver: zodResolver(marriageFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_MARRIAGE_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const isBusy = isSubmitting || deleteMarriage.isPending;
  const rootError = form.formState.errors.root?.message;
  const isEndable = Boolean(detail.data && !detail.data.endedAt);

  const onLeave = () => router.replace(listReturn);

  const nameOf = (code: string, saved?: MarriageParty) =>
    jemaatNameOf(code) ?? (saved?.jemaatCode === code ? saved.name : "");

  const jemaatNames = (values: MarriageFormValues): JemaatPartyNames => ({
    ...(values.husbandJemaatCode
      ? {
          husbandJemaatCode: nameOf(
            values.husbandJemaatCode,
            detail.data?.husband,
          ),
        }
      : {}),
    ...(values.wifeJemaatCode
      ? { wifeJemaatCode: nameOf(values.wifeJemaatCode, detail.data?.wife) }
      : {}),
  });

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
      const saved = await saveMarriage.mutateAsync(toMarriagePayload(values));

      toast.add({ title: saved.message });
      saveListFocus(MARRIAGE_LIST_PATH, saved.data.publicId);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, (message) =>
          serverFieldError(message, jemaatNames(values)),
        ),
      );
    }
  }, onInvalid);

  const onDelete = async () => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const deleted = await deleteMarriage.mutateAsync();

      toast.add({ title: deleted.message });
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  };

  useEffect(() => {
    if (detail.data) form.reset(toMarriageForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isBusy || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isBusy, submitCount, rejectedField]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah pernikahan"
            : "Tidak bisa mencatat pernikahan"
        }
        description={`Peran Anda hanya bisa melihat data pernikahan. ${isEdit ? "Perubahan data" : "Pencatatan pernikahan baru"} biasanya dikerjakan sekretariat.`}
        backHref={MARRIAGE_LIST_PATH}
        backLabel="Kembali ke Pernikahan"
        isCanView={isCanView}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="pernikahan"
        backHref={listReturn}
        backLabel="Kembali ke Pernikahan"
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
              type="button"
              variant="destructive"
              disabled={isBusy || detail.isLoading}
              onClick={() => confirm.onOpen("delete")}
              isLoading={deleteMarriage.isPending}
            >
              {deleteMarriage.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Pernikahan" : "Catat Pernikahan"}
          subtitle={detail.data ? coupleName(detail.data) : undefined}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={7} label="Memuat data pernikahan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <PartySection
          form={form}
          side="husband"
          saved={detail.data?.husband}
          isDisabled={isBusy}
        />
        <PartySection
          form={form}
          side="wife"
          saved={detail.data?.wife}
          isDisabled={isBusy}
        />
        <MarriageSection
          form={form}
          isDisabled={isBusy}
          endHref={
            id && isEndable
              ? endHref(MENU.KEJEMAATAN, MENU.PERNIKAHAN, id)
              : undefined
          }
          isDirty={isDirty}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title={
              confirm.kind === "delete"
                ? "Pernikahan belum terhapus."
                : "Data belum tersimpan. Coba simpan lagi."
            }
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="pernikahan"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={() => void onDelete()}
      />
    </FormLayout>
  );
};
