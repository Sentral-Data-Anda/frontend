"use client";

import { Eye, EyeOff } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

/**
 * Input password dengan tombol tampilkan/sembunyikan.
 *
 * Tombolnya `type="button"` — tanpa itu, menekannya men-submit form. Target
 * sentuhnya 44px (size-11) penuh setinggi input, bukan ikon 16px.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const isVisible = useBoolean();

  return (
    <div className="relative">
      <Input
        type={isVisible.value ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={isVisible.onToggle}
        aria-label={
          isVisible.value ? "Sembunyikan password" : "Tampilkan password"
        }
        aria-pressed={isVisible.value}
        className="text-muted-foreground absolute top-0 right-0"
      >
        {isVisible.value ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
    </div>
  );
}
