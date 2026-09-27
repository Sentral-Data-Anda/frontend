import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";
import { useState } from "react";

import type { UserCredential } from "../types";

import { CredentialDialog } from "./credential-dialog";

afterEach(cleanup);

const CREDENTIAL: UserCredential = {
  name: "Andreas Sitanggang",
  username: "A-0001",
  password: "Sada-qv9t97",
};

interface PropTypes {
  onDone: () => void;
}

const Harness = (props: PropTypes) => {
  const { onDone } = props;
  const [credential, setCredential] = useState<UserCredential | null>(
    CREDENTIAL,
  );

  return (
    <CredentialDialog
      title="Akun berhasil dibuat"
      credential={credential}
      onDone={() => {
        setCredential(null);
        onDone();
      }}
    />
  );
};

describe("dialog kredensial", () => {
  test("satu tombol Selesai; nama, username, password tampil", () => {
    render(<Harness onDone={mock()} />);

    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["Salin", "Selesai"]);
    expect(screen.getByText(CREDENTIAL.name)).toBeTruthy();
    expect(screen.getByText(CREDENTIAL.username)).toBeTruthy();
    expect(screen.getByText(CREDENTIAL.password)).toBeTruthy();
  });

  test("Escape juga menyelesaikan dan membuang password", async () => {
    const onDone = mock();
    render(<Harness onDone={onDone} />);

    await act(async () =>
      fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" }),
    );

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(CREDENTIAL.password)).toBeNull();
  });

  test("clipboard ditolak: password terpilih supaya bisa disalin manual", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mock(async () => Promise.reject(new Error("no"))) },
      configurable: true,
    });
    render(<Harness onDone={mock()} />);

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Salin" })),
    );

    expect(window.getSelection()?.toString()).toBe(CREDENTIAL.password);
    expect(screen.queryByRole("button", { name: "Tersalin" })).toBeNull();
  });
});
