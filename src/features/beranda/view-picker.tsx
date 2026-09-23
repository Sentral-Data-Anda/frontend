"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/common/button";

import {
  VIEW_LABEL,
  type DashboardView,
  type KpiGroup,
} from "./dashboard-view";

/**
 * Pemilih tampilan Beranda (permintaan user 2026-09-23). Admin memegang semua
 * izin, jadi ia melihat gabungan semua widget dan halamannya panjang; ini
 * memberinya "Semua · Keuangan · Umum" tanpa menyentuh izin.
 *
 * Pilihannya DITURUNKAN dari grup widget yang benar-benar dipegang user
 * (`selectWidgets().groups`), bukan daftar yang ditulis ulang di sini: grup
 * baru di registry otomatis jadi pilihan baru. Kurang dari dua grup =
 * dropdown tidak dirender sama sekali (bendahara murni, sekretariat murni).
 *
 * `Menu.RadioGroup` dari Base UI — primitif yang sama dengan menu akun di
 * sidebar, jadi keyboard, Escape, fokus kembali ke pemicu, dan `aria-checked`
 * datang dari sana, bukan dari kode baru.
 */
export function ViewPicker({
  value,
  groups,
  onPick,
}: {
  value: DashboardView;
  groups: readonly KpiGroup[];
  onPick: (view: DashboardView) => void;
}) {
  if (groups.length < 2) return null;

  const options: DashboardView[] = ["all", ...groups];

  return (
    <Menu.Root>
      {/* Nama aksesibel memuat teks yang terlihat (WCAG 2.5.3). */}
      <Menu.Trigger
        aria-label={`Tampilan dashboard: ${VIEW_LABEL[value]}`}
        className={buttonVariants({ variant: "outline" })}
      >
        {VIEW_LABEL[value]}
        <ChevronDown className="size-3.5" aria-hidden />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="bg-popover text-popover-foreground ring-border min-w-40 rounded-control p-1 shadow-md ring-1 outline-none">
            <Menu.RadioGroup
              value={value}
              onValueChange={(next) => onPick(next as DashboardView)}
            >
              {options.map((option) => (
                <Menu.RadioItem
                  key={option}
                  value={option}
                  className="data-highlighted:bg-primary data-highlighted:text-primary-foreground flex h-control items-center gap-2 rounded-control pr-3 pl-2 text-body font-medium outline-none select-none"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <Menu.RadioItemIndicator>
                      <Check className="size-3.5" aria-hidden />
                    </Menu.RadioItemIndicator>
                  </span>
                  {VIEW_LABEL[option]}
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
