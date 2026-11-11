import { AuthCard } from "@/components/common/brand";

import { LoginForm } from "./login-form";

export const LoginScreen = () => (
  <AuthCard>
    <div className="flex w-full flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-title font-semibold">Masuk</h1>
        <p className="text-muted-foreground text-body">
          Silakan masuk ke akun Anda
        </p>
      </div>

      <LoginForm />
    </div>
  </AuthCard>
);
