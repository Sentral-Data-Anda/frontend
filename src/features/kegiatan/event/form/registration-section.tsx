"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useWatch } from "react-hook-form";

import {
  ChoiceField,
  Input,
  buttonVariants,
} from "@/components/common/control";
import { ProgressBar } from "@/components/common/dashboard";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { toDigits } from "@/lib/number";
import { cn } from "@/lib/utils";

import {
  formatThousands,
  registrationsHref,
  type EventFormValues,
} from "../model";
import type { ChurchEvent } from "../types";

import { PAID_OPTIONS, PUBLISH_OPTIONS, type EventForm } from "./form-options";

interface PropTypes {
  form: EventForm;
  isDisabled: boolean;
  saved?: ChurchEvent;
  onOpenRegistrations: (href: string) => void;
}

export const RegistrationSection = (props: PropTypes) => {
  const { form, isDisabled, saved, onOpenRegistrations } = props;

  const { isCanView: isCanViewRegistrations } = useMenuAccess(
    MENU.PENDAFTARAN_EVENT,
  );
  const [isPaid, isPublish] = useWatch({
    control: form.control,
    name: ["isPaid", "isPublish"],
  });
  const registered = saved?.registeredCount ?? 0;
  const isPriceLocked = registered > 0;
  const lockHint = `Tidak bisa diubah karena sudah ada ${registered} pendaftar.`;
  const href = saved ? registrationsHref(saved) : "";

  const onPickPaid = (value: string) => {
    form.clearErrors("price");
    form.setValue("isPaid", value as EventFormValues["isPaid"], {
      shouldDirty: true,
    });
  };

  const onPickPublish = (value: string) =>
    form.setValue("isPublish", value as EventFormValues["isPublish"], {
      shouldDirty: true,
    });

  const onOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onOpenRegistrations(href);
  };

  return (
    <FormSection legend="Pendaftaran" disabled={isDisabled}>
      {saved ? (
        <FormWide>
          <div className="flex max-w-xl flex-col gap-2">
            <ProgressBar
              label="Kursi terisi"
              value={(saved.registeredCount / saved.capacity) * 100}
              meta={`${saved.registeredCount} dari ${saved.capacity} kursi terisi`}
            />
            {isCanViewRegistrations ? (
              <Link
                href={href}
                onClick={onOpen}
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "h-9 w-fit cursor-pointer px-0",
                )}
              >
                Lihat pendaftar
              </Link>
            ) : null}
          </div>
        </FormWide>
      ) : null}

      <ControlField
        control={form.control}
        name="capacity"
        label="Kapasitas (orang)"
        hint={
          registered > 0
            ? `Minimal ${registered}, sudah ada ${registered} pendaftar.`
            : undefined
        }
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(toDigits(event.target.value, 5))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            className="tabular-nums"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="urlForm"
        label="Tautan formulir luar"
        hint="Isi bila pendaftaran juga memakai formulir di luar aplikasi."
        isOptional
      >
        {(field) => (
          <Input {...field} type="url" maxLength={150} autoComplete="off" />
        )}
      </ControlField>

      <FormWide>
        <ChoiceField
          id="isPaid"
          label="Biaya"
          value={isPaid}
          onValueChange={onPickPaid}
          options={PAID_OPTIONS}
          disabled={isDisabled || isPriceLocked}
        />
        {isPriceLocked && isPaid === "0" ? (
          <p className="text-muted-foreground mt-1.5 text-caption">
            {lockHint}
          </p>
        ) : null}
      </FormWide>

      {isPaid === "1" ? (
        <ControlField
          control={form.control}
          name="price"
          label="Harga"
          hint={
            isPriceLocked ? lockHint : "Dibayar peserta lewat tagihan online."
          }
        >
          {(field) => (
            <Input
              {...field}
              value={formatThousands(field.value)}
              onChange={(event) =>
                field.onChange(toDigits(event.target.value, 9))
              }
              icon={<span className="text-body">Rp</span>}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              disabled={isPriceLocked}
              readOnly={isPriceLocked}
              className="tabular-nums"
            />
          )}
        </ControlField>
      ) : null}

      <FormWide>
        <ChoiceField
          id="isPublish"
          label="Publikasi"
          value={isPublish}
          onValueChange={onPickPublish}
          options={PUBLISH_OPTIONS}
          disabled={isDisabled}
        />
        <p className="text-muted-foreground mt-1.5 text-caption">
          Event draf belum bisa didaftari dan tidak tampil di Beranda.
        </p>
      </FormWide>
    </FormSection>
  );
};
