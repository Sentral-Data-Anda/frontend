"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

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

import { useCutiDetail, useHolidayCalendar, useSaveCuti } from "../api";
import {
  ALL_HOLIDAY_MESSAGE,
  CUTI_LIST_PATH,
  EMPTY_CUTI_FORM,
  cutiFormSchema,
  isAllHoliday,
  isEditable,
  serverFieldError,
  toCutiForm,
  toCutiPayload,
  type CutiFormValues,
} from "../model";

import { RequestSection } from "./request-section";
import { SummarySection } from "./summary-section";

const BACK_LABEL = "Kembali ke Cuti";

const LOCKED_TITLE = "Pengajuan ini tidak bisa diubah lagi";

const LOCKED_DESCRIPTION =
  "Hanya pengajuan yang masih menunggu dan belum dikirim untuk ditandatangani yang bisa diubah. Tarik pengajuannya dulu lewat Permintaan Persetujuan.";

interface PropTypes {
  code?: string;
}

export const CutiFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.CUTI);
  const listReturn = useListReturn(CUTI_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveCuti = useSaveCuti(code);
  const detail = useCutiDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<CutiFormValues>({
    resolver: zodResolver(cutiFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_CUTI_FORM,
  });

  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });
  const calendar = useHolidayCalendar(startDate, endDate);
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isLocked = detail.data ? !isEditable(detail.data) : false;
  const holidays = calendar.data ?? [];

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

    // Satu-satunya bagian LEAVE_ZERO_DAYS yang layar ini bisa buktikan sendiri:
    // libur mingguan karyawan hidup di kontrak yang menu ini tidak boleh baca.
    if (isAllHoliday(values.startDate, values.endDate, holidays)) {
      form.setError("startDate", { message: ALL_HOLIDAY_MESSAGE });
      setRejectedField("startDate");
      return;
    }

    try {
      const saved = await saveCuti.mutateAsync(toCutiPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(CUTI_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  useEffect(() => {
    if (detail.data) form.reset(toCutiForm(detail.data));
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

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah cuti" : "Tidak bisa mengajukan cuti"
        }
        description="Peran Anda hanya bisa melihat pengajuan cuti."
        backHref={CUTI_LIST_PATH}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="pengajuan cuti"
        backHref={listReturn}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (isLocked) {
    return (
      <NoFormAccess
        title={LOCKED_TITLE}
        description={LOCKED_DESCRIPTION}
        backHref={listReturn}
        backLabel={BACK_LABEL}
      />
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
            disabled={isSubmitting || detail.isLoading}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Pengajuan Cuti" : "Ajukan Cuti"}
          subtitle={detail.data?.code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={6} label="Memuat pengajuan cuti…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <RequestSection form={form} isDisabled={isSubmitting} />

        <SummarySection
          form={form}
          holidays={holidays}
          isLoadingHolidays={calendar.isLoading}
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
        noun="pengajuan cuti"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
