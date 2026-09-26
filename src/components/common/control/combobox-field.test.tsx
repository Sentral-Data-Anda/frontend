import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { useEffect } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import { FIRST_INVALID, revealField } from "@/lib/form-error";

import { ComboboxField } from "./combobox-field";

afterEach(cleanup);

const SavingForm = ({ field }: { field: string }) => {
  const isBusy = useBoolean(true);

  useEffect(() => {
    if (!isBusy.value) revealField(field);
  }, [isBusy.value, field]);

  return (
    <form>
      <button type="button" onClick={isBusy.onFalse}>
        Selesai
      </button>

      <fieldset disabled={isBusy.value}>
        <ComboboxField
          id="jemaat"
          value=""
          onValueChange={() => {}}
          options={[{ value: "1", label: "Budi" }]}
          disabled={isBusy.value}
          aria-invalid
        />
      </fieldset>
    </form>
  );
};

describe("ComboboxField sesudah simpan ditolak", () => {
  test.each([
    ["galat klien (FIRST_INVALID)", FIRST_INVALID],
    ["galat server (id field)", "jemaat"],
  ])("%s: fokus masuk ke input pada render yang sama", (_, field) => {
    render(<SavingForm field={field} />);
    screen.getByRole("combobox").scrollIntoView = () => {};

    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));

    expect(document.activeElement?.id).toBe("jemaat");
  });
});
