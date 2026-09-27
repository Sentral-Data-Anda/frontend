import { TABLE_HEAD } from "@/components/common/list";
import { cn } from "@/lib/utils";
import type { MenuNode } from "@/types/menu";

import { pickableActions, rowState, type Access } from "../model";
import { ACTION_LABEL, GRANT_ACTIONS, type MenuOption } from "../types";

import {
  NOT_HELD_HINT,
  type OnPickAction,
  type OnPickRow,
} from "./form-options";
import { TriCheckbox } from "./tri-checkbox";

const GRID =
  "grid grid-cols-[minmax(10rem,2fr)_repeat(5,minmax(3.5rem,5rem))] items-center";

interface PropTypes {
  group: MenuOption;
  access: Access;
  held: MenuNode[] | null;
  onPickAction: OnPickAction;
  onPickRow: OnPickRow;
}

export const AccessTable = (props: PropTypes) => {
  const { group, access, held, onPickAction, onPickRow } = props;

  return (
    <div role="table" aria-label={`Hak akses ${group.name}`} className="pb-3">
      <div
        role="rowgroup"
        className="bg-canvas/40 sticky top-0 z-10 backdrop-blur-md"
      >
        <div role="row" className={cn(GRID, "border-hairline border-b py-2")}>
          <span role="columnheader" className={cn(TABLE_HEAD, "pl-11")}>
            Menu
          </span>

          {GRANT_ACTIONS.map((action) => (
            <span
              key={action}
              role="columnheader"
              className={cn(TABLE_HEAD, "text-center")}
            >
              {ACTION_LABEL[action]}
            </span>
          ))}
        </div>
      </div>

      <div role="rowgroup">
        {group.children.map((menu) => {
          const actions = access[menu.slug] ?? [];
          const pickable = pickableActions(menu, held);

          return (
            <div
              key={menu.slug}
              role="row"
              className={cn(
                GRID,
                "hover:bg-card rounded-control transition-colors",
              )}
            >
              <div role="cell" className="min-w-0">
                <label
                  title={pickable.length ? undefined : NOT_HELD_HINT}
                  className="has-disabled:cursor-not-allowed flex min-h-11 cursor-pointer items-center"
                >
                  <span className="flex w-11 shrink-0 justify-center">
                    <TriCheckbox
                      state={rowState(actions, pickable)}
                      disabled={pickable.length === 0}
                      aria-label={`Semua aksi ${menu.name}`}
                      onChange={() => onPickRow(menu.slug, pickable)}
                    />
                  </span>

                  <span className="truncate text-body" title={menu.name}>
                    {menu.name}
                  </span>
                </label>
              </div>

              {GRANT_ACTIONS.map((action) => {
                if (!menu.actions.includes(action)) {
                  return <span key={action} role="cell" />;
                }

                const isPickable = pickable.includes(action);

                return (
                  <div key={action} role="cell" className="flex justify-center">
                    <label
                      title={isPickable ? undefined : NOT_HELD_HINT}
                      className="hover:bg-muted has-disabled:cursor-not-allowed has-disabled:bg-transparent flex size-control cursor-pointer items-center justify-center rounded-control transition-colors"
                    >
                      <TriCheckbox
                        state={actions.includes(action) ? "all" : "none"}
                        disabled={!isPickable}
                        aria-label={`${ACTION_LABEL[action]} ${menu.name}`}
                        onChange={(event) =>
                          onPickAction(menu.slug, action, event.target.checked)
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
