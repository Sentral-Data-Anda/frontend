"use client";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <p className="max-w-md text-muted-foreground">
        Maaf, terjadi kendala saat memuat halaman. Silakan coba lagi beberapa
        saat lagi.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </Container>
  );
}
