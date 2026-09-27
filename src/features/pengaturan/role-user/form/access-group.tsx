"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, type SyntheticEvent } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import type { MenuAction, MenuNode } from "@/types/menu";

import {
  countGranted,
  groupState,
  pickableActions,
  toggleAction,
  toggleGroup,
  toggleRow,
  withMenu,
  type Access,
} from "../model";
import type { MenuOption } from "../types";

import { AccessPills } from "./access-pills";
import { AccessTable } from "./access-table";
import { NOT_HELD_HINT } from "./form-options";
import { TriCheckbox } from "./tri-checkbox";

interface PropTypes {
  group: MenuOption;
  access: Access;
  held: MenuNode[] | null;
  isTable: boolean;
  onChange: (access: Access) => void;
}

export const AccessGroup = (props: PropTypes) => {
  const { group, access, held, isTable, onChange } = props;

  const granted = countGranted(access, group.children);
  const isOpenWanted = isTable || granted > 0;
  const isOpen = useBoolean(isOpenWanted);
  const onOpen = isOpen.onTrue;
  const rows = group.children.map((menu) => ({
    slug: menu.slug,
    pickable: pickableActions(menu, held),
  }));
  const isPickable = rows.some((row) => row.pickable.length > 0);

  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) =>
    isOpen.setValue(event.currentTarget.open);

  const onPickAction = (slug: string, action: MenuAction, isOn: boolean) =>
    onChange(
      withMenu(access, slug, toggleAction(access[slug] ?? [], action, isOn)),
    );

  const onPickRow = (slug: string, pickable: MenuAction[]) =>
    onChange(withMenu(access, slug, toggleRow(access[slug], pickable)));

  // Hanya membuka: izin yang baru termuat atau baru dicentang tidak boleh tersembunyi.
  useEffect(() => {
    if (isOpenWanted) onOpen();
  }, [isOpenWanted, onOpen]);

  return (
    <div className="border-hairline relative border-b last:border-b-0">
      <label
        title={isPickable ? undefined : NOT_HELD_HINT}
        className="has-disabled:cursor-not-allowed absolute top-0 left-0 z-20 flex size-11 cursor-pointer items-center justify-center"
      >
        <TriCheckbox
          state={groupState(access, rows)}
          disabled={!isPickable}
          aria-label={`Semua izin ${group.name}`}
          onChange={() => onChange(toggleGroup(access, rows))}
        />
      </label>

      <details open={isOpen.value} onToggle={onToggle} className="group/access">
        <summary className="hover:bg-card focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-control pr-2 pl-11 transition-colors outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 truncate text-title font-semibold">
            {group.name}
          </span>

          <span className="text-muted-foreground shrink-0 text-body tabular-nums">
            {granted} dari {group.children.length} menu
          </span>

          <ChevronDown
            className="text-muted-foreground size-4 shrink-0 transition-transform group-open/access:rotate-180"
            aria-hidden
          />
        </summary>

        {isTable ? (
          <AccessTable
            group={group}
            access={access}
            held={held}
            onPickAction={onPickAction}
            onPickRow={onPickRow}
          />
        ) : (
          <AccessPills
            group={group}
            access={access}
            held={held}
            onPickAction={onPickAction}
            onPickRow={onPickRow}
          />
        )}
      </details>
    </div>
  );
};
