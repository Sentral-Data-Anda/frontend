"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/common/button";
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

/**
 * Akun berstatus PENDING belum pernah punya password.
 *
 * be-sada membatasi akun seperti itu hanya pada dua endpoint (lihat
 * `PENDING_ALLOWED` di `authentication.ts`), jadi tidak ada layar lain yang
 * bisa dibukanya. Setelah password terpasang, be-sada mencabut seluruh sesi
 * akun itu — makanya di akhir kita kirim ke `/login`, bukan ke beranda.
 */
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
      className="w-full max-w-xs space-y-4"
    >
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Buat password Anda</h1>
        <p className="text-muted-foreground text-sm">
          Akun ini baru pertama kali dipakai. Setelah password dibuat, Anda akan
          diminta masuk kembali.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium">
          Password baru
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.newPassword ? true : undefined}
          aria-describedby={
            errors.newPassword ? "new-password-error" : undefined
          }
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          // Tanpa role="alert": lihat komentar senada di login-form.tsx —
          // kedua field bisa invalid bersamaan, dan aria-describedby sudah
          // cukup membacakan pesan ini begitu fokus mendarat di inputnya.
          <p id="new-password-error" className="text-destructive text-xs">
            {errors.newPassword.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Ulangi password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={
            errors.confirmPassword ? "confirm-password-error" : undefined
          }
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p id="confirm-password-error" className="text-destructive text-xs">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : "Simpan password"}
      </Button>
    </form>
  );
}
