"use client";

import { Menu } from "@base-ui/react/menu";
import { ArrowLeftRight, Landmark, Plus, Wallet } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { MENU_ITEM, MENU_POPUP } from "@/components/common/overlay";
import { useIsDesktop } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

import { PREFILL_PARAM, TRANSFER_CREATE_PATH } from "../model";

const SHORTCUTS = [
  {
    href: `${TRANSFER_CREATE_PATH}?${PREFILL_PARAM.from}=kas`,
    label: "Setor ke bank",
    icon: Landmark,
  },
  {
    href: `${TRANSFER_CREATE_PATH}?${PREFILL_PARAM.to}=kas-kecil`,
    label: "Isi kas kecil",
    icon: Wallet,
  },
  {
    href: TRANSFER_CREATE_PATH,
    label: "Pemindahan lain",
    icon: ArrowLeftRight,
  },
];

export const TransferAddMenu = () => {
  const isDesktop = useIsDesktop() === true;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Catat setoran"
        className={cn(
          buttonVariants(isDesktop ? {} : { size: "icon" }),
          "cursor-pointer",
          isDesktop ? "gap-1.5" : "rounded-full",
        )}
      >
        <Plus aria-hidden />
        {isDesktop ? "Catat setoran" : null}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className={cn(MENU_POPUP, "min-w-52")}>
            {SHORTCUTS.map((shortcut) => (
              <Menu.LinkItem
                key={shortcut.label}
                render={<Link href={shortcut.href} />}
                className={cn(MENU_ITEM, "cursor-pointer pr-3")}
              >
                <shortcut.icon className="size-4" aria-hidden />
                {shortcut.label}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
