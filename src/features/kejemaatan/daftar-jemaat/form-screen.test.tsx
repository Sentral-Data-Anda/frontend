import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

const actions: { current: MenuAction[] } = { current: [] };

// `usePathname`/`useSearchParams` ikut ditiru: `next/navigation` diganti
// seluruhnya, jadi apa pun yang dipakai pohon komponen ini harus ada.
mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/kejemaatan/daftar-jemaat/baru",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
  }),
}));

const { JemaatFormScreen } = await import("./form-screen");

afterEach(cleanup);

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    // `Toast.Provider` ikut dipasang karena di aplikasi ia hidup di
    // `providers.tsx`, di atas seluruh rute — pesan sukses harus selamat
    // melewati perpindahan ke daftar.
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <JemaatFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

/**
 * Gerbang rute, bukan hanya gerbang tombol (temuan Tech Lead atas `e1000f8`).
 *
 * Tombolnya memang sudah disembunyikan, tapi rutenya tetap bisa diketik.
 * be-sada tetap menolak saat simpan, jadi ini soal kapan penolakannya
 * datang — sebelum dua puluh field diisi, bukan sesudahnya.
 */
describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah jemaat")).toBeTruthy();
    expect(screen.queryByLabelText("Nama lengkap")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "JMT-0042");

    expect(screen.getByText("Tidak bisa mengubah jemaat")).toBeTruthy();
    expect(screen.queryByLabelText("Nama lengkap")).toBeNull();
  });

  test("dengan CREATE: form tambah dirender", () => {
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.getByLabelText("Nama lengkap")).toBeTruthy();
  });

  test("dengan UPDATE: form ubah dirender", () => {
    onRenderForm(["VIEW", "UPDATE"], "JMT-0042");

    expect(screen.getByLabelText("Nama lengkap")).toBeTruthy();
  });
});
