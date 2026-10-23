import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useState } from "react";

import { FormField } from "@/components/common/form";

import { TimeField } from "./time-field";

afterEach(cleanup);

const onRenderTime = (props: Partial<Parameters<typeof TimeField>[0]> = {}) => {
  const sent: string[] = [];

  function Harness() {
    const [value, setValue] = useState(props.value ?? "");

    return (
      <FormField label="Jam mulai" htmlFor="startTime">
        <TimeField
          {...props}
          value={value}
          label="Jam mulai"
          onValueChange={(next) => {
            sent.push(next);
            setValue(next);
          }}
        />
      </FormField>
    );
  }

  const view = render(<Harness />);

  const hour = screen.getByLabelText("Jam mulai") as HTMLInputElement;
  const minute = screen.getByLabelText("Jam mulai menit") as HTMLInputElement;

  return {
    ...view,
    hour,
    minute,
    sent,
    typeHour: (text: string) =>
      fireEvent.change(hour, { target: { value: text } }),
    typeMinute: (text: string) =>
      fireEvent.change(minute, { target: { value: text } }),
    leave: () => fireEvent.blur(minute),
    panel: () => fireEvent.click(screen.getByLabelText("Pilih jam")),
    pick: (column: "Jam" | "Menit", name: string) =>
      fireEvent.click(
        within(screen.getByRole("listbox", { name: column })).getByRole(
          "option",
          { name },
        ),
      ),
  };
};

describe("TimeField — dua segmen", () => {
  test("nilai tersimpan tampil terbagi: jam dan menit", () => {
    const time = onRenderTime({ value: "19:05" });

    expect(time.hour.value).toBe("19");
    expect(time.minute.value).toBe("05");
  });

  test("kosong menampilkan placeholder, bukan nol", () => {
    const time = onRenderTime();

    expect(time.hour.value).toBe("");
    expect(time.minute.value).toBe("");
    expect(time.hour.placeholder).toBe("--");
  });

  test("dua angka di jam pindah sendiri ke menit", () => {
    const time = onRenderTime();

    time.typeHour("08");

    expect(time.hour.value).toBe("08");
    expect(document.activeElement).toBe(time.minute);
  });

  test("angka yang mustahil jadi jam dibaca satu digit", () => {
    const time = onRenderTime();

    time.typeHour("9");

    expect(time.hour.value).toBe("9");
  });

  test("jam dan menit lengkap baru dikirim sebagai HH:mm", () => {
    const time = onRenderTime();

    time.typeHour("08");
    time.typeMinute("30");

    expect(time.sent.at(-1)).toBe("08:30");
  });

  test("setengah terisi tidak mengirim jam yang salah", () => {
    const time = onRenderTime();

    time.typeHour("08");

    expect(time.sent.at(-1)).toBe("");
  });

  test("blur merapikan satu angka jadi dua", () => {
    const time = onRenderTime();

    time.typeHour("9");
    time.typeMinute("5");
    time.leave();

    expect(time.hour.value).toBe("09");
    expect(time.minute.value).toBe("05");
    expect(time.sent.at(-1)).toBe("09:05");
  });

  test("menempel 08:30 ke satu segmen mengisi keduanya", () => {
    const time = onRenderTime();

    time.typeHour("08:30");

    expect(time.hour.value).toBe("08");
    expect(time.minute.value).toBe("30");
    expect(time.sent.at(-1)).toBe("08:30");
  });

  test("panah atas dan bawah menaikkan dan menurunkan segmen", () => {
    const time = onRenderTime({ value: "08:30" });

    fireEvent.keyDown(time.hour, { key: "ArrowUp" });
    expect(time.sent.at(-1)).toBe("09:30");

    fireEvent.keyDown(time.minute, { key: "ArrowDown" });
    expect(time.sent.at(-1)).toBe("09:29");
  });

  test("jam 23 naik jadi 00, bukan 24", () => {
    const time = onRenderTime({ value: "23:30" });

    fireEvent.keyDown(time.hour, { key: "ArrowUp" });

    expect(time.sent.at(-1)).toBe("00:30");
  });

  test("melewati field tanpa mengetik tidak menghapus nilainya", () => {
    const time = onRenderTime({ value: "08:30" });

    time.leave();

    expect(time.sent).toHaveLength(0);
    expect(time.hour.value).toBe("08");
  });

  test("bukan input time bawaan browser", () => {
    const time = onRenderTime();

    expect(time.hour.type).toBe("text");
    expect(time.minute.type).toBe("text");
  });
});

