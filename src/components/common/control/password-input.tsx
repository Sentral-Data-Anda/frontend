"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import type { ComponentProps } from "react";

import { Input } from "@/components/common/control/input";
import { Button } from "@/components/ui/button";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const isVisible = useBoolean();

  return (
    <div className="relative">
      <Input
        icon={<Lock />}
        type={isVisible.value ? "text" : "password"}
        className={cn("pr-control", className)}
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
