"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button, PasswordInput } from "@/components/common/control";
import { FormField } from "@/components/common/form";
import { fetchOne } from "@/lib/api/fetcher";
import { applyServerError } from "@/lib/form-error";
import { firstPasswordSchema, PASSWORD_HINT } from "@/lib/password";

type FirstLoginForm = z.infer<typeof firstPasswordSchema>;

interface PropTypes {
  code: string;
}

export const FirstLoginForm = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstLoginForm>({
    resolver: zodResolver(firstPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmitPassword = async (form: FirstLoginForm) => {
    try {
      await fetchOne(`/auth/update/${encodeURIComponent(code)}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      router.replace("/login");
    } catch (error) {
      applyServerError(error, setError);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitPassword)}
      className="w-full space-y-4"
    >
      <div className="space-y-1">
        <h1 className="text-title font-semibold">Buat password Anda</h1>
        <p className="text-muted-foreground text-body">
          Akun ini baru pertama kali dipakai. Setelah password dibuat, Anda akan
          diminta masuk kembali.
        </p>
      </div>

      <FormField
        label="Password baru"
        htmlFor="newPassword"
        hint={PASSWORD_HINT}
        error={errors.newPassword?.message}
      >
        <PasswordInput
          autoComplete="new-password"
          {...register("newPassword")}
        />
      </FormField>

      <FormField
        label="Ulangi password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </FormField>

      {errors.root ? (
        <p role="alert" className="text-destructive text-body">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : "Simpan password"}
      </Button>
    </form>
  );
};
