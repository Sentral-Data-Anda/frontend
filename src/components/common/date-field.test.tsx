import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useState } from "react";

import { DateField } from "./date-field";
import { FormField } from "./form-field";

afterEach(cleanup);

/**
 * Pembungkus TERKENDALI SUNGGUHAN.
 *
 * Bukan sekadar variabel yang dicatat: sejak teks kotak diturunkan dari
 * `value`, harness yang tidak pernah merender ulang akan menguji komponen
 * dalam keadaan yang tidak pernah terjadi di aplikasi — dan itu persis
 * bagaimana enam test sempat lulus atas perilaku yang salah.
 */
const onRenderDate = (props: Partial<Parameters<typeof DateField>[0]> = {}) => {
  const sent: string[] = [];

  function Harness() {
    const [value, setValue] = useState(props.value ?? "");

    return (
      <FormField label="Tanggal lahir" htmlFor="birthDate">
        <DateField
          {...props}
          value={value}
          label="Tanggal lahir"
          onValueChange={(next) => {
            sent.push(next);
            setValue(next);
          }}
        />
      </FormField>
    );
  }

  const view = render(<Harness />);

  const box = screen.getByLabelText("Tanggal lahir") as HTMLInputElement;

  return {
    ...view,
    box,
    sent,
    type: (text: string) => fireEvent.change(box, { target: { value: text } }),
    leave: () => fireEvent.blur(box),
  };
};

describe("DateField — jalur ketik (§7.10 no. 4)", () => {
  test("blur menormalkan ke dd/mm/yyyy dan mengirim YYYY-MM-DD", () => {
    const date = onRenderDate();

    date.type("1/5/1990");
    date.leave();

    expect(date.box.value).toBe("01/05/1990");
    expect(date.sent.at(-1)).toBe("1990-05-01");
  });

  test.each([
    ["12/05/1990"],
    ["12-05-1990"],
    ["12 05 1990"],
    ["12.05.1990"],
    ["12051990"],
  ])("%s diterima dan dinormalkan", (input) => {
    const date = onRenderDate();

    date.type(input);
    date.leave();

    expect(date.box.value).toBe("12/05/1990");
    expect(date.sent.at(-1)).toBe("1990-05-12");
  });

  test("nilai dari luar (mode ubah) tampil sebagai dd/mm/yyyy", () => {
    const date = onRenderDate({ value: "1990-05-12" });

    expect(date.box.value).toBe("12/05/1990");
  });

  test("dikosongkan: nilai form jadi string kosong, bukan null", () => {
    const date = onRenderDate({ value: "1990-05-12" });

    date.type("");
    date.leave();

    expect(date.sent.at(-1)).toBe("");
  });
});

describe("DateField — galat (§7.7, §7.10 no. 3 & 10)", () => {
  test("tahun dua digit: pesan tahun, dan nilai form dikosongkan", () => {
    const date = onRenderDate();

    date.type("12/05/90");
    date.leave();

    expect(screen.getByText("Tulis empat angka, mis. 1990.")).toBeTruthy();
    expect(date.sent.at(-1)).toBe("");
  });

  test("tanggal yang tidak ada: pesan yang berbeda", () => {
    const date = onRenderDate();

    date.type("31/02/1990");
    date.leave();

    expect(
      screen.getByText("Tanggal tidak ada. Contoh: 12/05/1990."),
    ).toBeTruthy();
  });

  test("masa depan ditolak dengan menyebut nama fieldnya", () => {
    const date = onRenderDate({ max: "2026-09-23" });

    date.type("01/01/2030");
    date.leave();

    expect(
      screen.getByText("Tanggal lahir tidak boleh di masa depan."),
    ).toBeTruthy();
  });

  test("sebelum batas bawah ditolak", () => {
    const date = onRenderDate({ min: "1900-01-01" });

    date.type("31/12/1899");
    date.leave();

    expect(
      screen.getByText("Tanggal lahir sebelum 1900 tidak bisa disimpan."),
    ).toBeTruthy();
  });

  /**
   * Isi kotak TIDAK dinormalkan saat salah: user harus melihat yang ia ketik
   * untuk bisa membetulkannya. Menormalkan yang salah berarti menghapus jejak
   * kesalahannya.
   */
  test("teks yang salah dibiarkan apa adanya", () => {
    const date = onRenderDate();

    date.type("31/02/1990");
    date.leave();

    expect(date.box.value).toBe("31/02/1990");
  });

  test("galat hilang begitu ketikannya benar (§7.10 no. 10)", () => {
    const date = onRenderDate();

    date.type("31/02/1990");
    date.leave();
    expect(screen.queryByText(/Tanggal tidak ada/)).toBeTruthy();

    date.type("28/02/1990");

    expect(screen.queryByText(/Tanggal tidak ada/)).toBeNull();
    expect(date.sent.at(-1)).toBe("1990-02-28");
  });

  test("mengetik tidak memerahkan apa pun sebelum pernah salah", () => {
    const date = onRenderDate();

    date.type("3");

    expect(screen.queryByText(/Tanggal tidak ada/)).toBeNull();
  });
});

describe("DateField — baris konfirmasi (§7.3, §7.10 no. 10)", () => {
  test("mengeja ulang tanggal dalam bentuk yang tidak bisa salah dibaca", () => {
    const date = onRenderDate({ value: "1990-05-12" });

    expect(screen.getByText(/12 Mei 1990 · Sabtu/)).toBeTruthy();
    expect(date.box.value).toBe("12/05/1990");
  });

  test("varian lahir menambah umur; varian dekat tidak", () => {
    onRenderDate({ value: "1990-05-12", variant: "lahir" });
    expect(screen.getByText(/tahun/)).toBeTruthy();

    cleanup();

    onRenderDate({ value: "1990-05-12", variant: "dekat" });
    expect(screen.queryByText(/tahun/)).toBeNull();
  });

  test("hilang saat galat, kembali saat nilainya sah lagi", () => {
    const date = onRenderDate({ value: "1990-05-12" });

    expect(screen.queryByText(/12 Mei 1990/)).toBeTruthy();

    date.type("31/02/1990");
    date.leave();
    expect(screen.queryByText(/12 Mei 1990/)).toBeNull();

    date.type("12/05/1990");
    date.leave();
    expect(screen.queryByText(/12 Mei 1990/)).toBeTruthy();
  });

  test("kosong: tidak ada baris konfirmasi maupun galat", () => {
    onRenderDate();

    expect(screen.queryByText(/·/)).toBeNull();
    expect(screen.queryByText(/Tanggal tidak ada/)).toBeNull();
  });
});
