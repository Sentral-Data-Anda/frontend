"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useWatch } from "react-hook-form";

import {
  ChoiceField,
  ComboboxField,
  DdlField,
  Input,
  Textarea,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormWide } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { IBADAH_PLACE_LABEL, type IbadahPlaceType } from "@/lib/ibadah-place";

import {
  keluargaAddressQuery,
  useHostOptions,
  useKeluargaAddress,
} from "../api";
import { withSavedOption } from "../model";
import type { IbadahDetail } from "../types";

import { type IbadahForm, withNoneOption } from "./form-options";

const PLACE_OPTIONS = optionsOf(IBADAH_PLACE_LABEL);

const PLACE_FIELDS = [
  "roomId",
  "hostKeluargaId",
  "placeName",
  "address",
] as const;

type AddressStatus = "idle" | "loading" | "failed";

interface PropTypes {
  form: IbadahForm;
  isDisabled: boolean;
  saved?: IbadahDetail;
}

export const PlaceFields = (props: PropTypes) => {
  const { form, isDisabled, saved } = props;

  const queryClient = useQueryClient();
  const { isCanCreate } = useMenuAccess(MENU.IBADAH);
  const [addressStatus, setAddressStatus] = useState<AddressStatus>("idle");
  const [placeType, typeIbadahId, zoneChurchId, hostKeluargaId] = useWatch({
    control: form.control,
    name: ["placeType", "typeIbadahId", "zoneChurchId", "hostKeluargaId"],
  });
  const isHome = placeType === "RUMAH_JEMAAT";
  const isOther = placeType === "LAINNYA";
  const savedHost = saved?.hostKeluarga ?? null;
  const savedHostId = String(savedHost?.id ?? "");
  const pinnedHost = useMemo(
    () =>
      savedHost ? { value: String(savedHost.id), label: savedHost.name } : null,
    [savedHost],
  );
  const zones = useDdlOptions("zone-church", "id", zoneChurchId);
  const rooms = useDdlOptions("room", "id");
  const hosts = useHostOptions({
    isEnabled: isCanCreate && isHome,
    typeIbadahId,
    zoneChurchId,
    selected: hostKeluargaId,
    pinned: pinnedHost,
  });
  const savedHostAddress = useKeluargaAddress(
    savedHostId,
    isCanCreate && isHome && Boolean(savedHostId),
  );

  const zoneOptions = withNoneOption(
    "Tanpa wilayah",
    withSavedOption(zones.options, saved?.zoneChurch),
  );
  const roomOptions = withNoneOption(
    "Tanpa ruang",
    withSavedOption(rooms.options, saved?.room),
  );
  const hostZone = savedHostAddress.data?.zoneChurch ?? null;
  const isHostMoved =
    savedHostAddress.data !== undefined &&
    hostKeluargaId === savedHostId &&
    (hostZone?.id ?? null) !== (saved?.zoneChurch?.id ?? null);

  const hostFieldHint = isHostMoved
    ? hostZone
      ? `Tuan rumah sekarang di ${hostZone.name}.`
      : "Tuan rumah sekarang tanpa wilayah."
    : isCanCreate && !zoneChurchId
      ? "Pilih wilayah dulu untuk melihat giliran tuan rumah."
      : undefined;

  const addressHint =
    addressStatus === "loading"
      ? "Memuat alamat keluarga…"
      : addressStatus === "failed"
        ? "Alamat keluarga tidak bisa dimuat. Isi manual."
        : isHome && !isCanCreate
          ? "Isi alamat rumah tuan rumah."
          : undefined;

  const onPickPlace = (value: string) => {
    form.clearErrors([...PLACE_FIELDS]);
    form.setValue("placeType", value as IbadahPlaceType, { shouldDirty: true });
  };

  const onPickHost = async (value: string) => {
    const shouldValidate = form.formState.submitCount > 0;
    const typedAddress = form.getValues("address");
    const pickedZone = form.getValues("zoneChurchId");
    const isOtherFamily = value !== form.getValues("hostKeluargaId");

    const dropStaleAddress = () => {
      if (!isOtherFamily || form.getValues("address") !== typedAddress) return;

      form.setValue("address", "", { shouldDirty: true, shouldValidate });
    };

    setAddressStatus("idle");
    form.setValue("hostKeluargaId", value, {
      shouldDirty: true,
      shouldValidate,
    });
    if (!value) return;
    if (!isCanCreate) {
      dropStaleAddress();
      return;
    }

    setAddressStatus("loading");
    try {
      const found = await queryClient.fetchQuery(keluargaAddressQuery(value));

      if (form.getValues("hostKeluargaId") !== value) return;
      if (form.getValues("address") === typedAddress) {
        form.setValue("address", found.address, {
          shouldDirty: true,
          shouldValidate,
        });
      }
      if (
        found.zoneChurch?.isActive &&
        form.getValues("zoneChurchId") === pickedZone
      ) {
        form.setValue("zoneChurchId", String(found.zoneChurch.id), {
          shouldDirty: true,
        });
      }
      setAddressStatus("idle");
    } catch {
      if (form.getValues("hostKeluargaId") !== value) return;

      setAddressStatus("failed");
      dropStaleAddress();
    }
  };

  return (
    <>
      <FormWide>
        <ChoiceField
          id="placeType"
          label="Tempat"
          value={placeType}
          onValueChange={onPickPlace}
          options={PLACE_OPTIONS}
          disabled={isDisabled}
        />
      </FormWide>

      {isHome ? (
        <ControlField
          control={form.control}
          name="zoneChurchId"
          label="Wilayah"
          hint={
            isCanCreate
              ? "Isi untuk ibadah wilayah; ikut terisi dari keluarga tuan rumah."
              : "Isi untuk ibadah wilayah."
          }
        >
          {(field) => (
            <DdlField
              value={field.value}
              onValueChange={field.onChange}
              options={zoneOptions}
              isLoading={zones.isLoading}
              disabled={isDisabled}
              placeholder="Pilih wilayah"
              emptyMessage="Belum ada data wilayah"
            />
          )}
        </ControlField>
      ) : null}

      {placeType === "GEREJA" ? (
        <ControlField control={form.control} name="roomId" label="Ruang">
          {(field) => (
            <DdlField
              value={field.value}
              onValueChange={field.onChange}
              options={roomOptions}
              isLoading={rooms.isLoading}
              disabled={isDisabled}
              placeholder="Pilih ruang"
              emptyMessage="Belum ada data ruang"
            />
          )}
        </ControlField>
      ) : null}

      {isHome ? (
        <ControlField
          control={form.control}
          name="hostKeluargaId"
          label="Tuan rumah"
          hint={hostFieldHint}
          isHintWarning={isHostMoved}
        >
          {(field) => (
            <ComboboxField
              value={field.value}
              onValueChange={(value) => void onPickHost(value)}
              options={hosts.options}
              isLoading={hosts.isLoading}
              onSearch={hosts.onSearch}
              isClearable
              disabled={isDisabled}
              placeholder="Cari keluarga"
              emptyMessage="Belum ada data keluarga"
            />
          )}
        </ControlField>
      ) : null}

      {isOther ? (
        <ControlField
          control={form.control}
          name="placeName"
          label="Nama tempat"
          hint="Mis. Villa Ciater, Aula Kantor Kelurahan."
        >
          {(field) => <Input {...field} maxLength={150} />}
        </ControlField>
      ) : null}

      {isHome || isOther ? (
        <FormWide>
          <ControlField
            control={form.control}
            name="address"
            label="Alamat"
            hint={addressHint}
            isHintWarning={addressStatus === "failed"}
            isOptional={isOther}
          >
            {(field) => <Textarea {...field} maxLength={250} rows={2} />}
          </ControlField>
        </FormWide>
      ) : null}
    </>
  );
};
