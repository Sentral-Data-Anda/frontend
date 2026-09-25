import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

const LIST = "/kejemaatan/daftar-jemaat";

mock.module("next/navigation", () => ({ usePathname: () => LIST }));

const { DataList, DataListRow } = await import("./data-list");

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

type Row = { id: string; name: string };

const rows: Row[] = [
  { id: "JMT-0001", name: "Andreas" },
  { id: "JMT-0002", name: "Bethari" },
];

const onRenderList = (items: Row[] = rows) =>
  render(
    <DataList<Row> items={items} getKey={(row) => row.id} label="Daftar uji">
      {(row) => <DataListRow id={row.id} title={row.name} />}
    </DataList>,
  );

const rowOf = (name: string) =>
  screen.getByText(name).closest("li") as HTMLElement;

describe("sorotan baris terakhir", () => {
  test("menyorot baris pada list-focus, dan hanya baris itu", () => {
    window.sessionStorage.setItem(`list-focus:${LIST}`, "JMT-0002");

    onRenderList();

    expect(rowOf("Bethari").dataset.focus).toBe("");
    expect(rowOf("Andreas").dataset.focus).toBeUndefined();
  });

  test("penandanya dibaca sekali lalu dibuang", () => {
    window.sessionStorage.setItem(`list-focus:${LIST}`, "JMT-0002");

    onRenderList();
    cleanup();
    onRenderList();

    expect(window.sessionStorage.getItem(`list-focus:${LIST}`)).toBeNull();
    expect(rowOf("Bethari").dataset.focus).toBeUndefined();
  });

  test("sorotan dilepas saat animasinya selesai", () => {
    window.sessionStorage.setItem(`list-focus:${LIST}`, "JMT-0001");

    onRenderList();

    const row = rowOf("Andreas");

    act(() => {
      row.dispatchEvent(new Event("animationend"));
    });

    expect(row.dataset.focus).toBeUndefined();
  });

  test("tanpa penanda, tidak ada yang disorot", () => {
    onRenderList();

    expect(rowOf("Andreas").dataset.focus).toBeUndefined();
    expect(rowOf("Bethari").dataset.focus).toBeUndefined();
  });
});

describe("sorotan bertahan sampai barisnya benar-benar ada", () => {
  test("baris yang baru disimpan tetap tersorot walau tiba satu render kemudian", () => {
    window.sessionStorage.setItem(`list-focus:${LIST}`, "JMT-9001");

    const baru = { id: "JMT-9001", name: "Maria" };
    const { rerender } = onRenderList(rows);

    expect(window.sessionStorage.getItem(`list-focus:${LIST}`)).toBe(
      "JMT-9001",
    );

    rerender(
      <DataList<Row>
        items={[baru, ...rows]}
        getKey={(row) => row.id}
        label="Daftar uji"
      >
        {(row) => <DataListRow id={row.id} title={row.name} />}
      </DataList>,
    );

    expect(rowOf("Maria").dataset.focus).toBe("");
    expect(window.sessionStorage.getItem(`list-focus:${LIST}`)).toBeNull();
  });
});