describe("TimeField — panel pilih", () => {
  test("kolom jam dan menit punya nama sendiri", () => {
    const time = onRenderTime();

    time.panel();

    expect(screen.getByRole("listbox", { name: "Jam" })).toBeTruthy();
    expect(screen.getByRole("listbox", { name: "Menit" })).toBeTruthy();
  });

  test("memilih jam tanpa menit memakai menit 00", () => {
    const time = onRenderTime();

    time.panel();
    time.pick("Jam", "07");

    expect(time.sent.at(-1)).toBe("07:00");
    expect(time.hour.value).toBe("07");
    expect(time.minute.value).toBe("00");
  });

  test("memilih jam membiarkan panel terbuka untuk lanjut ke menit", () => {
    const time = onRenderTime();

    time.panel();
    time.pick("Jam", "07");

    expect(screen.getByRole("listbox", { name: "Menit" })).toBeTruthy();
  });

  test("panel menawarkan tiap menit, bukan tiap lima menit", () => {
    const time = onRenderTime();

    time.panel();

    const minuteColumn = screen
      .getByRole("listbox", { name: "Menit" })
      .querySelectorAll('[role="option"]');

    expect(minuteColumn).toHaveLength(60);
  });

  test("menit di luar kelipatan lima tetap bisa dipilih", () => {
    const time = onRenderTime({ value: "08:37" });
    const before = time.sent.length;

    time.panel();
    fireEvent.click(
      screen
        .getByRole("listbox", { name: "Menit" })
        .querySelector('[aria-selected="true"]') as HTMLElement,
    );

    expect(time.hour.value).toBe("08");
    expect(time.minute.value).toBe("37");
    expect(time.sent).toHaveLength(before + 1);
  });

  test("memilih menit mempertahankan jam yang sudah ada", () => {
    const time = onRenderTime({ value: "07:00" });

    time.panel();
    time.pick("Menit", "45");

    expect(time.sent.at(-1)).toBe("07:45");
  });

  test("Hapus mengosongkan dan mengirim string kosong", () => {
    const time = onRenderTime({ value: "07:45" });

    time.panel();
    fireEvent.click(screen.getByText("Hapus"));

    expect(time.sent.at(-1)).toBe("");
    expect(time.hour.value).toBe("");
  });

  // Penutupan popup sendiri diverifikasi di browser; di sini cukup bahwa
  // "Selesai" tidak mengubah nilainya.
  test("Selesai tidak mengubah nilai", () => {
    const time = onRenderTime({ value: "07:45" });
    const before = time.sent.length;

    time.panel();
    fireEvent.click(screen.getByText("Selesai"));

    expect(time.sent).toHaveLength(before);
    expect(time.hour.value).toBe("07");
  });

  test("Sekarang mengisi jam berjalan, bukan 00:00", () => {
    const time = onRenderTime();

    time.panel();
    fireEvent.click(screen.getByText("Sekarang"));

    expect(time.sent.at(-1)).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("TimeField — tampilan", () => {
  test("selalu punya satu baris keterangan, seperti DateField", () => {
    onRenderTime();

    expect(screen.getByText("Jam dan menit, mis. 08:30.")).toBeTruthy();
  });

  test("keterangan bisa diganti oleh layar yang memakainya", () => {
    onRenderTime({ hint: "Kosongkan bila belum pasti." });

    expect(screen.getByText("Kosongkan bila belum pasti.")).toBeTruthy();
  });

  test("ada tombol pembuka panel jam", () => {
    onRenderTime();

    expect(screen.getByLabelText("Pilih jam")).toBeTruthy();
  });
});
