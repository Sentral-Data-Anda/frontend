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

const onRenderList = () =>
  render(
    <DataList<Row> items={rows} getKey={(row) => row.id} label="Daftar uji">
      {(row) => <DataListRow id={row.id} title={row.name} />}
    </DataList>,
  );

const rowOf = (name: string) =>
  screen.getByText(name).closest("li") as HTMLElement;

/**
 * Sorotan baris yang dibuka terakhir (list-state.md §2.4). Yang diuji di sini
 * bukan warnanya, melainkan dua hal yang membuatnya salah tanpa terlihat
 * salah: sorotan yang menempel di baris lain, dan penanda yang tidak pernah
 * dibuang sehingga baris itu tersorot lagi setiap kali daftar dibuka.
 */
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
