import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { Avatar } from "./avatar";

afterEach(cleanup);

describe("Avatar", () => {
  test("orang: huruf pertama nama", () => {
    const { container } = render(<Avatar label="  budi" />);

    expect(container.textContent).toBe("B");
    expect(container.querySelector("svg")).toBeNull();
  });

  test("grup: ikon, bukan huruf nama", () => {
    const { container } = render(
      <Avatar label="Paduan Suara" variant="group" />,
    );

    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toBe("");
  });
});
