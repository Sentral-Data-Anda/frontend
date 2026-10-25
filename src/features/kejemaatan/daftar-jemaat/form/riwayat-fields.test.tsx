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

const Harness = (props: { isEdit: boolean; rows: AdditionalRow[] }) => {
  const form = useForm<JemaatFormValues>({
    defaultValues: { ...EMPTY_JEMAAT_FORM, additional: props.rows },
  });

  return (
    <RiwayatSection form={form} isDisabled={false} isEdit={props.isEdit} />
  );
};

// FieldLabel menaruh tanda wajibnya di luar <label>, sesudah nama field.
const isMarkedRequired = (name: string) => {
  const id = screen.getByLabelText(name).getAttribute("id");
  const label = document.querySelector(`label[for="${id}"]`);

  return Boolean(label?.parentElement?.textContent?.includes("wajib"));
};

describe("riwayat gerejawi — layar Tambah", () => {
  test("tiap baris menampilkan empat kolom berlabel dengan urutan yang sama", () => {
    render(<Harness isEdit={false} rows={[rowOf()]} />);

    expect(screen.getByLabelText("Jenis baris 1")).toBeTruthy();
    expect(screen.getByLabelText("Tanggal baris 1")).toBeTruthy();
    expect(screen.getByLabelText("Tempat baris 1")).toBeTruthy();
    expect(screen.getByLabelText("Nomor surat baris 1")).toBeTruthy();
  });

  test("hanya jenis dan tanggal yang berasterisk", () => {
    render(<Harness isEdit={false} rows={[rowOf()]} />);

    expect(isMarkedRequired("Jenis baris 1")).toBe(true);
    expect(isMarkedRequired("Tanggal baris 1")).toBe(true);
    expect(isMarkedRequired("Tempat baris 1")).toBe(false);
    expect(isMarkedRequired("Nomor surat baris 1")).toBe(false);
  });

  test("tambah menambah kartu dan hapus membuang kartu yang benar", () => {
    render(<Harness isEdit={false} rows={[rowOf()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Tambah riwayat" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Hapus riwayat 1" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByLabelText("Jenis baris 1")).toBeTruthy();
  });

  test("jenis sekali seumur hidup tidak ditawarkan ke baris lain", async () => {
    render(
      <Harness isEdit={false} rows={[rowOf({ type: "BAPTIS" }), rowOf()]} />,
    );

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

  test("empat kolom yang sama, terisi nilai terbaca tanpa diringkas", () => {
    render(<Harness isEdit rows={SAVED} />);

    expect(screen.getByLabelText("Jenis baris 1").textContent).toBe("Baptis");
    expect(screen.getByLabelText("Tanggal baris 1").textContent).toBe(
      "1 Agustus 1990",
    );
    expect(screen.getByLabelText("Tempat baris 1").textContent).toBe(
      "GKI Bandung",
    );
    expect(screen.getByLabelText("Nomor surat baris 1").textContent).toBe(
      "B/12/1990",
    );
  });

  test("kolom kosong tetap tampil sebagai — supaya susunannya tidak bergeser", () => {
    render(<Harness isEdit rows={SAVED} />);

    expect(screen.getByLabelText("Tempat baris 2").textContent).toBe("—");
    expect(screen.getByLabelText("Nomor surat baris 2").textContent).toBe("—");
  });

  test("tidak ada kontrol yang bisa difokus, ditambah, diubah, atau dihapus", () => {
    render(<Harness isEdit rows={SAVED} />);

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("Tambah riwayat")).toBeNull();
  });

  test("kartu, nomor urut, dan state kosong memakai komponen daftar yang sama", () => {
    render(<Harness isEdit rows={[]} />);

    expect(screen.queryByRole("list")).toBeNull();
    expect(
      screen.getByText("Belum ada riwayat baptis, sidi, atau atestasi."),
    ).toBeTruthy();
  });

  test("paragraf penaut ke layar Riwayat Jemaat tetap ada", () => {
    render(<Harness isEdit rows={SAVED} />);

    expect(
      screen.getByRole("link", { name: "layar Riwayat Jemaat" }),
    ).toBeTruthy();
    expect(screen.getByRole("list", { name: "Riwayat gerejawi" })).toBeTruthy();
  });
});
