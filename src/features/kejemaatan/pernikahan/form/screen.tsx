"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, type FieldErrors } from "react-hook-form";

import { Button, type SelectOption } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  LoadingForm,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, endHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { applyServerError, revealField } from "@/lib/form-error";
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
import { NoFormAccess } from "./no-form-access";
import { PartySection } from "./party-section";

const toOption = (
  party: MarriageParty | undefined,
): SelectOption | undefined =>
  party?.jemaatCode
    ? { value: party.jemaatCode, label: party.name }
    : undefined;

interface PropTypes {
  id?: string;
}

export const MarriageFormScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
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
    defaultValues: EMPTY_MARRIAGE_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const isBusy = isSubmitting || deleteMarriage.isPending;
  const rootError = form.formState.errors.root?.message;
  const husbandOption = toOption(detail.data?.husband);
  const wifeOption = toOption(detail.data?.wife);
  const isEndable = Boolean(detail.data && !detail.data.endedAt);

  const onLeave = () => router.replace(listReturn);

  const jemaatNames = (values: MarriageFormValues): JemaatPartyNames => {
    const names: JemaatPartyNames = {};
    const sides = [
      ["husbandJemaatCode", husbandOption],
      ["wifeJemaatCode", wifeOption],
    ] as const;

    for (const [field, known] of sides) {
      const code = values[field];

      if (code) {
        names[field] =
          jemaatNameOf(code) ?? (known?.value === code ? known.label : "");
      }
    }

    return names;
  };

  const onInvalid = (errors: FieldErrors<MarriageFormValues>) =>
    setRejectedField(Object.keys(errors).find((key) => key !== "root") ?? null);

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
  // Kontrol Base UI baru aktif satu render sesudahnya, jadi tunggu satu frame.
  useEffect(() => {
    if (isBusy || !rejectedField) return;
    if (rejectedField === "root") return saveRef.current?.focus();

    const frame = requestAnimationFrame(() => revealField(rejectedField));

    return () => cancelAnimationFrame(frame);
  }, [isBusy, submitCount, rejectedField]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return <NoFormAccess isEdit={isEdit} />;
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
      {detail.isLoading ? <LoadingForm fields={7} /> : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <PartySection
          form={form}
          side="husband"
          current={husbandOption}
          isDisabled={isBusy}
        />
        <PartySection
          form={form}
          side="wife"
          current={wifeOption}
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
