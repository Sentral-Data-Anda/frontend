import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { LoadingDataList } from "./loading-list";

afterEach(cleanup);

const TABLE = {
  columns: [{ key: "name", header: "Nama", width: "1fr" }],
};

const AVATAR = "span.size-9.rounded-full";
const TRAILING = "span.w-20";

const mobileOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("div.md\\:hidden") as HTMLElement;

describe("LoadingDataList shape pada cabang tabel", () => {
  test("trailing: tanpa bulatan avatar, dengan batang di ujung", () => {
    const { container } = render(
      <LoadingDataList table={TABLE} shape="trailing" />,
    );
    const mobile = mobileOf(container);

    expect(mobile.querySelectorAll(AVATAR).length).toBe(0);
    expect(mobile.querySelectorAll(TRAILING).length).toBe(6);
  });

  test("plain: tanpa avatar dan tanpa batang", () => {
    const { container } = render(
      <LoadingDataList table={TABLE} shape="plain" />,
    );
    const mobile = mobileOf(container);

    expect(mobile.querySelectorAll(AVATAR).length).toBe(0);
    expect(mobile.querySelectorAll(TRAILING).length).toBe(0);
  });

  test("tanpa shape: avatar (bawaan untuk baris berfoto)", () => {
    const { container } = render(<LoadingDataList table={TABLE} />);

    expect(mobileOf(container).querySelectorAll(AVATAR).length).toBe(6);
  });
});
