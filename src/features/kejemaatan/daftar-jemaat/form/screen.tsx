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
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useJemaatDetail, useSaveJemaat } from "../api";
import {
  EMPTY_JEMAAT_FORM,
  JEMAAT_LIST_PATH,
  incompleteFields,
  jemaatFormSchema,
  serverFieldError,
  toJemaatForm,
  toJemaatPayload,
  type JemaatFormValues,
} from "../model";

import { AddressSection } from "./address-section";
import { ContactSection } from "./contact-section";
import { DuplicateWarning } from "./duplicate-warning";
import { FamilySection } from "./family-section";
import { IdentitySection } from "./identity-section";
import { MembershipSection } from "./membership-section";
import { NoFormAccess } from "./no-form-access";
import { RiwayatSection } from "./riwayat-fields";
import { SocialSection } from "./social-section";

interface PropTypes {
  code?: string;
}

export const JemaatFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const listReturn = useListReturn(JEMAAT_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveJemaat = useSaveJemaat(code);
  const detail = useJemaatDetail(code);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<JemaatFormValues>({
    resolver: zodResolver(jemaatFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_JEMAAT_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const watched = useWatch({ control: form.control });
  const missing = incompleteFields(watched);

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
      const saved = await saveJemaat.mutateAsync(
        toJemaatPayload(values, isEdit),
      );

      toast.add({ title: saved.message });
      saveListFocus(JEMAAT_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  useEffect(() => {
    if (detail.data) form.reset(toJemaatForm(detail.data));
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

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return <NoFormAccess isEdit={isEdit} />;
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="jemaat"
        backHref={listReturn}
        backLabel="Kembali ke Daftar Jemaat"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions
          status={
            missing.length > 0 ? (
              <>
                Belum lengkap: {missing.join(", ")}. Jemaat tetap bisa disimpan
                dan dilengkapi nanti.
              </>
            ) : undefined
          }
        >
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
          title={isEdit ? "Ubah Jemaat" : "Tambah Jemaat"}
          subtitle={detail.data?.name ?? code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={8} label="Memuat data jemaat…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <IdentitySection form={form} isDisabled={isSubmitting} />
        <MembershipSection form={form} isDisabled={isSubmitting} />
        <ContactSection form={form} isDisabled={isSubmitting} />
        <AddressSection form={form} isDisabled={isSubmitting} />
        <FamilySection form={form} isDisabled={isSubmitting} />
        <SocialSection form={form} isDisabled={isSubmitting} />
        <RiwayatSection form={form} isDisabled={isSubmitting} isEdit={isEdit} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        <DuplicateWarning
          name={watched.name ?? ""}
          birthDate={watched.birthDate ?? ""}
          ownCode={code}
        />

        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="jemaat"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
