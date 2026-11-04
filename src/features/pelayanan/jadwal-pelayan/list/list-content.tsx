"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ListTabs } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess, useSession } from "@/features/auth";

import { JADWAL_PELAYAN_CREATE_PATH } from "../model";

import { KelolaJadwalPanel } from "./kelola-jadwal-panel";
import { TugasSayaPanel } from "./tugas-saya-panel";

type Tab = "tugas" | "kelola";

const TABS: readonly { value: Tab; label: string }[] = [
  { value: "tugas", label: "Tugas Saya" },
  { value: "kelola", label: "Kelola Jadwal" },
];

export const JadwalPelayanListContent = () => {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCanCreate } = useMenuAccess(MENU.JADWAL_PELAYAN);

  const isAdmin = session.roleUser.isAdmin;
  const isPelayan = session.isPelayan ?? false;
  const hasPosition = (session.jemaat?.roleJemaat ?? []).some(
    (role) => role.bapel !== null,
  );
  const canKelola = isAdmin || hasPosition;

  const tabs = canKelola
    ? TABS.filter((tab) => tab.value === "kelola" || isPelayan)
    : TABS.filter((tab) => tab.value === "tugas");

  const fallback: Tab =
    canKelola && (!isPelayan || isAdmin) ? "kelola" : "tugas";
  const requested = searchParams.get("tampilan");
  const tab =
    requested && tabs.some((item) => item.value === requested)
      ? (requested as Tab)
      : fallback;

  const onPickTab = (value: string) => {
    const url = new URLSearchParams(searchParams);

    if (value === "tugas") url.set("tampilan", "tugas");
    else url.delete("tampilan");

    const query = url.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Jadwal Pelayan"
        backHref={domainHref(MENU.PELAYANAN)}
        action={
          isCanCreate && canKelola ? (
            <PageHeaderAdd
              href={JADWAL_PELAYAN_CREATE_PATH}
              label="Tambah jadwal pelayan"
            />
          ) : null
        }
      />

      {tabs.length > 1 ? (
        <ListTabs
          label="Tampilan jadwal pelayan"
          value={tab}
          options={tabs}
          onValueChange={onPickTab}
        />
      ) : null}

      <div
        role="tabpanel"
        aria-label={tab === "tugas" ? "Tugas Saya" : "Kelola Jadwal"}
      >
        {tab === "tugas" ? <TugasSayaPanel /> : <KelolaJadwalPanel />}
      </div>
    </div>
  );
};
