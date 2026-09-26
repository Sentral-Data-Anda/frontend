"use client";

import { Avatar, Panel } from "@/components/common/display";
import { useSession } from "@/features/auth";

import { roleLabels } from "../model";

import { ReadOnlyField } from "./read-only-field";

export const ProfileSection = () => {
  const session = useSession();
  const name = session.jemaat?.name ?? session.username;
  const roles = roleLabels(session.jemaat?.roleJemaat);

  return (
    <Panel label="Profil">
      <div className="flex items-center gap-3 px-gutter py-4">
        <Avatar label={name} />
        <div className="min-w-0">
          <p className="truncate text-title font-semibold">{name}</p>
          <p className="text-muted-foreground truncate text-body">
            {session.roleUser.name} · {session.username}
          </p>
        </div>
      </div>

      <dl className="border-hairline divide-hairline divide-y border-t px-gutter">
        <ReadOnlyField label="Kode jemaat">
          {session.jemaat?.code ?? "—"}
        </ReadOnlyField>
        <ReadOnlyField label="Jabatan">
          {roles.length ? roles.join("; ") : "—"}
        </ReadOnlyField>
      </dl>

      <p className="text-muted-foreground border-hairline border-t px-gutter py-3 text-caption">
        Data diambil dari catatan jemaat. Bila keliru, hubungi sekretariat.
      </p>
    </Panel>
  );
};
