import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/common/control";
import { shellWidth } from "@/components/layout";
import { cn } from "@/lib/utils";

export const RootError = (props: ErrorComponentProps) => {
  const { error, reset } = props;

  const router = useRouter();

  const onRetry = () => {
    reset();
    void router.invalidate();
  };

  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div
      className={cn(
        shellWidth,
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-gutter text-center",
      )}
    >
      <h1 className="text-title font-semibold">Terjadi kesalahan</h1>
      <p className="max-w-md text-muted-foreground">
        Maaf, terjadi kendala saat memuat halaman. Silakan coba lagi beberapa
        saat lagi.
      </p>
      <Button onClick={onRetry}>Coba lagi</Button>
    </div>
  );
};
