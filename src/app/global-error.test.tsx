import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";

import GlobalError from "./global-error";

describe("GlobalError", () => {
  let reported: jest.Mock<(error: unknown) => void>;

  beforeEach(() => {
    reported = jest.fn();
    jest.spyOn(globalThis, "reportError").mockImplementation(reported);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it("menampilkan digest supaya bisa dicocokkan dengan log server", () => {
    const error = Object.assign(new Error("disamarkan"), { digest: "1a2b3c" });

    render(<GlobalError error={error} unstable_retry={() => {}} />);

    expect(screen.getByText("1a2b3c")).toBeDefined();
  });

  it("tidak menampilkan baris kode error bila tidak ada digest", () => {
    render(
      <GlobalError
        error={new Error("tanpa digest")}
        unstable_retry={() => {}}
      />,
    );

    expect(screen.queryByText(/Kode error/)).toBeNull();
  });

  it("tidak pernah membocorkan pesan error ke halaman", () => {
    const error = Object.assign(new Error("nama jemaat: Budi Santoso"), {
      digest: "1a2b3c",
    });

    render(<GlobalError error={error} unstable_retry={() => {}} />);

    expect(document.body.textContent).not.toContain("Budi Santoso");
  });

  it("melaporkan error lewat reportError agar tertangkap instrumentation-client", () => {
    const error = new Error("gagal");

    render(<GlobalError error={error} unstable_retry={() => {}} />);

    expect(reported).toHaveBeenCalledWith(error);
  });

  it("tombol pemulihan memanggil unstable_retry", () => {
    const retry = jest.fn();

    render(<GlobalError error={new Error("gagal")} unstable_retry={retry} />);
    screen.getByRole("button", { name: "Coba lagi" }).click();

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
