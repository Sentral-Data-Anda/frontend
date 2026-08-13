"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/common/logo";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const {
    value: isMenuOpen,
    onToggle: onToggleMenu,
    onFalse: onCloseMenu,
  } = useBoolean(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {mainNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Buka menu"
          onClick={onToggleMenu}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>
      </Container>

      {isMenuOpen ? (
        <nav className="border-t md:hidden">
          <Container className="flex flex-col py-2">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMenu}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.title}
              </Link>
            ))}
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
