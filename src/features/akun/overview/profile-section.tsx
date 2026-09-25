"use client";

import { Avatar } from "@/components/common/display";
import { FormSection, FormWide } from "@/components/common/form";
import { useSession } from "@/features/auth";

import { roleLabels } from "../model";

import { ReadOnlyField } from "./read-only-field";

export const ProfileSection = () => {
  const session = useSession();
  const name = session.jemaat?.name ?? session.username;
  const roles = roleLabels(session.jemaat?.roleJemaat);

  return (
    <FormSection
      isReadOnly
      legend="Profil"
      note="Diambil dari data jemaat. Bila ada yang keliru, hubungi sekretariat."
    >
      <FormWide className="flex items-center gap-3">
        <Avatar label={name} />
        <div className="min-w-0">
          <p className="truncate text-title font-semibold">{name}</p>
          <p className="text-muted-foreground truncate text-body">
            {session.roleUser.name}
          </p>
        </div>
      </FormWide>

      <ReadOnlyField label="Username">{session.username}</ReadOnlyField>
      <ReadOnlyField label="Kode jemaat">
        {session.jemaat?.code ?? "—"}
      </ReadOnlyField>
      <ReadOnlyField label="Peran pengguna">
        {session.roleUser.name}
      </ReadOnlyField>
      <ReadOnlyField label="Jabatan">
        {roles.length ? roles.join("; ") : "—"}
      </ReadOnlyField>
    </FormSection>
  );
};
