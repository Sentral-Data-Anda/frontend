"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useOpnameDetail, useSaveOpname } from "../api";
import {
  OPNAME_LIST_PATH,
  WHOLE_CHURCH,
  emptyOpnameForm,
  opnameFormSchema,
  opnameHref,
  toOpnameForm,
  toOpnamePayload,
  type OpnameFormValues,
} from "../model";

import { CountSection } from "./count-section";
import { HeaderSection } from "./header-section";

interface PropTypes {
  code?: string;
}

export const OpnameFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(
    MENU.STOK_OPNAME,
  );
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(OPNAME_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveOpname = useSaveOpname(code);
  const detail = useOpnameDetail(isAllowed ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<OpnameFormValues>({
    resolver: zodResolver(opnameFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyOpnameForm(),
  });

  const roomId = useWatch({ control: form.control, name: "roomId" });
  const rooms = useDdlOptions("room", "id", roomId);
  const roomOptions = [{ value: "", label: WHOLE_CHURCH }, ...rooms.options];
  const roomName =
    roomOptions.find((option) => option.value === roomId)?.label ??
    WHOLE_CHURCH;
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isDraft = detail.data?.status === "DRAFT";
  const isWaiting = isEdit && !detail.data;

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
    setRejectedField(null);

    try {
      const saved = await saveOpname.mutateAsync(toOpnamePayload(values));

      toast.add({ title: saved.message });
      saveListFocus(OPNAME_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    if (detail.data?.status === "DRAFT") form.reset(toOpnameForm(detail.data));
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

  if (!isAllowed) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah stok opname"
            : "Tidak bisa menambah stok opname"
        }
        description="Peran Anda hanya bisa melihat stok opname."
        isCanView={isCanView}
        backHref={listReturn}
        backLabel="Kembali ke Stok Opname"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="stok opname"
        backHref={listReturn}
        backLabel="Kembali ke Stok Opname"
      />
    );
  }

  if (code && detail.data && !isDraft) {
    return (
      <div className="pb-8">
        <PageHeader
          title="Ubah Stok Opname"
          subtitle={code}
          backHref={opnameHref(code)}
          isBackPersistent
        />
        <EmptyState
          title="Stok opname tidak bisa diubah"
          description="Hanya stok opname berstatus Draf yang bisa diubah."
          action={
            <Link
              href={opnameHref(code)}
              className={buttonVariants({ variant: "outline" })}
            >
              Lihat stok opname
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
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Stok Opname" : "Tambah Stok Opname"}
          subtitle={code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={4} /> : null}

      {detail.error && !detail.data ? (
        <div className="flex flex-col items-start gap-3 px-gutter py-5">
          <FormAlert
            title="Stok opname gagal dimuat."
            message={detail.error.message}
          />
          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={() => void detail.refetch()}
            isLoading={detail.isFetching}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      <div className={isWaiting ? "hidden" : undefined}>
        <HeaderSection
          form={form}
          roomOptions={roomOptions}
          isDisabled={isSubmitting}
        />
        <CountSection
          form={form}
          roomId={roomId}
          roomName={roomName}
          isDisabled={isSubmitting}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="stok opname"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
