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

import { useDeleteStock, useSaveStock, useStockDetail } from "../api";
import {
  EMPTY_STOCK_FORM,
  STOCK_LIST_PATH,
  serverFieldError,
  stockFormSchema,
  toStockForm,
  toStockPayload,
  type StockFormValues,
} from "../model";

import { ItemSection } from "./item-section";
import { LocationSection } from "./location-section";
import { StockSection } from "./stock-section";

const DELETE_DESCRIPTION =
  "Apakah Anda ingin menghapus barang persediaan ini? Hanya barang dengan stok 0 yang bisa dihapus; riwayat mutasinya tetap tersimpan.";

interface PropTypes {
  code?: string;
}

export const StockFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.BARANG_PERSEDIAAN,
  );
  const listReturn = useListReturn(STOCK_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveStock = useSaveStock(code);
  const deleteStock = useDeleteStock(code);
  const detail = useStockDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_STOCK_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteStock.isPending;
  const isHidden = isEdit && !detail.data;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const deleteError = deleteStock.error;

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
    deleteStock.reset();
    setRejectedField(null);

    try {
      const saved = await saveStock.mutateAsync(toStockPayload(values, isEdit));

      toast.add({ title: saved.message });
      saveListFocus(STOCK_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteStock.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetryDetail = () => void detail.refetch();

  useEffect(() => {
    if (detail.data) {
      form.reset(toStockForm(detail.data), { keepDirtyValues: true });
    }
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
    if (deleteStock.isError) deleteRef.current?.focus();
  }, [deleteStock.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah barang persediaan"
            : "Tidak bisa menambah barang persediaan"
        }
        description="Peran Anda hanya bisa melihat data barang persediaan."
        isCanView={isCanView}
        backHref={STOCK_LIST_PATH}
        backLabel="Kembali ke Barang Persediaan"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="barang persediaan"
        backHref={listReturn}
        backLabel="Kembali ke Barang Persediaan"
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
              {deleteStock.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Barang Persediaan" : "Tambah Barang Persediaan"}
          subtitle={detail.data?.name ?? code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.error && !isNotFound && !detail.data ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Data barang persediaan gagal dimuat."
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
        <LoadingForm fields={8} label="Memuat data barang persediaan…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <ItemSection form={form} isDisabled={isBusy} />
        <LocationSection form={form} isDisabled={isBusy} isEdit={isEdit} />
        <StockSection form={form} isDisabled={isBusy} item={detail.data} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteError ? (
          <FormAlert
            title="Barang persediaan belum terhapus."
            message={deleteError.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="barang persediaan"
        descriptions={{ delete: DELETE_DESCRIPTION }}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
