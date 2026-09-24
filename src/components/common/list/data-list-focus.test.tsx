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

/**
 * Balapan yang memakan sorotan setelah simpan (temuan Tech Lead atas
 * `e1000f8`, terukur 10 sampel `[data-focus]` nol semua).
 *
 * Urutannya: form menulis `list-focus` lalu berpindah; daftar ter-mount
 * dengan isi dari cache yang BELUM memuat baris baru; baris itu baru tiba
 * satu render kemudian setelah invalidasi selesai. Penanda yang dibuang pada
 * render pertama karena itu tidak pernah sempat dipakai — dan kegagalannya
 * tidak terlihat sebagai galat, hanya sebagai sorotan yang tidak muncul.
 */
describe("sorotan bertahan sampai barisnya benar-benar ada", () => {
  test("baris yang baru disimpan tetap tersorot walau tiba satu render kemudian", () => {
    window.sessionStorage.setItem(`list-focus:${LIST}`, "JMT-9001");

    const baru = { id: "JMT-9001", name: "Maria" };
    const { rerender } = onRenderList(rows);

    // Render pertama: barisnya belum ada, penanda TIDAK boleh dibuang.
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
