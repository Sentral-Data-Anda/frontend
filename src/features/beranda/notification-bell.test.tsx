import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { DUMMY_NOTIFICATIONS } from "./dummy";
import {
  countUnread,
  markAllRead,
  markRead,
  NotificationBell,
} from "./notification-bell";

afterEach(cleanup);

describe("state notifikasi", () => {
  test("markRead hanya menandai satu, tanpa mengubah daftar asal", () => {
    const [first] = DUMMY_NOTIFICATIONS;
    const next = markRead(DUMMY_NOTIFICATIONS, first.id);

    expect(next[0].isRead).toBe(true);
    expect(countUnread(next)).toBe(countUnread(DUMMY_NOTIFICATIONS) - 1);
    expect(DUMMY_NOTIFICATIONS[0].isRead).toBe(false);
  });

  test("markAllRead mengosongkan yang belum dibaca", () => {
    expect(countUnread(markAllRead(DUMMY_NOTIFICATIONS))).toBe(0);
  });
});

describe("NotificationBell", () => {
  const bell = () => screen.getByRole("button", { name: /^Notifikasi/ });
  const dot = () => screen.queryByTestId("unread-dot");

  test("titik hilang setelah semua notifikasi diketuk satu per satu", () => {
    render(<NotificationBell />);

    expect(bell().getAttribute("aria-label")).toBe(
      "Notifikasi, 2 belum dibaca",
    );
    expect(dot()).not.toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Persetujuan kas keluar/,
        hidden: true,
      }),
    );
    expect(bell().getAttribute("aria-label")).toBe(
      "Notifikasi, 1 belum dibaca",
    );
    expect(dot()).not.toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /Jadwal pelayan/, hidden: true }),
    );
    expect(bell().getAttribute("aria-label")).toBe(
      "Notifikasi, semua sudah dibaca",
    );
    expect(dot()).toBeNull();
  });

  test("tandai semua dibaca menghapus titik dan menonaktifkan tombolnya", () => {
    render(<NotificationBell />);

    const markAll = screen.getByRole("button", {
      name: "Tandai semua dibaca",
      hidden: true,
    });
    fireEvent.click(markAll);

    expect(dot()).toBeNull();
    expect(markAll.hasAttribute("disabled")).toBe(true);
  });
});
