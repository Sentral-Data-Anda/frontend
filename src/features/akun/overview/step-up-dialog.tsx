"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { PasswordInput } from "@/components/common/control";
import { FormField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { applyServerError } from "@/lib/form-error";

import { verifyPassword } from "../api";
import { verifyPasswordSchema, type VerifyPasswordValues } from "../model";

const FIELD_ID = "step-up-password";

interface PropTypes {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (expiresAt: string) => void;
}

export const StepUpDialog = (props: PropTypes) => {
  const { isOpen, onClose, onVerified } = props;

  const form = useForm<VerifyPasswordValues>({
    resolver: zodResolver(verifyPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { password: "" },
  });

  const { errors, isSubmitting } = form.formState;

  const onVerify = form.handleSubmit(async ({ password }) => {
    try {
      const response = await verifyPassword(password);

      form.reset();
      onVerified(response.data.expiresAt);
    } catch (error) {
      applyServerError(error, form.setError);
      form.setFocus("password");
    }
  });

  const onOpenChange = (isNextOpen: boolean) => {
    if (isNextOpen || isSubmitting) return;

    form.reset();
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Konfirmasi Password"
      description="Masukkan password akun Anda untuk melihat persembahan."
      confirmLabel={isSubmitting ? "Memeriksa…" : "Lanjut"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onVerify()}
    >
      <form
        noValidate
        onSubmit={(event) =>
          isSubmitting ? event.preventDefault() : void onVerify(event)
        }
        className="space-y-3"
      >
        <FormField
          label="Password"
          htmlFor={FIELD_ID}
          error={errors.password?.message}
        >
          <PasswordInput
            autoComplete="current-password"
            {...form.register("password")}
          />
        </FormField>

        {errors.root ? (
          <p role="alert" className="text-destructive text-body">
            {errors.root.message}
          </p>
        ) : null}
      </form>
    </ConfirmDialog>
  );
};
