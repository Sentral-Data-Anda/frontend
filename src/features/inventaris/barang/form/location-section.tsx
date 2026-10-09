"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { DdlField, buttonVariants } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { cn } from "@/lib/utils";

import { cycleCreateHref } from "../model";
import type { AssetDetail } from "../types";

import { type BarangForm } from "./form-options";

interface PropTypes {
  form: BarangForm;
  isDisabled: boolean;
  saved?: AssetDetail;
  onLeaveTo: (href: string) => void;
}

export const LocationSection = (props: PropTypes) => {
  const { form, isDisabled, saved, onLeaveTo } = props;

  const { isCanCreate: isCanMove } = useMenuAccess(MENU.ASSET_TRANSACTION);
  const savedRoomId = form.formState.defaultValues?.roomId ?? "";
  const savedBapelId = form.formState.defaultValues?.bapelId ?? "";
  const rooms = useDdlOptions("room", "id", savedRoomId);
  const bapels = useDdlOptions("bapel", "id", savedBapelId);
  const moveHref = saved ? cycleCreateHref("pindah", saved.code) : "";
  const roomLabel =
    rooms.options.find((option) => option.value === savedRoomId)?.label ??
    saved?.room.name;

  const onMove = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onLeaveTo(moveHref);
  };

  if (saved) {
    return (
      <FormSection
        legend="Lokasi"
        note="Pindahkan barang lewat Siklus Aset agar riwayatnya tercatat."
        disabled={isDisabled}
      >
        <div>
          <p className="mb-1.5 text-body font-medium">Ruang</p>
          <p className="text-body">{roomLabel}</p>
        </div>
        <div>
          <p className="mb-1.5 text-body font-medium">Badan pelayanan</p>
          <p className="text-body">{saved.bapel.name}</p>
        </div>
        {isCanMove ? (
          <FormWide>
            <Link
              href={moveHref}
              onClick={onMove}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer",
              )}
            >
              Pindahkan
            </Link>
          </FormWide>
        ) : null}
      </FormSection>
    );
  }

  return (
    <FormSection legend="Lokasi" disabled={isDisabled}>
      <ControlField control={form.control} name="roomId" label="Ruang">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={rooms.options}
            isLoading={rooms.isLoading}
            disabled={isDisabled}
            placeholder="Pilih ruang"
            emptyMessage="Belum ada data ruang"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapels.options}
            isLoading={bapels.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
