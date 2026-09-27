import { Check } from "lucide-react";

import type { MenuNode } from "@/types/menu";

import { pickableActions, rowState, type Access } from "../model";
import { ACTION_LABEL, GRANT_ACTIONS, type MenuOption } from "../types";

import {
  NOT_HELD_HINT,
  type OnPickAction,
  type OnPickRow,
} from "./form-options";
import { TriCheckbox } from "./tri-checkbox";

interface PropTypes {
  group: MenuOption;
  access: Access;
  held: MenuNode[] | null;
  onPickAction: OnPickAction;
  onPickRow: OnPickRow;
}

export const AccessPills = (props: PropTypes) => {
  const { group, access, held, onPickAction, onPickRow } = props;

  return (
    <ul aria-label={`Hak akses ${group.name}`} className="pb-3">
      {group.children.map((menu) => {
        const actions = access[menu.slug] ?? [];
        const pickable = pickableActions(menu, held);

        return (
          <li key={menu.slug} className="py-2 pl-11">
            <div className="flex min-h-control items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-body font-medium">
                {menu.name}
              </span>

              <label
                title={pickable.length ? undefined : NOT_HELD_HINT}
                className="text-muted-foreground has-disabled:cursor-not-allowed flex min-h-control cursor-pointer items-center gap-2 text-body"
              >
                Semua
                <TriCheckbox
                  state={rowState(actions, pickable)}
                  disabled={pickable.length === 0}
                  aria-label={`Semua aksi ${menu.name}`}
                  onChange={() => onPickRow(menu.slug, pickable)}
                />
              </label>
            </div>

            <div
              role="group"
              aria-label={`Aksi ${menu.name}`}
              className="flex flex-wrap gap-2 pt-1"
            >
              {GRANT_ACTIONS.filter((action) =>
                menu.actions.includes(action),
              ).map((action) => {
                const isPickable = pickable.includes(action);

                return (
                  <label
                    key={action}
                    title={isPickable ? undefined : NOT_HELD_HINT}
                    className="border-input bg-card has-checked:border-primary has-checked:bg-accent has-checked:text-accent-foreground has-focus-visible:ring-ring not-has-checked:hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50 has-disabled:hover:bg-card inline-flex h-control cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-body transition-colors has-focus-visible:ring-2"
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={actions.includes(action)}
                      disabled={!isPickable}
                      onChange={(event) =>
                        onPickAction(menu.slug, action, event.target.checked)
                      }
                    />
                    <Check
                      className="hidden size-3.5 peer-checked:block"
                      aria-hidden
                    />
                    {ACTION_LABEL[action]}
                  </label>
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
};
