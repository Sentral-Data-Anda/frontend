"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, type FieldErrors } from "react-hook-form";

import { Button } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  useFormConfirm,
} from "@/components/common/form";
import { StepUpDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { ACCOUNT_HREF } from "@/config/menu";
import { useSession } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useStepUp } from "@/hooks/use-step-up";
import { applyServerError, revealField } from "@/lib/form-error";
import { isStepUpRequired } from "@/lib/step-up";

import { useMyProfile, useUpdateMyProfile } from "../api";
import {
  profileFieldError,
  profileFormSchema,
  toProfileForm,
  toProfilePayload,
  type ProfileFormValues,
} from "../model";

import { AddressSection } from "./address-section";
import { ContactSection, IdentitySection, SocialSection } from "./sections";

export const ProfileFormScreen = () => {
  const router = useRouter();
  const session = useSession();
  const toast = useToast();
  const profile = useMyProfile();
  const save = useUpdateMyProfile();
  const stepUp = useStepUp();
  const isAsking = useBoolean();
  const confirm = useFormConfirm();
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    values: profile.data ? toProfileForm(profile.data) : undefined,
  });

  const { errors, isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = errors.root?.message;
  const isDisabled = isSubmitting || profile.isPending;

  const onInvalid = (invalid: FieldErrors<ProfileFormValues>) => {
    setRejectedField(null);
    revealField(Object.keys(invalid).find((key) => key !== "root"));
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");

    try {
      const saved = await save.mutateAsync(toProfilePayload(values));

      toast.add({ title: saved.message });
      // Nama di header dan di sidebar dibaca dari sesi, yang dirender server.
      router.refresh();
      router.replace(ACCOUNT_HREF);
    } catch (error) {
      if (isStepUpRequired(error)) {
        stepUp.onForget();
        isAsking.onTrue();
        return;
      }

      setRejectedField(
        applyServerError(error, form.setError, profileFieldError),
      );
    }
  }, onInvalid);

  const onOpenConfirm = () => {
    setRejectedField(null);

    if (!stepUp.isActive()) {
      isAsking.onTrue();
      return;
    }

    confirm.onOpen("save");
  };

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenConfirm, onInvalid)();
  };

  const onVerified = (expiresAt: string) => {
    stepUp.onGrant(expiresAt);
    isAsking.onFalse();
    confirm.onOpen("save");
  };

  const onLeave = () => router.replace(ACCOUNT_HREF);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  return (
    <FormLayout
      onSubmit={onSubmitForm}
      header={
        <PageHeader
          title="Ubah data pribadi"
          subtitle={session.jemaat?.name ?? session.username}
          backHref={ACCOUNT_HREF}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
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
            disabled={isDisabled}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
    >
      {profile.isError || (!profile.isPending && !profile.data) ? (
        <div className="px-gutter py-4">
          <FormAlert
            title={
              profile.isError
                ? "Data pribadi gagal dimuat."
                : "Akun ini belum terhubung ke data jemaat."
            }
            message={
              profile.isError
                ? "Coba buka ulang halaman ini."
                : "Hubungi sekretariat untuk menghubungkannya."
            }
          />
        </div>
      ) : (
        <>
          <IdentitySection form={form} isDisabled={isDisabled} />
          <ContactSection form={form} isDisabled={isDisabled} />
          <AddressSection form={form} isDisabled={isDisabled} />
          <SocialSection form={form} isDisabled={isDisabled} />
        </>
      )}

      {rootError ? (
        <div className="px-gutter pb-4">
          <FormAlert
            title="Data pribadi belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        </div>
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="data pribadi"
        descriptions={{
          save: "Apakah Anda ingin menyimpan perubahan data pribadi Anda? Status pernikahan, wilayah, dan keanggotaan tetap lewat sekretariat.",
        }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />

      <StepUpDialog
        isOpen={isAsking.value}
        onClose={isAsking.onFalse}
        onVerified={onVerified}
        description="untuk mengubah data pribadi."
      />
    </FormLayout>
  );
};
