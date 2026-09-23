"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

import { BottomSheet } from "@/components/common/bottom-sheet";
import { Button } from "@/components/common/button";
import { DataListRow } from "@/components/common/data-list";
import { useBoolean } from "@/hooks/use-boolean";

import { DUMMY_NOTIFICATIONS, type Notification } from "../fixtures";

export const markRead = (list: Notification[], id: string): Notification[] =>
  list.map((item) => (item.id === id ? { ...item, isRead: true } : item));

export const markAllRead = (list: Notification[]): Notification[] =>
  list.map((item) => ({ ...item, isRead: true }));

export const countUnread = (list: Notification[]): number =>
  list.filter((item) => !item.isRead).length;

/**
 * Lonceng + daftar notifikasi. DUMMY — lihat `dummy.ts`; pemanggil wajib
 * memeriksa `SHOW_DUMMY`. State hanya di client, jadi "terbaca" hilang saat
 * halaman dimuat ulang.
 */
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
                // Tombol direntangkan ke seluruh baris lewat `after:`, supaya
                // seluruh 56px bisa diketuk tanpa membungkus `<li>`.
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
