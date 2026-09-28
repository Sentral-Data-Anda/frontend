"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
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
  OPEN_EVENT_DDL_PATH,
  useCreatePendaftaran,
  useEventOptions,
} from "../api";
import {
  EMPTY_REGISTRATION_FORM,
  PENDAFTARAN_LIST_PATH,
  isEventFull,
  isFullError,
  listHrefOf,
  registrationFormSchema,
  registrationHref,
  serverFieldError,
  toRegistrationPayload,
  type RegistrationFormValues,
} from "../model";

import { EventSection } from "./event-section";
import { ParticipantSection } from "./participant-section";

const isPhoneRejected = (error: unknown) =>
  error instanceof FetchError &&
  error.issues.some((issue) => issue.path === "participantPhone");

export const PendaftaranFormScreen = () => {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const presetEvent = searchParams.get("event") ?? "";
  const { isCanCreate } = useMenuAccess(MENU.PENDAFTARAN_EVENT);
  const listReturn = useListReturn(PENDAFTARAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const events = useEventOptions(OPEN_EVENT_DDL_PATH);
  const createPendaftaran = useCreatePendaftaran();
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_REGISTRATION_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const eventId = useWatch({ control: form.control, name: "eventId" });
  const pickedEvent = events.data?.find(
    (event) => String(event.id) === eventId,
  );
  const isPaid = pickedEvent?.isPaid ?? false;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await createPendaftaran.mutateAsync(
        toRegistrationPayload(values, isPaid),
      );
      const registration = saved.data;

      if (registration.event.isPaid) {
        toast.add({
          title: saved.message,
          type: registration.payment?.invoiceUrl ? undefined : "warning",
        });
        router.replace(registrationHref(registration.code));
        return;
      }

      toast.add({ title: saved.message });
      saveListFocus(PENDAFTARAN_LIST_PATH, registration.code);
      router.replace(listHrefOf(values.eventId));
    } catch (error) {
      if (values.kind === "jemaat" && isPhoneRejected(error)) {
        form.setValue("isPhoneAsked", true);
      }

      const field = applyServerError(error, form.setError, serverFieldError);

      if (field === "eventId" || isFullError(error)) void events.refetch();
      setRejectedField(field);
    }
  }, onInvalid);

  useEffect(() => {
    if (!presetEvent || form.formState.isDirty || form.getValues("eventId")) {
      return;
    }

    const preset = events.data?.find(
      (event) => String(event.id) === presetEvent,
    );

    if (preset && !isEventFull(preset)) {
      form.reset({ ...form.getValues(), eventId: presetEvent });
    }
  }, [events.data, presetEvent, form]);

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

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa mendaftarkan peserta"
        description="Peran Anda hanya bisa melihat data pendaftaran."
        backHref={PENDAFTARAN_LIST_PATH}
        backLabel="Kembali ke Pendaftaran Event"
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

          <Button ref={saveRef} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Daftarkan Peserta"
          subtitle="Pendaftaran Event"
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <EventSection
        form={form}
        isDisabled={isSubmitting}
        events={events.data}
        isLoading={events.isFetching}
        pickedEvent={pickedEvent}
      />

      <ParticipantSection
        form={form}
        isDisabled={isSubmitting}
        isPaid={isPaid}
      />

      {rootError ? (
        <div className="px-gutter pb-4">
          <FormAlert
            title={
              rootError.startsWith("Kuota")
                ? "Peserta belum terdaftar. Pilih event lain."
                : "Data belum tersimpan. Coba simpan lagi."
            }
            message={rootError}
          />
        </div>
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="pendaftaran"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
