"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
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

import { useDeleteEvent, useEventDetail, useSaveEvent } from "../api";
import {
  EMPTY_EVENT_FORM,
  EVENT_LIST_PATH,
  eventFormSchema,
  formatEventWhen,
  toEventForm,
  type EventFormValues,
} from "../model";

import { EventSection } from "./event-section";
import { PlaceSection } from "./place-section";
import { RegistrationSection } from "./registration-section";
import { ScheduleSection } from "./schedule-section";

interface PropTypes {
  code?: string;
}

export const EventFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.EVENT,
  );
  const listReturn = useListReturn(EVENT_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [pickLeaveHref, setPickLeaveHref] = useState<string | null>(null);
  const saveEvent = useSaveEvent(code);
  const deleteEvent = useDeleteEvent(code);
  const detail = useEventDetail(code);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const registeredCount = detail.data?.registeredCount ?? 0;
  const schema = useMemo(
    () => eventFormSchema({ isEdit, registeredCount }),
    [isEdit, registeredCount],
  );

  const form = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_EVENT_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteEvent.isPending;
  const isHidden = isEdit && !detail.data;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const subtitle = detail.data
    ? `${detail.data.name} · ${formatEventWhen(detail.data)}`
    : undefined;

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

  const onLeaveTo = (href: string) => {
    setPickLeaveHref(href);
    confirm.onCancel(isDirty, () => router.push(href));
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
    deleteEvent.reset();
    setRejectedField(null);

    try {
      const saved = await saveEvent.mutateAsync(values);

      toast.add({ title: saved.message });
      saveListFocus(EVENT_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      const field = applyServerError(error, form.setError);
      const paidError = form.getFieldState("isPaid").error?.message;

      if (paidError) {
        form.clearErrors("isPaid");
        form.setError("root", { message: paidError });
      }
      setRejectedField(paidError ? "root" : field);
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteEvent.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetryDetail = () => void detail.refetch();

  useEffect(() => {
    if (detail.data) {
      form.reset(toEventForm(detail.data), { keepDirtyValues: true });
    }
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
    if (deleteEvent.isError) deleteRef.current?.focus();
  }, [deleteEvent.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah event" : "Tidak bisa menambah event"
        }
        description="Peran Anda hanya bisa melihat data event."
        isCanView={isCanView}
        backHref={EVENT_LIST_PATH}
        backLabel="Kembali ke Event"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="event"
        backHref={listReturn}
        backLabel="Kembali ke Event"
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
              isLoading={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Event" : "Tambah Event"}
          subtitle={subtitle}
          backHref={listReturn}
          isBackPersistent
          onBack={onBack}
        />
      }
    >
      {detail.error && !isNotFound ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Data event gagal dimuat."
            message="Form belum bisa diisi sampai datanya termuat."
          />
          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={onRetryDetail}
            isLoading={detail.isFetching}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      {isEdit && detail.isLoading ? (
        <LoadingForm fields={8} label="Memuat data event…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <EventSection form={form} isDisabled={isBusy} isEdit={isEdit} />
        <ScheduleSection form={form} isDisabled={isBusy} />
        <PlaceSection form={form} isDisabled={isBusy} />
        <RegistrationSection
          form={form}
          isDisabled={isBusy}
          saved={isEdit ? detail.data : undefined}
          onOpenRegistrations={onLeaveTo}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteEvent.error ? (
          <FormAlert
            title="Event belum terhapus."
            message={deleteEvent.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="event"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
