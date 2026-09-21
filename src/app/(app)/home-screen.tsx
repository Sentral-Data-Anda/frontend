"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { MENU_ICON, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";

/**
 * Beranda sementara.
 *
 * Mockup menampilkan kartu kas gabungan, pemasukan, pengeluaran, dan grafik
 * persembahan enam minggu. Angka-angka itu belum punya endpoint agregat di
 * be-sada — `/api/v1/report` hanya berisi tujuh laporan jemaat — jadi layar
 * ini berisi pintasan saja sampai Fase 6, ketika keputusan endpointnya
 * diambil. Merakitnya dari belasan panggilan di FE akan lambat dan boros, dan
 * mengganti perakitan itu dengan satu endpoint nanti berarti membuang
 * pekerjaannya.
 */
export function HomeScreen() {
  const session = useSession();

  const greeting = session.jemaat?.name ?? session.username;

  // Delapan pintasan pertama, sesuai mockup. Sisanya lewat "Tampilkan semua".
  const shortcuts = session.menu.slice(0, 8);

  return (
    <div className="pb-6">
      <PageHeader
        title={`Selamat datang, ${greeting}`}
        subtitle={session.roleUser.name}
      />

      <section className="px-gutter">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-title font-medium">Aksi cepat</h2>

          <Link href="/modul" className="text-muted-foreground text-caption">
            Tampilkan semua
          </Link>
        </div>

        <ul className="grid grid-cols-4 gap-3">
          {shortcuts.map((domain) => {
            const Icon = MENU_ICON[domain.slug];
            const firstLeaf = domain.children[0];

            return (
              <li key={domain.publicId}>
                <Link
                  href={
                    firstLeaf ? menuHref(domain.slug, firstLeaf.slug) : "/modul"
                  }
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <span className="bg-muted flex size-12 items-center justify-center rounded-xl">
                    {Icon ? <Icon className="size-5" aria-hidden /> : null}
                  </span>

                  <span className="text-caption leading-tight">
                    {domain.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 px-gutter">
        <h2 className="mb-3 text-title font-medium">Semua modul</h2>

        <Link
          href="/modul"
          className="border-border flex h-14 items-center justify-between rounded-xl border px-3.5"
        >
          <span className="text-body">
            {session.menu.length} domain ·{" "}
            {session.menu.reduce(
              (total, domain) => total + domain.children.length,
              0,
            )}{" "}
            layar
          </span>

          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
