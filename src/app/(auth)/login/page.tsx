import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk" };

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-title font-semibold">Masuk</h1>
        <p className="text-muted-foreground text-body">
          Silakan masuk ke akun Anda
        </p>
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
