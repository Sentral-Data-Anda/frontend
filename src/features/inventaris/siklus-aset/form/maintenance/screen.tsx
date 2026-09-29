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
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  useDeleteMaintenance,
  useMaintenanceDetail,
  useSaveMaintenance,
} from "../../api";
import {
  CYCLE_LIST_PATH,
  EMPTY_MAINTENANCE_FORM,
  cycleListHref,
  kindReturnHref,
  maintenanceFormSchema,
  serverFieldError,
  toMaintenanceForm,
  toMaintenancePayload,
  type MaintenanceFormValues,
} from "../../model";
import { NoCycleAccess } from "../../no-cycle-access";

import { MaintenanceSection } from "./maintenance-section";
import { VendorSection } from "./vendor-section";

interface PropTypes {
  code?: string;
}

export const MaintenanceFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.SIKLUS_ASET,
  );
  const listReturn = kindReturnHref(
    useListReturn(CYCLE_LIST_PATH),
    "perawatan",
  );
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const detail = useMaintenanceDetail(isCanView ? code : undefined);
  const saveMaintenance = useSaveMaintenance(code);
  const deleteMaintenance = useDeleteMaintenance(code);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_MAINTENANCE_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteMaintenance.isPending;
  const isHidden = isEdit && !detail.data;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const subtitle = detail.data
    ? `${detail.data.asset.name} · ${formatDateShort(detail.data.scheduledDate)}`
    : undefined;

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
    deleteMaintenance.reset();
    setRejectedField(null);

    try {
      const saved = await saveMaintenance.mutateAsync(
        toMaintenancePayload(values),
      );

      toast.add({ title: saved.message });
      saveListFocus(CYCLE_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteMaintenance.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetry = () => void detail.refetch();

  useEffect(() => {
    if (detail.data) form.reset(toMaintenanceForm(detail.data));
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
    if (deleteMaintenance.isError) deleteRef.current?.focus();
  }, [deleteMaintenance.isError]);

  if (!isCanView) return <NoCycleAccess />;

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah perawatan"
            : "Tidak bisa mencatat perawatan"
        }
        description="Peran Anda hanya bisa melihat siklus aset."
        backHref={cycleListHref("perawatan")}
        backLabel="Kembali ke Siklus Aset"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="perawatan"
        backHref={listReturn}
        backLabel="Kembali ke Siklus Aset"
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
              {deleteMaintenance.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Perawatan" : "Catat Perawatan"}
          subtitle={isEdit ? subtitle : "Siklus Aset"}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.error && !isNotFound ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Data perawatan gagal dimuat."
            message="Form belum bisa diisi sampai datanya termuat."
          />
          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={onRetry}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      {isEdit && detail.isLoading ? (
        <LoadingForm fields={8} label="Memuat data perawatan…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <MaintenanceSection
          form={form}
          isDisabled={isBusy}
          saved={detail.data}
        />
        <VendorSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteMaintenance.error ? (
          <FormAlert
            title="Perawatan belum terhapus."
            message={deleteMaintenance.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="perawatan"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
