"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/common/control";
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
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { useDeleteIbadah, useIbadahDetail, useSaveIbadah } from "../api";
import {
  EMPTY_IBADAH_FORM,
  IBADAH_LIST_PATH,
  formatServiceDate,
  ibadahFormSchema,
  salinHref,
  serverFieldError,
  toIbadahCopy,
  toIbadahForm,
  toIbadahPayload,
  type IbadahFormValues,
} from "../model";

import { AttendanceSection } from "./attendance-section";
import { ConductSection } from "./conduct-section";
import { ScheduleSection } from "./schedule-section";

interface PropTypes {
  code?: string;
}

export const IbadahFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const isEdit = Boolean(code);
  const copyCode = isEdit ? "" : (searchParams.get("salin") ?? "");
  const isCopy = Boolean(copyCode);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.IBADAH);
  const listReturn = useListReturn(IBADAH_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [pickLeaveHref, setPickLeaveHref] = useState<string | null>(null);
  const saveIbadah = useSaveIbadah(code);
  const deleteIbadah = useDeleteIbadah(code);
  const detail = useIbadahDetail(code ?? (copyCode || undefined));
  const activeTypes = useDdlOptions("type-ibadah", "id");
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const copiedRef = useRef<string | null>(null);

  const form = useForm<IbadahFormValues>({
    resolver: zodResolver(ibadahFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_IBADAH_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteIbadah.isPending;
  const activeTypeKey = activeTypes.options.map((type) => type.value).join();
  const isCopyLoading =
    isCopy && (detail.isLoading || (activeTypes.isLoading && !activeTypeKey));
  const isLoading = isEdit ? detail.isLoading : isCopyLoading;
  const source = isCopy ? detail.data : undefined;
  const isSourceTypeInactive =
    source !== undefined &&
    Boolean(activeTypeKey) &&
    !activeTypeKey.split(",").includes(String(source.typeIbadah.id));
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const copyHref = code ? salinHref(code) : "";

  const subtitle = !detail.data
    ? undefined
    : `${isCopy ? "Disalin dari " : ""}${detail.data.typeIbadah.name} · ${formatServiceDate(detail.data.date)}`;

  const typeNameOf = (typeIbadahId: string) =>
    detail.data && String(detail.data.typeIbadah.id) === typeIbadahId
      ? detail.data.typeIbadah.name
      : (activeTypes.options.find((type) => type.value === typeIbadahId)
          ?.label ?? "Ibadah ini");

  const onLeaveToList = () => router.replace(listReturn);

  const onLeave = () =>
    pickLeaveHref ? router.push(pickLeaveHref) : onLeaveToList();

  const onCancel = () => {
    setPickLeaveHref(null);
    confirm.onCancel(isDirty, onLeaveToList);
  };

  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    setPickLeaveHref(null);
    confirm.onBack(isDirty)(event);
  };

  const onCopy = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setPickLeaveHref(copyHref);
    confirm.onCancel(isDirty, () => router.push(copyHref));
  };

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
    deleteIbadah.reset();
    setRejectedField(null);

    try {
      const saved = await saveIbadah.mutateAsync(toIbadahPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(IBADAH_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, (message) =>
          serverFieldError(message, typeNameOf(values.typeIbadahId)),
        ),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteIbadah.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetrySource = () => void detail.refetch();

  useEffect(() => {
    if (!detail.data || isCopyLoading) return;
    if (!isCopy) {
      form.reset(toIbadahForm(detail.data));
      return;
    }
    if (copiedRef.current === copyCode) return;

    copiedRef.current = copyCode;
    form.reset(toIbadahCopy(detail.data, activeTypeKey.split(",")));
    document.getElementById("date")?.focus();
  }, [detail.data, isCopy, isCopyLoading, copyCode, activeTypeKey, form]);

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
    if (deleteIbadah.isError) deleteRef.current?.focus();
  }, [deleteIbadah.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah ibadah" : "Tidak bisa menambah ibadah"
        }
        description="Peran Anda hanya bisa melihat data ibadah."
        backHref={IBADAH_LIST_PATH}
        backLabel="Kembali ke Ibadah"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="ibadah"
        backHref={listReturn}
        backLabel="Kembali ke Ibadah"
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
              disabled={isBusy || isLoading}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteIbadah.isPending ? "Menghapus…" : "Hapus"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={onCancel}
          >
            Batal
          </Button>

          <Button ref={saveRef} type="submit" disabled={isBusy || isLoading}>
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Ibadah" : "Tambah Ibadah"}
          subtitle={subtitle}
          backHref={listReturn}
          isBackPersistent
          onBack={onBack}
          action={
            isEdit && isCanCreate ? (
              <Link
                href={copyHref}
                onClick={onCopy}
                aria-disabled={isBusy || undefined}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "shrink-0 cursor-pointer gap-1.5",
                  isBusy && "pointer-events-none opacity-50",
                )}
              >
                <Copy aria-hidden />
                Salin
              </Link>
            ) : null
          }
        />
      }
    >
      <div className="space-y-3 px-gutter pt-4 empty:hidden">
        {isSourceTypeInactive ? (
          <FormAlert
            tone="info"
            title={`Tipe ${source.typeIbadah.name} sudah nonaktif, jadi tidak ikut disalin.`}
            message="Pilih tipe lain."
          />
        ) : null}

        {isCopy && isNotFound ? (
          <FormAlert
            tone="info"
            title="Ibadah yang akan disalin tidak ditemukan."
            message="Isi data dari awal."
          />
        ) : null}

        {detail.error && !isNotFound ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              tone={isCopy ? "info" : "error"}
              title={
                isCopy
                  ? "Ibadah sumber gagal dimuat."
                  : "Data ibadah gagal dimuat."
              }
              message={
                isCopy ? "Isi data dari awal atau coba lagi." : "Coba lagi."
              }
            />
            <Button
              type="button"
              variant="outline"
              disabled={detail.isFetching}
              onClick={onRetrySource}
            >
              {detail.isFetching ? "Memuat…" : "Coba lagi"}
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingForm
          fields={8}
          label={isCopy ? "Menyalin ibadah…" : "Memuat data ibadah…"}
        />
      ) : null}

      <div className={isLoading ? "hidden" : undefined}>
        <ScheduleSection form={form} isDisabled={isBusy} />
        <ConductSection
          form={form}
          isDisabled={isBusy}
          saved={isEdit ? detail.data : undefined}
        />
        <AttendanceSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteIbadah.error ? (
          <FormAlert
            title="Ibadah belum terhapus."
            message={deleteIbadah.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="ibadah"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
