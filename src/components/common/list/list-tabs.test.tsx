import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { ListTabs } from "./list-tabs";

afterEach(cleanup);

const OPTIONS = [
  { value: "perawatan", label: "Perawatan" },
  { value: "pindah", label: "Pindah lokasi" },
  { value: "pelepasan", label: "Pelepasan" },
];

const renderTabs = (value: string, onValueChange = mock()) => {
  render(
    <ListTabs
      label="Jenis catatan"
      value={value}
      options={OPTIONS}
      onValueChange={onValueChange}
    />,
  );

  return onValueChange;
};

describe("ListTabs", () => {
  test("tablist bernama, tab terpilih aria-selected dan satu-satunya di urutan Tab", () => {
    renderTabs("pindah");

    expect(screen.getByRole("tablist", { name: "Jenis catatan" })).toBeTruthy();

    const selected = screen.getByRole("tab", { name: "Pindah lokasi" });
    expect(selected.getAttribute("aria-selected")).toBe("true");
    expect(selected.tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Perawatan" }).tabIndex).toBe(-1);
  });

  test("klik memanggil onValueChange dengan nilai tab", () => {
    const onValueChange = renderTabs("perawatan");

    fireEvent.click(screen.getByRole("tab", { name: "Pelepasan" }));

    expect(onValueChange).toHaveBeenCalledWith("pelepasan");
  });

  test("panah berputar di ujung, Home dan End ke tab pertama dan terakhir", () => {
    const onValueChange = renderTabs("pelepasan");
    const tablist = screen.getByRole("tablist");

    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenLastCalledWith("perawatan");

    fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenLastCalledWith("pindah");

    fireEvent.keyDown(tablist, { key: "Home" });
    expect(onValueChange).toHaveBeenLastCalledWith("perawatan");

    fireEvent.keyDown(tablist, { key: "End" });
    expect(onValueChange).toHaveBeenLastCalledWith("pelepasan");
  });

  test("tombol lain tidak memindah tab", () => {
    const onValueChange = renderTabs("perawatan");

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "Enter" });

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
