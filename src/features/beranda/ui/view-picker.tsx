"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/common/control/button";
import { MENU_ITEM, MENU_POPUP } from "@/components/common/overlay/popup-style";
import { cn } from "@/lib/utils";

import {
  canPickView,
  VIEW_LABEL,
  type DashboardView,
  type KpiGroup,
} from "../view";

export function ViewPicker({
  value,
  groups,
  onPick,
}: {
  value: DashboardView;
  groups: readonly KpiGroup[];
  onPick: (view: DashboardView) => void;
}) {
  if (!canPickView(groups)) return null;

  const options: DashboardView[] = ["all", ...groups];

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Tampilan dashboard: ${VIEW_LABEL[value]}`}
        className={buttonVariants({ variant: "outline" })}
      >
        {VIEW_LABEL[value]}
        <ChevronDown className="size-3.5" aria-hidden />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className={MENU_POPUP}>
            <Menu.RadioGroup
              value={value}
              onValueChange={(next) => onPick(next as DashboardView)}
            >
              {options.map((option) => (
                <Menu.RadioItem
                  key={option}
                  value={option}
                  closeOnClick
                  className={cn(MENU_ITEM, "pr-3")}
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
