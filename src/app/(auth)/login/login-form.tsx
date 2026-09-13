"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/common/button";
import { FetchError, fetchOne } from "@/lib/api/fetcher";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onLogin = async (form: LoginForm) => {
    try {
      await fetchOne("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const redirect = searchParams.get("redirect");

      router.replace(
        redirect
          ? `/authentication?redirect=${encodeURIComponent(redirect)}`
          : "/authentication",
      );
    } catch (error) {
      // Galat login tampil di dalam form, bukan sebagai toast: satu-satunya
      // hal yang bisa dilakukan user adalah membetulkan field di depannya, dan
      // toast justru menjauhkan pesannya dari tempat itu.
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
      onSubmit={handleSubmit(onLogin)}
      className="w-full max-w-xs space-y-4"
    >
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? "username-error" : undefined}
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("username")}
        />
        {errors.username ? (
          // Tanpa role="alert": kedua field bisa invalid bersamaan (submit
          // dengan keduanya kosong), dan alert ganda yang meletup serentak
          // sebelum user sempat pindah fokus lebih berisik daripada
          // menolong. aria-describedby sudah cukup — pembaca layar membaca
          // pesan ini begitu fokus mendarat di input yang aria-invalid.
          <p id="username-error" className="text-destructive text-xs">
            {errors.username.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          {...register("password")}
        />
        {errors.password ? (
          <p id="password-error" className="text-destructive text-xs">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}
