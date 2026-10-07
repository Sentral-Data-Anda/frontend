import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { RoomBooking } from "../types";

import { ScheduleRow } from "./schedule-row";

afterEach(cleanup);

const row = (item: Partial<RoomBooking>) =>
  render(
    <ul>
      <ScheduleRow
        isClash={false}
        item={{
          kind: "EVENT",
          code: "EVT-1",
          name: "Retret",
          startTime: "09:00",
          endTime: "23:59",
          bapel: null,
          ...item,
        }}
      />
    </ul>,
  );

describe("ScheduleRow", () => {
  test("event ber-23.59 tampil mulai, bukan jam selesai karangan", () => {
    row({});

    expect(screen.getByText("mulai 09.00")).toBeTruthy();
    expect(screen.queryByText(/23[.:]59/)).toBeNull();
  });

  test("peminjaman yang sungguh selesai 23.59 tetap tampil apa adanya", () => {
    row({ kind: "LOAN", endTime: "23:59" });

    expect(screen.getByText("09.00–23.59")).toBeTruthy();
  });
});
