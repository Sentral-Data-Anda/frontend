import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Input, PasswordInput } from "@/components/common/control";
import { FormAlert, FormField } from "@/components/common/form";
import { useAppRouter, useAppSearchParams } from "@/hooks/use-app-router";
import { FetchError, fetchOne } from "@/lib/api/fetcher";
import { SESSION_ENDED_REASON } from "@/lib/api/session";

import { markAuthHandoff } from "./auth-handoff";

const loginSchema = z.object({
  username: z.string().min(1, "Mohon lengkapi username"),
  password: z.string().min(1, "Mohon lengkapi password"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useAppRouter();
  const searchParams = useAppSearchParams();
  const isSessionEnded = searchParams.get("reason") === SESSION_ENDED_REASON;

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

      markAuthHandoff();
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
      {isSessionEnded ? (
        <FormAlert
          tone="info"
          title="Sesi Anda telah berakhir"
          message="Silakan masuk kembali untuk melanjutkan."
        />
      ) : null}

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

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        {isSubmitting ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
};
