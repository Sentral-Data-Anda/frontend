"use client";

import { Menu } from "@base-ui/react/menu";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutGrid,
  LogOut,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";

import { Avatar } from "@/components/common/display";
import { MENU_ITEM, MENU_POPUP } from "@/components/common/overlay";
import { MENU_ICON, domainHref, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";
import type { MenuNode } from "@/types/menu";

import { AppIdentity } from "./app-identity";
import { isTabActive } from "./bottom-tab";
import { LogoutButton, logout } from "./logout-button";
import { SIDEBAR_MOTION, sidebarCookie } from "./sidebar-collapse";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring";

const ITEM = cn(
  "flex h-10 items-center gap-3 overflow-hidden rounded-control px-2.5 transition-colors",
  FOCUS,
);

const IDLE = "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const ACTIVE = "bg-sidebar-primary text-sidebar-primary-foreground font-medium";

const RAIL_HIDDEN = cn(
  "group-data-collapsed/sidebar:invisible motion-reduce:group-data-collapsed/sidebar:transition-none",
  SIDEBAR_MOTION,
);

const HIDE_IN_RAIL = cn(
  "transition-opacity group-data-collapsed/sidebar:transition-[opacity,visibility] group-data-collapsed/sidebar:opacity-0",
  RAIL_HIDDEN,
);

const LABEL = cn(
  "min-w-0 flex-1 truncate transition-opacity group-data-collapsed/sidebar:text-clip group-data-collapsed/sidebar:opacity-0",
  SIDEBAR_MOTION,
);

export function Sidebar({ defaultCollapsed }: { defaultCollapsed: boolean }) {
  const session = useSession();
  const pathname = usePathname();
  const isCollapsed = useBoolean(defaultCollapsed);
  const name = session.jemaat?.name ?? session.username;
  const role = session.roleUser.name;
  const ref = useRef<HTMLElement>(null);
  const toggleLabel = isCollapsed.value ? "Lebarkan menu" : "Ciutkan menu";
  const ToggleIcon = isCollapsed.value ? ChevronRight : ChevronLeft;

  const onToggle = () => {
    const next = !isCollapsed.value;

    document.cookie = sidebarCookie(next);
    isCollapsed.setValue(next);
  };

  const onExpand = () => {
    document.cookie = sidebarCookie(false);
    isCollapsed.onFalse();
  };

  useEffect(() => {
    ref.current
      ?.querySelector("nav [aria-current]")
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <Tooltip.Provider>
      <div className="sticky top-0 z-30 hidden h-dvh shrink-0 lg:flex">
        <RailTip label={toggleLabel}>
          <button
            type="button"
            aria-label={toggleLabel}
            onClick={onToggle}
            className={cn(
              "absolute top-17 right-0 z-10 flex size-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full after:absolute after:-inset-2",
              "bg-card text-foreground border-input hover:border-primary border shadow-sm transition-colors",
              "focus-visible:outline-sidebar focus-visible:ring-sidebar-ring focus-visible:ring-2 focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <ToggleIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
          </button>
        </RailTip>

        <aside
          ref={ref}
          data-slot="sidebar"
          data-collapsed={isCollapsed.value || undefined}
          className={cn(
            "group/sidebar bg-sidebar text-sidebar-foreground flex shrink-0 flex-col overflow-hidden transition-[width]",
            SIDEBAR_MOTION,
            isCollapsed.value ? "w-18" : "w-64",
          )}
        >
          <div className="border-sidebar-border flex border-b px-4.5 py-4">
            <AppIdentity
              role={role}
              tone="sidebar"
              isCompact={isCollapsed.value}
            />
          </div>

          <SidebarNav
            menu={session.menu}
            pathname={pathname}
            isCollapsed={isCollapsed.value}
            onExpand={onExpand}
          />

          <div className="border-sidebar-border flex items-center gap-3 border-t px-4.5 py-3">
            <AccountMenu name={name} role={role} />
            <div className="group-data-collapsed/sidebar:hidden">
              <Avatar label={name} />
            </div>
            <div className={cn("min-w-0 flex-1", HIDE_IN_RAIL)}>
              <p className="truncate text-body font-medium" title={name}>
                {name}
              </p>
              <p
                className="text-sidebar-muted-foreground truncate text-caption"
                title={role}
              >
                {role}
              </p>
            </div>
            <LogoutButton className={cn(IDLE, FOCUS, HIDE_IN_RAIL)} />
          </div>
        </aside>
      </div>
    </Tooltip.Provider>
  );
}

function AccountMenu({ name, role }: { name: string; role: string }) {
  return (
    <Menu.Root>
      <RailTip label={name}>
        <Menu.Trigger
          aria-label={`Akun: ${name}`}
          className={cn(
            "hidden rounded-full group-data-collapsed/sidebar:block",
            FOCUS,
          )}
        >
          <Avatar label={name} />
        </Menu.Trigger>
      </RailTip>
      <Menu.Portal>
        <Menu.Positioner
          side="right"
          align="end"
          sideOffset={10}
          className="z-50"
        >
          <Menu.Popup className={cn(MENU_POPUP, "min-w-48")}>
            <Menu.Group>
              <Menu.GroupLabel className="px-2 py-1.5">
                <span
                  className="block truncate text-lead font-semibold"
                  title={name}
                >
                  {name}
                </span>
                <span
                  className="text-muted-foreground block truncate text-body"
                  title={role}
                >
                  {role}
                </span>
              </Menu.GroupLabel>
              <Menu.Separator className="bg-border -mx-1 my-1 h-px" />
              <Menu.Item onClick={() => void logout()} className={MENU_ITEM}>
                <LogOut className="size-4" aria-hidden />
                Keluar
              </Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function RailTip({
  label,
  isDisabled = false,
  children,
}: {
  label: string;
  isDisabled?: boolean;
  children: React.ReactElement;
}) {
  return (
    <Tooltip.Root disabled={isDisabled}>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={10} className="z-50">
          <Tooltip.Popup className="bg-sidebar text-sidebar-foreground ring-sidebar-border rounded-control px-2 py-1 text-body font-medium shadow-md ring-1">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function Fold({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="fold"
      className={cn(
        "grid grid-cols-1 grid-rows-[1fr] transition-[grid-template-rows,opacity] group-data-collapsed/sidebar:grid-rows-[0fr] group-data-collapsed/sidebar:opacity-0 group-data-collapsed/sidebar:transition-[grid-template-rows,opacity,visibility]",
        RAIL_HIDDEN,
      )}
    >
      <div className="-m-1 min-h-0 overflow-clip p-1">{children}</div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  isCollapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  pathname: string;
  isCollapsed: boolean;
}) {
  const isActive = isTabActive(href, pathname);

  return (
    <RailTip label={label} isDisabled={!isCollapsed}>
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          ITEM,
          "text-title",
          isActive ? ACTIVE : cn("text-sidebar-foreground font-medium", IDLE),
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0",
            !isActive && "text-sidebar-muted-foreground",
          )}
          aria-hidden
        />
        <span className={LABEL}>{label}</span>
      </Link>
    </RailTip>
  );
}

function openFromRail(details: HTMLDetailsElement, onExpand: () => void) {
  details.open = true;
  // Paksa tata letak selagi gaya rail masih berlaku, supaya lipatan tumbuh dari 0.
  details.getBoundingClientRect();
  flushSync(onExpand);
  details.querySelector("summary")?.focus({ preventScroll: true });

  const fold = details.querySelector<HTMLElement>(
    ':scope > [data-slot="fold"]',
  );
  let isDone = false;
  const follow = () => {
    details.scrollIntoView({ block: "nearest" });
    if (!isDone) requestAnimationFrame(follow);
  };

  Promise.all((fold?.getAnimations() ?? []).map((a) => a.finished))
    .catch(() => {})
    .finally(() => (isDone = true));
  requestAnimationFrame(follow);
}

export function SidebarNav({
  menu,
  pathname,
  isCollapsed = false,
  onExpand = () => {},
}: {
  menu: MenuNode[];
  pathname: string;
  isCollapsed?: boolean;
  onExpand?: () => void;
}) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
    >
      <ul>
        <li>
          <NavLink
            href="/"
            label="Beranda"
            icon={House}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />
        </li>
        <li
          className={cn(
            "transition-none group-data-collapsed/sidebar:transition-[visibility]",
            RAIL_HIDDEN,
          )}
        >
          <Fold>
            <div className="pt-0.5">
              <NavLink
                href="/modul"
                label="Pencarian"
                icon={Search}
                pathname={pathname}
                isCollapsed={isCollapsed}
              />
            </div>
          </Fold>
        </li>
      </ul>

      <ul
        className={cn(
          "border-sidebar-border mt-3 space-y-0.5 border-t pt-3 transition-[margin,padding,border-color]",
          "group-data-collapsed/sidebar:mt-px group-data-collapsed/sidebar:border-transparent group-data-collapsed/sidebar:pt-0",
          SIDEBAR_MOTION,
        )}
      >
        {menu.map((domain) => {
          const Icon = MENU_ICON[domain.slug] ?? LayoutGrid;
          const isActive = isTabActive(domainHref(domain.slug), pathname);

          return (
            <li key={domain.slug} className="relative">
              <details
                name="sidebar-domain"
                open={isActive}
                className={cn(
                  "group transition-none group-data-collapsed/sidebar:transition-[visibility]",
                  RAIL_HIDDEN,
                )}
              >
                <summary
                  className={cn(
                    ITEM,
                    IDLE,
                    "text-sidebar-foreground cursor-pointer list-none text-title font-medium [&::-webkit-details-marker]:hidden",
                  )}
                >
                  <Icon
                    className="text-sidebar-muted-foreground size-5 shrink-0"
                    aria-hidden
                  />
                  <span className={LABEL}>{domain.name}</span>
                  <ChevronDown
                    className={cn(
                      "text-sidebar-muted-foreground size-4 shrink-0 transition-[rotate,opacity] group-open:rotate-180 group-data-collapsed/sidebar:opacity-0",
                      SIDEBAR_MOTION,
                    )}
                    aria-hidden
                  />
                </summary>

                <Fold>
                  <ul className="mt-1 mb-2 space-y-1">
                    {domain.children.map((leaf) => {
                      const href = menuHref(domain.slug, leaf.slug);
                      const isLeafActive = isTabActive(href, pathname);

                      return (
                        <li key={leaf.slug}>
                          <Link
                            href={href}
                            aria-current={isLeafActive ? "page" : undefined}
                            className={cn(
                              ITEM,
                              "pl-10.5 text-title",
                              isLeafActive
                                ? ACTIVE
                                : cn("text-sidebar-muted-foreground", IDLE),
                            )}
                          >
                            <span className="truncate">{leaf.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Fold>
              </details>

              <RailTip label={domain.name}>
                <button
                  type="button"
                  onClick={(event) =>
                    openFromRail(
                      event.currentTarget.parentElement?.querySelector(
                        "details",
                      ) as HTMLDetailsElement,
                      onExpand,
                    )
                  }
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    ITEM,
                    "invisible absolute inset-x-0 top-0 w-full cursor-pointer opacity-0 transition-[opacity,visibility,color,background-color]",
                    "pointer-events-none group-data-collapsed/sidebar:pointer-events-auto group-data-collapsed/sidebar:visible group-data-collapsed/sidebar:opacity-100",
                    SIDEBAR_MOTION,
                    isActive
                      ? ACTIVE
                      : cn("text-sidebar-muted-foreground bg-sidebar", IDLE),
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  <span className="sr-only">{domain.name}</span>
                </button>
              </RailTip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
