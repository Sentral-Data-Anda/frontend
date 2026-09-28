"use client";

import { UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, type MouseEvent } from "react";
import { useWatch } from "react-hook-form";

import { Button, DdlField, buttonVariants } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { MENU, detailHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

import { useJadwalPelayanRosters } from "../api";
import {
  coversService,
  isSlotReady,
  toJadwalOptions,
  withSavedOption,
} from "../model";
import type { IbadahRelation } from "../types";

import { type IbadahForm, withNoneOption } from "./form-options";

const FOOT_LINK = cn(
  buttonVariants({ variant: "link" }),
  "h-auto min-h-6 gap-1.5 px-0 text-body",
);

// Harus stabil: larik baru tiap render membuat useWatch berlangganan ulang dan kosongnya jadwal tidak terbaca.
const WATCHED = ["date", "startTime", "endTime", "jadwalPelayanId"] as const;

interface PropTypes {
  form: IbadahForm;
  isDisabled: boolean;
  saved?: IbadahRelation | null;
  onOpenJadwal: (href: string) => void;
}

export const JadwalPelayanField = (props: PropTypes) => {
  const { form, isDisabled, saved, onOpenJadwal } = props;

  const { isCanView } = useMenuAccess(MENU.JADWAL_PELAYAN);
  const isCleared = useBoolean();
  const { onTrue: onCleared } = isCleared;
  const [date, startTime, endTime, picked] = useWatch({
    control: form.control,
    name: WATCHED,
  });
  const slot = { date, startTime, endTime };
  const isReady = isSlotReady(slot);
  const rosters = useJadwalPelayanRosters(date, isReady);
  const rows = rosters.data;
  const pickedSaved = saved && String(saved.id) === picked ? saved : null;
  const options = withNoneOption(
    "Tanpa jadwal pelayan",
    withSavedOption(
      isReady ? toJadwalOptions(rows ?? [], slot) : [],
      pickedSaved,
    ),
  );
  const pickedCode =
    rows?.find((roster) => String(roster.id) === picked)?.code ??
    pickedSaved?.code;
  const href =
    isCanView && pickedCode
      ? detailHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN, pickedCode)
      : "";

  const onOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;

    event.preventDefault();
    onOpenJadwal(href);
  };

  const onRetry = () => void rosters.refetch();

  useEffect(() => {
    const keyOf = (values: Partial<Record<string, string>>) =>
      [values.date, values.startTime, values.endTime].join("|");
    let last = keyOf(form.getValues());

    const subscription = form.watch((values, { type }) => {
      const key = keyOf(values);

      if (key === last) return;
      last = key;
      if (type !== "change" || !values.jadwalPelayanId) return;

      const roster = rows?.find(
        (row) => String(row.id) === values.jadwalPelayanId,
      );
      const service = {
        date: values.date ?? "",
        startTime: values.startTime ?? "",
        endTime: values.endTime ?? "",
      };

      if (roster && isSlotReady(service) && coversService(roster, service)) {
        return;
      }
      form.setValue("jadwalPelayanId", "", { shouldDirty: true });
      onCleared();
    });

    return () => subscription.unsubscribe();
  }, [form, rows, onCleared]);

  return (
    <div>
      <ControlField
        control={form.control}
        name="jadwalPelayanId"
        label="Jadwal pelayan"
        hint={
          isCleared.value
            ? undefined
            : "Siapa yang bertugas. Jadwal dibuat di menu Jadwal Pelayan; yang tampil hanya yang tanggal dan jamnya sesuai."
        }
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              isCleared.onFalse();
            }}
            options={options}
            isLoading={rosters.isFetching}
            disabled={isDisabled || !isReady}
            placeholder={
              isReady ? "Pilih jadwal pelayan" : "Isi tanggal dan jam dulu"
            }
            emptyMessage={
              rosters.isError
                ? "Jadwal pelayan gagal dimuat."
                : "Belum ada jadwal pelayan yang jamnya sesuai dengan ibadah ini."
            }
          />
        )}
      </ControlField>

      {isCleared.value ? (
        <p
          role="status"
          className="border-warning bg-warning/10 mt-1.5 rounded-control border px-2 py-0.5 text-caption"
        >
          Jadwal pelayan dikosongkan karena tidak sesuai dengan tanggal atau jam
          baru.
        </p>
      ) : null}

      {rosters.isError ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-caption text-destructive">
          Jadwal pelayan gagal dimuat.
          <Button
            type="button"
            variant="link"
            className="h-auto min-h-6 px-0 text-body"
            disabled={isDisabled || rosters.isFetching}
            onClick={onRetry}
          >
            {rosters.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </p>
      ) : null}

      {href ? (
        <Link
          href={href}
          onClick={onOpen}
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? -1 : undefined}
          className={cn(
            FOOT_LINK,
            "mt-1",
            isDisabled && "pointer-events-none opacity-50",
          )}
        >
          <UsersRound aria-hidden />
          Lihat petugas jadwal ini
        </Link>
      ) : null}
    </div>
  );
};
