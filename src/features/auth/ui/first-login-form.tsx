"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, PasswordInput } from "@/components/common/control";
import { FormField } from "@/components/common/form";
import { FetchError, fetchOne } from "@/lib/api/fetcher";

const firstLoginSchema = z
  .object({
    newPassword: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((form) => form.newPassword === form.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

type FirstLoginForm = z.infer<typeof firstLoginSchema>;

export function FirstLoginForm({ code }: { code: string }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstLoginForm>({
    resolver: zodResolver(firstLoginSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmitPassword = async (form: FirstLoginForm) => {
    try {
      await fetchOne(`/auth/update/${code}`, {
        method: "PUT",
        body: JSON.stringify({ newPassword: form.newPassword }),
      });

      router.replace("/login");
    } catch (error) {
      setError("root", {
        message:
          error instanceof FetchError
            ? error.message
            : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
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
        hint="Minimal 8 karakter."
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
}
