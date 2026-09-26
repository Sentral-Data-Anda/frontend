"use client";

import { Button } from "@/components/common/control";
import { DescriptionItem } from "@/components/common/display";
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

export const ProfileDetails = () => {
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
        <DescriptionItem label="Jenis kelamin">
          {GENDER_LABEL[data.gender]}
        </DescriptionItem>
        <DescriptionItem label="Tempat, tanggal lahir" isStacked>
          {birthLabel(data.birthPlace, data.birthDate)}
        </DescriptionItem>
        <DescriptionItem label="Status pernikahan">
          {data.statusMarital
            ? STATUS_PERNIKAHAN_LABEL[data.statusMarital]
            : "—"}
        </DescriptionItem>
      </ProfileGroup>

      <ProfileGroup title="Kontak">
        <DescriptionItem label="No. HP">{orDash(data.phone)}</DescriptionItem>
        <DescriptionItem label="Email" isStacked>
          {orDash(data.email)}
        </DescriptionItem>
        <DescriptionItem label="Alamat" isStacked isWide>
          {addressLabel(data)}
        </DescriptionItem>
      </ProfileGroup>

      <ProfileGroup title="Keanggotaan">
        <DescriptionItem label="Tipe">
          {TYPE_JEMAAT_LABEL[data.typeJemaat]}
        </DescriptionItem>
        <DescriptionItem label="Status">
          {STATUS_JEMAAT_LABEL[data.statusJemaat]}
        </DescriptionItem>
        <DescriptionItem label="Bergabung">
          {data.joinedAt ? formatDate(data.joinedAt) : "—"}
        </DescriptionItem>
        <DescriptionItem label="Wilayah">
          {orDash(data.zoneChurch?.name)}
        </DescriptionItem>
      </ProfileGroup>
    </>
  );
};
