"use client";

import { Button } from "@/components/common/control";
import { formatDate } from "@/lib/format";
import {
  GENDER_LABEL,
  STATUS_JEMAAT_LABEL,
  STATUS_PERNIKAHAN_LABEL,
  TYPE_JEMAAT_LABEL,
} from "@/types/jemaat";

import { useMyProfile } from "../api";
import { addressLabel, birthLabel, orDash } from "../model";

import { ProfileGroup } from "./profile-group";
import { ReadOnlyField } from "./read-only-field";

interface PropTypes {
  code: string | undefined;
  roles: string[];
}

export const ProfileDetails = (props: PropTypes) => {
  const { code, roles } = props;

  const profile = useMyProfile();
  const data = profile.data;

  if (profile.isPending) {
    return (
      <div
        aria-busy
        aria-label="Memuat profil"
        className="border-hairline space-y-3 border-t px-gutter py-4"
      >
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex justify-between gap-4">
            <span className="bg-skeleton block h-3 w-24 animate-pulse rounded" />
            <span className="bg-skeleton block h-3 w-32 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (profile.isError || !data) {
    return (
      <div className="border-hairline flex items-center justify-between gap-3 border-t px-gutter py-3">
        <p className="text-muted-foreground text-body">
          {profile.isError
            ? "Data pribadi gagal dimuat."
            : "Akun ini belum terhubung ke data jemaat."}
        </p>

        {profile.isError ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void profile.refetch()}
          >
            Coba lagi
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <ProfileGroup title="Data diri">
        <ReadOnlyField label="Jenis kelamin">
          {GENDER_LABEL[data.gender]}
        </ReadOnlyField>
        <ReadOnlyField label="Tempat, tanggal lahir" isStacked>
          {birthLabel(data.birthPlace, data.birthDate)}
        </ReadOnlyField>
        <ReadOnlyField label="Status pernikahan">
          {data.statusMarital
            ? STATUS_PERNIKAHAN_LABEL[data.statusMarital]
            : "—"}
        </ReadOnlyField>
      </ProfileGroup>

      <ProfileGroup title="Kontak">
        <ReadOnlyField label="No. HP">{orDash(data.phone)}</ReadOnlyField>
        <ReadOnlyField label="Email" isStacked>
          {orDash(data.email)}
        </ReadOnlyField>
        <ReadOnlyField label="Alamat" isStacked>
          {addressLabel(data)}
        </ReadOnlyField>
      </ProfileGroup>

      <ProfileGroup title="Keanggotaan">
        <ReadOnlyField label="Kode jemaat">{orDash(code)}</ReadOnlyField>
        <ReadOnlyField label="Tipe">
          {TYPE_JEMAAT_LABEL[data.typeJemaat]}
        </ReadOnlyField>
        <ReadOnlyField label="Status">
          {STATUS_JEMAAT_LABEL[data.statusJemaat]}
        </ReadOnlyField>
        <ReadOnlyField label="Wilayah">
          {orDash(data.zoneChurch?.name)}
        </ReadOnlyField>
        <ReadOnlyField label="Bergabung">
          {data.joinedAt ? formatDate(data.joinedAt) : "—"}
        </ReadOnlyField>
        <ReadOnlyField label="Jabatan" isStacked>
          {roles.length ? roles.join("; ") : "—"}
        </ReadOnlyField>
      </ProfileGroup>

      <p className="text-muted-foreground border-hairline border-t px-gutter py-3 text-caption">
        Data diambil dari catatan jemaat. Bila keliru, hubungi sekretariat.
      </p>
    </>
  );
};
