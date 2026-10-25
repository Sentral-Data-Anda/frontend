import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useForm } from "react-hook-form";

import { EMPTY_JEMAAT_FORM, type JemaatFormValues } from "../model";

import { RiwayatSection } from "./riwayat-fields";

afterEach(cleanup);

type AdditionalRow = JemaatFormValues["additional"][number];

const rowOf = (overrides: Partial<AdditionalRow> = {}): AdditionalRow => ({
  type: "",
  date: "",
  certificateNumber: "",
  place: "",
  ...overrides,
});

const Harness = (props: { rows: AdditionalRow[] }) => {
  const form = useForm<JemaatFormValues>({
    defaultValues: { ...EMPTY_JEMAAT_FORM, additional: props.rows },
  });

  return <RiwayatSection form={form} isDisabled={false} />;
};

// FieldLabel menaruh tanda wajibnya di luar <label>, sesudah nama field.
const isMarkedRequired = (name: string) => {
  const id = screen.getByLabelText(name).getAttribute("id");
  const label = document.querySelector(`label[for="${id}"]`);

  return Boolean(label?.parentElement?.textContent?.includes("wajib"));
};

describe("riwayat gerejawi — layar Tambah", () => {
  test("tiap baris menampilkan empat kolom berlabel dengan urutan yang sama", () => {
    render(<Harness rows={[rowOf()]} />);

    expect(screen.getByLabelText("Jenis baris 1")).toBeTruthy();
    expect(screen.getByLabelText("Tanggal baris 1")).toBeTruthy();
    expect(screen.getByLabelText("Tempat baris 1")).toBeTruthy();
    expect(screen.getByLabelText("Nomor surat baris 1")).toBeTruthy();
  });

  test("hanya jenis dan tanggal yang berasterisk", () => {
    render(<Harness rows={[rowOf()]} />);

    expect(isMarkedRequired("Jenis baris 1")).toBe(true);
    expect(isMarkedRequired("Tanggal baris 1")).toBe(true);
    expect(isMarkedRequired("Tempat baris 1")).toBe(false);
    expect(isMarkedRequired("Nomor surat baris 1")).toBe(false);
  });

  test("tambah menambah kartu dan hapus membuang kartu yang benar", () => {
    render(<Harness rows={[rowOf()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Tambah riwayat" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Hapus riwayat 1" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByLabelText("Jenis baris 1")).toBeTruthy();
  });

  test("jenis sekali seumur hidup tidak ditawarkan ke baris lain", async () => {
    render(<Harness rows={[rowOf({ type: "BAPTIS" }), rowOf()]} />);

    expect(
      screen.getByRole("combobox", { name: "Jenis baris 1" }).textContent,
    ).toContain("Baptis");

    fireEvent.click(screen.getByRole("combobox", { name: "Jenis baris 2" }));

    expect(await screen.findByRole("option", { name: "Sidi" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Baptis" })).toBeNull();
  });
});

describe("riwayat gerejawi — layar Ubah", () => {
  const SAVED = [
    rowOf({
      type: "BAPTIS",
      date: "1990-08-01",
      place: "GKI Bandung",
      certificateNumber: "B/12/1990",
    }),
    rowOf({ type: "SIDI", date: "2006-04-16" }),
  ];

  // Riwayat dulu punya layarnya sendiri; sekarang form ini satu-satunya tempat
  // menulisnya, jadi baris tersimpan harus datang sebagai kolom yang bisa
  // diubah, bukan teks baca-saja.
  test("menampilkan nilai tersimpan di kolom yang bisa diubah", () => {
    render(<Harness rows={SAVED} />);

    expect(
      screen.getByRole("combobox", { name: "Jenis baris 1" }).textContent,
    ).toContain("Baptis");
    expect(
      (screen.getByLabelText("Tanggal baris 1") as HTMLInputElement).value,
    ).toBe("01/08/1990");
    expect(
      (screen.getByLabelText("Tempat baris 1") as HTMLInputElement).value,
    ).toBe("GKI Bandung");
    expect(
      (screen.getByLabelText("Nomor surat baris 1") as HTMLInputElement).value,
    ).toBe("B/12/1990");
  });

  test("baris tersimpan bisa dihapus tanpa menyisakan teks baca-saja", () => {
    render(<Harness rows={SAVED} />);

    fireEvent.click(screen.getByRole("button", { name: "Hapus riwayat 1" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("combobox", { name: "Jenis baris 1" }).textContent,
    ).toContain("Sidi");
  });

  test("menambah baris baru di samping yang tersimpan", () => {
    render(<Harness rows={SAVED} />);

    fireEvent.click(screen.getByRole("button", { name: "Tambah riwayat" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByLabelText("Jenis baris 3")).toBeTruthy();
  });

  test("jemaat tanpa riwayat tetap bisa menambah baris pertama", () => {
    render(<Harness rows={[]} />);

    expect(
      screen.getByText(
        "Tambahkan baptis, sidi, atestasi, atau kedukaan bila suratnya ada.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tambah riwayat" })).toBeTruthy();
  });

  test("tidak ada lagi tautan ke layar Riwayat Jemaat", () => {
    render(<Harness rows={SAVED} />);

    expect(screen.queryByRole("link")).toBeNull();
  });
});
