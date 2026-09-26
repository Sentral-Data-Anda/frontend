"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, type FieldErrors } from "react-hook-form";

import { Button, PasswordInput } from "@/components/common/control";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormField,
  FormLayout,
  FormSection,
  FormWide,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader, logout } from "@/components/layout";
import { ACCOUNT_HREF } from "@/config/menu";
import { useSession } from "@/features/auth";
import { applyServerError, revealField } from "@/lib/form-error";
import { PASSWORD_HINT } from "@/lib/password";

import { useChangePassword } from "../api";
import {
  EMPTY_PASSWORD_FORM,
  passwordFieldError,
  passwordFormSchema,
  type PasswordFormValues,
} from "../model";

export const PasswordFormScreen = () => {
  const router = useRouter();
  const session = useSession();
  const changePassword = useChangePassword(session.code);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: EMPTY_PASSWORD_FORM,
  });

  const { errors, isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = errors.root?.message;

  const onInvalid = (invalid: FieldErrors<PasswordFormValues>) => {
    setRejectedField(null);
    revealField(Object.keys(invalid).find((key) => key !== "root"));
  };

  const onOpenConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");

    try {
      await changePassword.mutateAsync(values);
      await logout();
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, passwordFieldError),
      );
    }
  }, onInvalid);

  const onLeave = () => router.replace(ACCOUNT_HREF);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  return (
    <FormLayout
      onSubmit={onConfirm}
      header={
        <PageHeader
          title="Ubah password"
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

          <Button ref={saveRef} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
    >
      <FormSection
        legend="Password"
        note={`${PASSWORD_HINT} Setelah disimpan, semua perangkat keluar dan Anda masuk lagi.`}
        disabled={isSubmitting}
      >
        <FormWide className="max-w-sm">
          <FormField
            label="Password lama"
            htmlFor="oldPassword"
            error={errors.oldPassword?.message}
          >
            <PasswordInput
              autoComplete="current-password"
              {...form.register("oldPassword")}
            />
          </FormField>
        </FormWide>

        <FormWide className="max-w-sm">
          <FormField
            label="Password baru"
            htmlFor="newPassword"
            error={errors.newPassword?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              {...form.register("newPassword")}
            />
          </FormField>
        </FormWide>

        <FormWide className="max-w-sm">
          <FormField
            label="Ulangi password baru"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
          </FormField>
        </FormWide>
      </FormSection>

      {rootError ? (
        <div className="px-gutter pb-4">
          <FormAlert
            title="Password belum diganti. Coba simpan lagi."
            message={rootError}
          />
        </div>
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="password"
        descriptions={{
          save: "Apakah Anda ingin mengganti password? Semua perangkat akan keluar.",
        }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
