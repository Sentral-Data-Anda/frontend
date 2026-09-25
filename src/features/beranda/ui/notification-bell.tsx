"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/common/control";
import { DataListRow } from "@/components/common/list";
import { BottomSheet } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";

import { DUMMY_NOTIFICATIONS, type Notification } from "../fixtures";

export const markRead = (list: Notification[], id: string): Notification[] =>
  list.map((item) => (item.id === id ? { ...item, isRead: true } : item));

export const markAllRead = (list: Notification[]): Notification[] =>
  list.map((item) => ({ ...item, isRead: true }));

export const countUnread = (list: Notification[]): number =>
  list.filter((item) => !item.isRead).length;

export function NotificationBell() {
  const isSheetOpen = useBoolean();

  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

  const unread = countUnread(notifications);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={isSheetOpen.onTrue}
        aria-haspopup="dialog"
        aria-label={
          unread > 0
            ? `Notifikasi, ${unread} belum dibaca`
            : "Notifikasi, semua sudah dibaca"
        }
        className="bg-card relative rounded-full border-0 shadow-sm"
      >
        <Bell aria-hidden />

        {unread > 0 ? (
          <span
            aria-hidden
            data-testid="unread-dot"
            className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full"
          />
        ) : null}
      </Button>

      <BottomSheet
        isOpen={isSheetOpen.value}
        title="Notifikasi"
        subtitle={unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
        onClose={isSheetOpen.onFalse}
      >
        <div className="flex justify-end px-gutter pb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={unread === 0}
            onClick={() => setNotifications(markAllRead)}
          >
            Tandai semua dibaca
          </Button>
        </div>

        <ul aria-label="Daftar notifikasi" className="divide-border divide-y">
          {notifications.map((item) => (
            <DataListRow
              key={item.id}
              className="relative"
              leading={
                <span
                  aria-hidden
                  className={`size-2 shrink-0 rounded-full ${item.isRead ? "" : "bg-primary"}`}
                />
              }
              title={
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((list) => markRead(list, item.id))
                  }
                  className="text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                >
                  {item.isRead ? null : (
                    <span className="sr-only">Belum dibaca: </span>
                  )}
                  {item.title}
                </button>
              }
              meta={`${item.timeLabel} · ${item.body}`}
            />
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
