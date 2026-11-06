import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { BottomSheet } from "./bottom-sheet";

afterEach(cleanup);

const isLocked = () =>
  /hidden|clip/.test(
    document.documentElement.style.overflowY ||
      document.body.style.overflowY ||
      "",
  );

describe("BottomSheet", () => {
  test("mengunci gulir halaman selama terbuka, lalu memulihkannya", async () => {
    const view = render(
      <BottomSheet isOpen title="Pilih tanggal" onClose={() => {}}>
        <p>Isi</p>
      </BottomSheet>,
    );

    await waitFor(() => expect(isLocked()).toBe(true));

    view.rerender(
      <BottomSheet isOpen={false} title="Pilih tanggal" onClose={() => {}}>
        <p>Isi</p>
      </BottomSheet>,
    );

    await waitFor(() => expect(isLocked()).toBe(false));
  });
});
