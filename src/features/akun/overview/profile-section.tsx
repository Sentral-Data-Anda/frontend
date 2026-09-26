"use client";

import { Avatar, Panel } from "@/components/common/display";
import { useSession } from "@/features/auth";
import { formatDate } from "@/lib/format";
import {
  GENDER_LABEL,
  STATUS_JEMAAT_LABEL,
  STATUS_PERNIKAHAN_LABEL,
  TYPE_JEMAAT_LABEL,
} from "@/types/jemaat";

import { birthLabel, orDash, roleLabels } from "../model";

import { ProfileGroup } from "./profile-group";
import { ReadOnlyField } from "./read-only-field";

export const ProfileSection = () => {
  const session = useSession();
  const jemaat = session.jemaat;
  const name = jemaat?.name ?? session.username;
  const roles = roleLabels(jemaat?.roleJemaat);

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

      {jemaat ? (
        <>
          <ProfileGroup title="Data diri">
            <ReadOnlyField label="Nama lengkap" isStacked>
              {jemaat.name}
            </ReadOnlyField>
            <ReadOnlyField label="Jenis kelamin">
              {jemaat.gender ? GENDER_LABEL[jemaat.gender] : "—"}
            </ReadOnlyField>
            <ReadOnlyField label="Tempat, tanggal lahir" isStacked>
              {birthLabel(jemaat.birthPlace, jemaat.birthDate)}
            </ReadOnlyField>
            <ReadOnlyField label="Status pernikahan">
              {jemaat.statusMarital
                ? STATUS_PERNIKAHAN_LABEL[jemaat.statusMarital]
                : "—"}
            </ReadOnlyField>
          </ProfileGroup>

          <ProfileGroup title="Kontak">
            <ReadOnlyField label="No. HP">{orDash(jemaat.phone)}</ReadOnlyField>
            <ReadOnlyField label="Email" isStacked>
              {orDash(jemaat.email)}
            </ReadOnlyField>
            <ReadOnlyField label="Alamat" isStacked>
              {orDash(jemaat.address)}
            </ReadOnlyField>
          </ProfileGroup>

          <ProfileGroup title="Keanggotaan">
            <ReadOnlyField label="Kode jemaat">
              {orDash(jemaat.code)}
            </ReadOnlyField>
            <ReadOnlyField label="Tipe">
              {jemaat.typeJemaat ? TYPE_JEMAAT_LABEL[jemaat.typeJemaat] : "—"}
            </ReadOnlyField>
            <ReadOnlyField label="Status">
              {jemaat.statusJemaat
                ? STATUS_JEMAAT_LABEL[jemaat.statusJemaat]
                : "—"}
            </ReadOnlyField>
            <ReadOnlyField label="Bergabung">
              {jemaat.joinedAt ? formatDate(jemaat.joinedAt) : "—"}
            </ReadOnlyField>
            <ReadOnlyField label="Jabatan" isStacked>
              {roles.length ? roles.join("; ") : "—"}
            </ReadOnlyField>
          </ProfileGroup>

          <p className="text-muted-foreground border-hairline border-t px-gutter py-3 text-caption">
            Data diambil dari catatan jemaat. Bila keliru, hubungi sekretariat.
          </p>
        </>
      ) : (
        <p className="border-hairline text-muted-foreground border-t px-gutter py-3 text-body">
          Akun ini belum terhubung ke data jemaat.
        </p>
      )}
    </Panel>
  );
};
