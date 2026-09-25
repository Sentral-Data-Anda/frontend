import { AuthWaves } from "@/components/common/brand/auth-waves";
import { LogoWordmark } from "@/components/common/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-primary relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <AuthWaves className="text-primary-foreground/10 absolute inset-x-0 top-0 h-28 w-full md:h-40" />
      <AuthWaves className="text-primary-foreground/10 absolute inset-x-0 bottom-0 h-28 w-full rotate-180 md:h-40" />

      <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-gutter pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] md:py-16">
        <LogoWordmark className="w-40" />
        <div className="bg-background w-full max-w-sm rounded-2xl p-6 shadow-sm md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
