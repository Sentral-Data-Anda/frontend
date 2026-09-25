"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import { FormActions, FormLayout, LoadingForm } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { applyServerError, firstErrorField } from "@/lib/form-error";
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

export function JemaatFormScreen({ code }: { code?: string }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const listReturn = useListReturn(JEMAAT_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveJemaat = useSaveJemaat(code);
  const detail = useJemaatDetail(code);
  const isConfirmOpen = useBoolean();

  const form = useForm<JemaatFormValues>({
    resolver: zodResolver(jemaatFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: EMPTY_JEMAAT_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const watched = useWatch({ control: form.control });
  const missing = incompleteFields(watched);

  const onLeave = () => {
    if (isDirty) isConfirmOpen.onTrue();
    else router.replace(listReturn);
  };

  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isDirty) return;

    event.preventDefault();
    isConfirmOpen.onTrue();
  };

  const onSave = form.handleSubmit(
    async (values) => {
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
        applyServerError(error, form.setError, serverFieldError);
        setRejectedField(firstErrorField(error));
      }
    },
    (errors) => {
      setRejectedField(null);
      revealField(Object.keys(errors).find((key) => key !== "root"));
    },
  );

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

    revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return <NoFormAccess isEdit={isEdit} />;
  }

  return (
    <FormLayout
      onSubmit={onSave}
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
            onClick={onLeave}
          >
            Batal
          </Button>

          <Button type="submit" disabled={isSubmitting || detail.isLoading}>
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
          onBack={onBack}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={8} /> : null}

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
          <div
            role="alert"
            className="border-destructive bg-destructive/10 flex items-start gap-2 rounded-control border p-3"
          >
            <TriangleAlert
              className="text-destructive mt-0.5 size-4 shrink-0"
              aria-hidden
            />

            <div className="min-w-0">
              <p className="text-destructive text-body font-medium">
                Data belum tersimpan. Coba simpan lagi.
              </p>
              <p className="text-destructive text-body">{rootError}</p>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen.value}
        onOpenChange={isConfirmOpen.setValue}
        title="Buang perubahan?"
        description="Isian yang belum disimpan akan hilang."
        confirmLabel="Buang"
        cancelLabel="Lanjut mengisi"
        isDestructive
        onConfirm={() => router.replace(listReturn)}
      />
    </FormLayout>
  );
}

function revealField(field: string | null | undefined) {
  if (!field) return;

  const control = document.getElementById(field);

  if (!control) return;

  control.focus({ preventScroll: true });
  control.scrollIntoView({ block: "center", behavior: "smooth" });
}
