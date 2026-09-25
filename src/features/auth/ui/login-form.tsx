"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Input, PasswordInput } from "@/components/common/control";
import { FormField } from "@/components/common/form";
import { FetchError, fetchOne } from "@/lib/api/fetcher";

const loginSchema = z.object({
  username: z.string().min(1, "Username atau kode induk wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginForm = () => {
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
      setError("root", {
        message:
          error instanceof FetchError
            ? error.message
            : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onLogin)} className="w-full space-y-5">
      <FormField
        label="Username / Kode induk"
        htmlFor="username"
        error={errors.username?.message}
      >
        <Input
          icon={<User />}
          autoComplete="username"
          autoCapitalize="none"
          {...register("username")}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <PasswordInput
          autoComplete="current-password"
          {...register("password")}
        />
      </FormField>

      {errors.root ? (
        <p role="alert" className="text-destructive text-body">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
};
