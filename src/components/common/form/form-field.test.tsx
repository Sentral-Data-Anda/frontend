import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useEffect } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import { FormField } from "./form-field";

afterEach(cleanup);

const onRenderField = (props: {
  error?: string;
  hint?: string;
  isRequired?: boolean;
}) =>
  render(
    <FormField label="Username" htmlFor="username" {...props}>
      <input />
    </FormField>,
  );

interface ZoneValues {
  typeJemaat: string;
  keluargaId: string;
}

// Aturan yang sama dipakai MembershipSection; impor lintas lapis ditolak lint.
const isZoneRequired = (values: { typeJemaat?: string; keluargaId?: string }) =>
  values.typeJemaat === "ANGGOTA" && !values.keluargaId;

interface HarnessPropTypes {
  formRef: { current?: UseFormReturn<ZoneValues> };
}

const ZoneHarness = (props: HarnessPropTypes) => {
  const { formRef } = props;

  const form = useForm<ZoneValues>({
    defaultValues: { typeJemaat: "", keluargaId: "" },
  });
  const values = useWatch({ control: form.control });

  useEffect(() => {
    formRef.current = form;
  }, [form, formRef]);

  return (
    <FormField
      label="Wilayah"
      htmlFor="zoneChurchId"
      isRequired={isZoneRequired(values)}
    >
      <input />
    </FormField>
  );
};

describe("FormField", () => {
  test("label tersambung ke kontrol lewat id yang diinjeksi", () => {
    onRenderField({});

    expect(screen.getByLabelText("Username").id).toBe("username");
  });

  test("tanpa galat: tidak ada aria-invalid maupun aria-describedby", () => {
    onRenderField({});

    const input = screen.getByLabelText("Username");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });

  test("dengan galat: aria-invalid dan aria-describedby menunjuk pesannya", () => {
    onRenderField({ error: "Username wajib diisi" });

    const input = screen.getByLabelText("Username");
    expect(input.getAttribute("aria-invalid")).toBe("true");

    const message = document.getElementById(
      input.getAttribute("aria-describedby") ?? "",
    );
    expect(message?.textContent).toBe("Username wajib diisi");
  });

  test("galat per-field TIDAK memakai role=alert", () => {
    onRenderField({ error: "Username wajib diisi" });

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("galat menggantikan petunjuk, bukan menumpuk di bawahnya", () => {
    onRenderField({ hint: "Minimal 8 karakter.", error: "Terlalu pendek" });

    expect(
      screen.getByLabelText("Username").getAttribute("aria-describedby"),
    ).toBe("username-error");
    expect(screen.queryByText("Minimal 8 karakter.")).toBeNull();
    expect(screen.getByText("Terlalu pendek")).toBeTruthy();
  });

  test("tanpa petunjuk dan galat, tidak ada elemen pesan sama sekali", () => {
    const { container } = onRenderField({});

    expect(container.querySelector("p")).toBeNull();
  });

  test("field wajib: bintang terlihat dan aria-required menandainya", () => {
    const { container } = onRenderField({ isRequired: true });

    expect(container.querySelector("label")?.textContent).toBe("Username");
    expect(screen.getByText("*").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("wajib")).toBeTruthy();
    expect(
      screen.getByLabelText("Username").getAttribute("aria-required"),
    ).toBe("true");
  });

  test("field biasa: tanpa bintang dan tanpa aria-required", () => {
    onRenderField({});

    expect(screen.queryByText("*")).toBeNull();
    expect(screen.queryByText("wajib")).toBeNull();
    expect(
      screen.getByLabelText("Username").getAttribute("aria-required"),
    ).toBeNull();
  });

  test("wilayah wajib hanya untuk Anggota yang belum masuk keluarga", () => {
    const formRef: { current?: UseFormReturn<ZoneValues> } = {};

    render(<ZoneHarness formRef={formRef} />);

    expect(screen.queryByText("*")).toBeNull();

    act(() => formRef.current?.setValue("typeJemaat", "ANGGOTA"));
    expect(screen.getByText("*")).toBeTruthy();
    expect(screen.getByLabelText("Wilayah").getAttribute("aria-required")).toBe(
      "true",
    );

    act(() => formRef.current?.setValue("keluargaId", "12"));
    expect(screen.queryByText("*")).toBeNull();
    expect(
      screen.getByLabelText("Wilayah").getAttribute("aria-required"),
    ).toBeNull();
  });
});
