import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { Registration } from "../types";

import { PendaftaranListItemRow } from "./list-item";

afterEach(cleanup);

const ROW: Registration = {
  publicId: "p",
  code: "REG-2026-0005",
  participantName: "Fransiska Halim",
  participantPhone: "0812****0006",
  status: "CONFIRMED",
  createdAt: "2026-09-20T02:00:00.000Z",
  event: {
    id: 3,
    code: "EVN_0005-2026-0001",
    name: "Latihan Paduan Suara",
    startDate: "2026-10-01T00:00:00.000Z",
    endDate: "2026-10-01T00:00:00.000Z",
    startTime: "18:30",
    endTime: "20:30",
    isPaid: false,
    price: null,
  },
  jemaat: { publicId: "j", code: "JMT-0006", name: "Fransiska Halim" },
  payment: null,
};

describe("baris peserta", () => {
  test("jemaat: event + telepon tersamar, tautan ke halaman baca", () => {
    render(<PendaftaranListItemRow registration={ROW} />);

    expect(
      screen.getByText("Latihan Paduan Suara · 0812••••0006"),
    ).toBeTruthy();
    expect(screen.getByText("Terkonfirmasi")).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: "Lihat pendaftaran Fransiska Halim, Latihan Paduan Suara",
        })
        .getAttribute("href"),
    ).toBe("/kegiatan/pendaftaran-event/REG-2026-0005");
  });

  test("tamu: meta ditandai Tamu; telepon mentah tetap disamarkan", () => {
    render(
      <PendaftaranListItemRow
        registration={{
          ...ROW,
          participantName: "Maria Lumbantobing",
          participantPhone: "081299887766",
          status: "PENDING_PAYMENT",
          jemaat: null,
        }}
      />,
    );

    expect(
      screen.getByText("Latihan Paduan Suara · 0812••••7766 · Tamu"),
    ).toBeTruthy();
    expect(screen.getByText("Menunggu pembayaran")).toBeTruthy();
  });
});
