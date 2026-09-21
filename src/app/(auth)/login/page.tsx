import { Suspense } from "react";

import { Logo } from "@/components/common/logo";

import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk" };

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Selamat Datang</h1>
          <p className="text-muted-foreground text-sm">
            Masuk untuk melanjutkan
          </p>
        </div>
      </div>

      {/*
        `useSearchParams` di dalam LoginForm memaksa segmen ini keluar dari
        prerender statis kalau tidak dibungkus Suspense — Next menolak build
        dengan "useSearchParams() should be wrapped in a suspense boundary".
      */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
