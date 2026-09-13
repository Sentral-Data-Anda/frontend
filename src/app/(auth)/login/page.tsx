import { Suspense } from "react";

import { Logo } from "@/components/common/logo";
import { siteConfig } from "@/config/site";

import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk" };

export default function Page() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo />
        <p className="text-muted-foreground text-sm">
          {siteConfig.description}
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
