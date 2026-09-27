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
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useDeactivateSetelan, useSaveSetelan, useSetelanDetail } from "../api";
import {
  EMPTY_SETELAN_FORM,
  SETELAN_LIST_PATH,
  serverFieldError,
  setelanFormSchema,
  toSetelanForm,
  toSetelanPayload,
  withTierIssuePaths,
  type SetelanFormValues,
} from "../model";

import { NoFormAccess } from "./no-form-access";
import { ScopeSection } from "./scope-section";
import { TiersSection } from "./tiers-section";
import { WorkflowSection } from "./workflow-section";

interface PropTypes {
  id?: string;
}

export const SetelanFormScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.SETELAN_PERSETUJUAN,
  );
  const listReturn = useListReturn(SETELAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveSetelan = useSaveSetelan(id);
  const deactivateSetelan = useDeactivateSetelan(id);
  const detail = useSetelanDetail(isEdit && isCanView ? id : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deactivateRef = useRef<HTMLButtonElement>(null);

  const form = useForm<SetelanFormValues>({
    resolver: zodResolver(setelanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_SETELAN_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const saved = detail.data;
  const isReadOnly = isEdit && !isCanUpdate;
  const isBusy = isSubmitting || deactivateSetelan.isPending;
  const isCanDeactivate = isEdit && isCanDelete && saved?.isActive === true;
  const rootError = form.formState.errors.root?.message;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReadOnly) void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deactivateSetelan.reset();
    setRejectedField(null);

    try {
      const response = await saveSetelan.mutateAsync(toSetelanPayload(values));

      toast.add({ title: response.message });
      saveListFocus(SETELAN_LIST_PATH, response.data.publicId);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(
          withTierIssuePaths(error, values.tiers),
          form.setError,
          serverFieldError,
        ),
      );
    }
  }, onInvalid);

  const onDeactivate = async () => {
    form.clearErrors("root");
    saveSetelan.reset();
    setRejectedField(null);

    try {
      const response = await deactivateSetelan.mutateAsync();

      toast.add({ title: response.message });
      if (id) saveListFocus(SETELAN_LIST_PATH, id);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  };

  useEffect(() => {
    if (detail.data) form.reset(toSetelanForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isBusy) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isBusy]);

  useEffect(() => {
    if (isBusy || !rejectedField) return;

    if (rejectedField !== "root") revealField(rejectedField);
    else (deactivateSetelan.isError ? deactivateRef : saveRef).current?.focus();
  }, [isBusy, submitCount, rejectedField, deactivateSetelan.isError]);

  if (!(isEdit ? isCanView : isCanCreate)) {
    return <NoFormAccess isEdit={isEdit} isCanView={isCanView} />;
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="alur persetujuan"
        backHref={listReturn}
        backLabel="Kembali ke Setelan Alur Persetujuan"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isCanDeactivate ? (
            <Button
              ref={deactivateRef}
              type="button"
              variant="destructive"
              disabled={isBusy || detail.isLoading}
              onClick={() => confirm.onOpen("delete")}
            >
              {deactivateSetelan.isPending ? "Menonaktifkan…" : "Nonaktifkan"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
          >
            {isReadOnly ? "Kembali" : "Batal"}
          </Button>

          {isReadOnly ? null : (
            <Button
              ref={saveRef}
              type="submit"
              disabled={isBusy || detail.isLoading}
            >
              {isSubmitting ? "Menyimpan…" : "Simpan"}
            </Button>
          )}
        </FormActions>
      }
      header={
        <PageHeader
          title={
            isEdit
              ? isReadOnly
                ? "Detail Alur Persetujuan"
                : "Ubah Alur Persetujuan"
              : "Tambah Alur Persetujuan"
          }
          subtitle={saved?.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {isReadOnly ? (
        <div className="px-gutter pt-4">
          <FormAlert
            tone="info"
            title="Peran Anda hanya bisa melihat alur ini."
            message="Hubungi administrator bila alur ini perlu diubah."
          />
        </div>
      ) : null}

      {detail.isLoading ? (
        <LoadingForm fields={8} label="Memuat data alur persetujuan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <WorkflowSection form={form} isDisabled={isBusy || isReadOnly} />
        <ScopeSection form={form} isDisabled={isBusy || isReadOnly} />
        <TiersSection
          form={form}
          isDisabled={isBusy || isReadOnly}
          isEditable={!isReadOnly}
          isEdit={isEdit}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title={
              deactivateSetelan.isError
                ? "Alur belum dinonaktifkan. Coba lagi."
                : "Data belum tersimpan. Coba simpan lagi."
            }
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="alur persetujuan"
        descriptions={
          saved
            ? {
                delete: `Nonaktifkan alur ${saved.name}? Dokumen baru tidak lagi memakai alur ini; permintaan yang sedang berjalan tidak terpengaruh.`,
              }
            : undefined
        }
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={() => void onDeactivate()}
      />
    </FormLayout>
  );
};
