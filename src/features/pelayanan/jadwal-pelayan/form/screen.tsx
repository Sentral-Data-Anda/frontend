"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useForm, useWatch, type Path } from "react-hook-form";

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
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListReturn } from "@/hooks/use-list-return";
import { useIsTableWidth } from "@/hooks/use-media";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";
import { normalizeName } from "@/lib/name";

import {
  useDeleteJadwalPelayan,
  useJadwalPelayanDetail,
  usePelayanRows,
  useSaveJadwalPelayan,
} from "../api";
import {
  EMPTY_JADWAL_FORM,
  JADWAL_PELAYAN_LIST_PATH,
  formatScheduleDate,
  jadwalFormSchema,
  savedPelayanOf,
  toFormErrors,
  toJadwalCopy,
  toJadwalForm,
  toJadwalPayload,
  toWhatsAppText,
  type JadwalFormValues,
} from "../model";
import { WhatsAppButton } from "../ui";

import { pelayanLabelOf, type SlotOptions } from "./form-options";
import { JadwalSection } from "./jadwal-section";
import { PetugasSection } from "./petugas-section";

const NOUN = "jadwal pelayan";

interface PropTypes {
  code?: string;
}

export const JadwalPelayanFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const isEdit = Boolean(code);
  const copyCode = isEdit ? "" : (searchParams.get("salin") ?? "");
  const isCopy = Boolean(copyCode);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.JADWAL_PELAYAN,
  );
  const listReturn = useListReturn(JADWAL_PELAYAN_LIST_PATH);
  const isWide = useIsTableWidth() === true;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveJadwal = useSaveJadwalPelayan(code);
  const deleteJadwal = useDeleteJadwalPelayan(code);
  const detail = useJadwalPelayanDetail(code ?? (copyCode || undefined));
  const roles = useDdlOptions("role-pelayan");
  const bapel = useDdlOptions("bapel");
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const copiedRef = useRef<string | null>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const form = useForm<JadwalFormValues>({
    resolver: zodResolver(jadwalFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_JADWAL_FORM,
  });

  const [bapelId, date, startTime, endTime, slots] = useWatch({
    control: form.control,
    name: ["bapelId", "date", "startTime", "endTime", "slots"],
  });
  const pelayan = usePelayanRows(
    { bapelId, date, startTime, endTime, excludeCode: code },
    slots.map((slot) => slot.roleId),
  );
  const saved = savedPelayanOf(detail.data);
  const slotOptions: SlotOptions = {
    isReady: pelayan.isReady,
    byRole: pelayan.byRole,
    saved,
  };

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteJadwal.isPending;
  const isLoading = (isEdit || isCopy) && detail.isLoading;
  const isHidden = isEdit ? !detail.data : isLoading;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const skipped = isCopy && detail.data ? toJadwalCopy(detail.data).skipped : 0;

  const subtitle = !detail.data
    ? undefined
    : `${isCopy ? `Disalin dari ${detail.data.name} · ` : ""}${formatScheduleDate(detail.data.date)} · ${detail.data.bapel.name}`;

  const labelOf = (
    options: readonly { value: string; label: string }[],
    value: string,
  ) => options.find((option) => option.value === value)?.label ?? "";

  const slotLabels = (values: JadwalFormValues) =>
    values.slots.map((slot) =>
      pelayanLabelOf(slotOptions, slot.roleId, slot.pelayan),
    );

  const onWhatsAppText = () => {
    const values = form.getValues();

    return toWhatsAppText({
      name: normalizeName(values.name),
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      bapelName: labelOf(bapel.options, values.bapelId),
      ibadah: detail.data?.ibadah ?? [],
      slots: values.slots.map((slot) => ({
        role: labelOf(roles.options, slot.roleId),
        pelayan:
          saved.get(slot.pelayan)?.name ??
          (pelayanLabelOf(slotOptions, slot.roleId, slot.pelayan) || null),
      })),
    });
  };

  const onLeave = () => router.replace(listReturn);

  const onCancel = () => confirm.onCancel(isDirty, onLeave);

  const onBack = (event: MouseEvent<HTMLAnchorElement>) =>
    confirm.onBack(isDirty)(event);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onRejected = (error: unknown, values: JadwalFormValues) => {
    if (!(error instanceof FetchError)) {
      setRejectedField(applyServerError(error, form.setError));
      return;
    }

    const errors = toFormErrors(error, slotLabels(values));

    for (const failure of errors) {
      form.setError(failure.field as Path<JadwalFormValues>, {
        message: failure.message,
      });
    }
    setRejectedField(errors[0]?.field ?? "root");
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteJadwal.reset();
    setRejectedField(null);

    try {
      const response = await saveJadwal.mutateAsync(
        toJadwalPayload(values, isEdit),
      );

      toast.add({ title: response.message });
      saveListFocus(JADWAL_PELAYAN_LIST_PATH, response.data.code);
      router.replace(listReturn);
    } catch (error) {
      onRejected(error, values);
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteJadwal.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetrySource = () => void detail.refetch();

  useEffect(() => {
    if (!detail.data) return;
    if (!isCopy) {
      form.reset(toJadwalForm(detail.data));
      return;
    }
    if (copiedRef.current === copyCode) return;

    copiedRef.current = copyCode;
    form.reset(toJadwalCopy(detail.data).values);
    document.getElementById("date")?.focus();
  }, [detail.data, isCopy, copyCode, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField !== "root") return revealField(rejectedField);

    saveRef.current?.focus({ preventScroll: true });
    alertsRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [isSubmitting, submitCount, rejectedField]);

  useEffect(() => {
    if (!deleteJadwal.isError) return;

    deleteRef.current?.focus({ preventScroll: true });
    alertsRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [deleteJadwal.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah jadwal pelayan"
            : "Tidak bisa menambah jadwal pelayan"
        }
        description="Peran Anda hanya bisa melihat jadwal pelayan."
        isCanView={isCanView}
        backHref={JADWAL_PELAYAN_LIST_PATH}
        backLabel="Kembali ke Jadwal Pelayan"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun={NOUN}
        backHref={listReturn}
        backLabel="Kembali ke Jadwal Pelayan"
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
              isLoading={deleteJadwal.isPending}
            >
              {deleteJadwal.isPending ? "Menghapus…" : "Hapus"}
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

          <Button
            ref={saveRef}
            type="submit"
            disabled={isLocked}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Jadwal Pelayan" : "Tambah Jadwal Pelayan"}
          subtitle={subtitle}
          backHref={listReturn}
          isBackPersistent
          onBack={onBack}
          action={
            isEdit && detail.data ? (
              <WhatsAppButton
                getText={onWhatsAppText}
                isLabelVisible={isWide}
                isDisabled={isLocked}
              />
            ) : null
          }
        />
      }
    >
      <div className="space-y-3 px-gutter pt-4 empty:hidden">
        {skipped ? (
          <FormAlert
            tone="info"
            title={`${skipped} petugas tidak disalin karena sudah nonaktif.`}
            message="Pilih penggantinya di bagian Petugas."
          />
        ) : null}

        {isCopy && isNotFound ? (
          <FormAlert
            tone="info"
            title="Jadwal sumber tidak ditemukan."
            message="Mulai dari kosong."
          />
        ) : null}

        {detail.error && !isNotFound ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              tone={isCopy ? "info" : "error"}
              title={
                isCopy
                  ? "Jadwal sumber gagal dimuat."
                  : "Data jadwal pelayan gagal dimuat."
              }
              message={
                isCopy
                  ? "Isi dari awal atau coba lagi."
                  : "Form belum bisa diisi sampai datanya termuat."
              }
            />
            <Button
              type="button"
              variant="outline"
              disabled={detail.isFetching}
              onClick={onRetrySource}
              isLoading={detail.isFetching}
            >
              {detail.isFetching ? "Memuat…" : "Coba lagi"}
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingForm
          fields={8}
          label={isCopy ? "Menyalin jadwal pelayan…" : "Memuat jadwal pelayan…"}
        />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <JadwalSection
          form={form}
          bapelId={bapelId}
          isEdit={isEdit}
          isCopy={isCopy}
          isDisabled={isBusy}
        />
        <PetugasSection
          form={form}
          slots={slots}
          slotOptions={slotOptions}
          isDisabled={isBusy}
        />
      </div>

      <div ref={alertsRef} className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteJadwal.error ? (
          <FormAlert
            title="Jadwal pelayan belum terhapus."
            message={deleteJadwal.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun={NOUN}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
