"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useFieldArray } from "react-hook-form";

import {
  Button,
  DateField,
  Input,
  SelectField,
} from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import { MENU, menuHref } from "@/config/menu";
import { formatDate } from "@/lib/format";

import {
  SACRAMENT_ONCE,
  SACRAMENT_TYPE_LABEL,
  type SacramentType,
} from "../types";

import { ControlField } from "./control-field";
import type { JemaatForm } from "./form-options";

const RIWAYAT_PATH = menuHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT);

const SACRAMENT_OPTIONS = Object.entries(SACRAMENT_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
  isEdit: boolean;
}

export const RiwayatSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit } = props;

  const rows = useFieldArray({ control: form.control, name: "additional" });

  if (isEdit) {
    return (
      <FormSection legend="Riwayat gerejawi" disabled={isDisabled}>
        <FormWide className="space-y-3">
          {rows.fields.length === 0 ? (
            <p className="text-muted-foreground text-caption">
              Belum ada riwayat baptis, sidi, atau atestasi.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.fields.map((row, index) => {
                const value = form.getValues(`additional.${index}`);

                return (
                  <li
                    key={row.id}
                    className="border-hairline rounded-control border px-3 py-2"
                  >
                    <p className="text-body font-medium">
                      {SACRAMENT_TYPE_LABEL[value.type as SacramentType]}
                    </p>
                    <p className="text-muted-foreground text-caption tabular-nums">
                      {[
                        formatDate(value.date),
                        value.place,
                        value.certificateNumber,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-muted-foreground text-caption">
            Riwayat diubah di{" "}
            <Link
              href={RIWAYAT_PATH}
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              layar Riwayat Jemaat
            </Link>
            , supaya satu data tidak punya dua pemilik. Menyimpan dari sini
            tidak mengubahnya.
          </p>
        </FormWide>
      </FormSection>
    );
  }

  const used = new Set(
    form.getValues("additional").map((row) => row.type as SacramentType),
  );

  const optionsFor = (current: string) =>
    SACRAMENT_OPTIONS.filter(
      (option) =>
        option.value === current ||
        !SACRAMENT_ONCE.includes(option.value as SacramentType) ||
        !used.has(option.value as SacramentType),
    );

  return (
    <FormSection
      legend="Riwayat gerejawi"
      note={
        rows.fields.length === 0
          ? "Tambahkan baptis, sidi, atau atestasi bila suratnya dibawa sekarang."
          : undefined
      }
      disabled={isDisabled}
    >
      <FormWide className="space-y-3">
        {rows.fields.length === 0 ? null : (
          <ul className="space-y-4">
            {rows.fields.map((row, index) => (
              <li
                key={row.id}
                className="border-hairline space-y-3 rounded-control border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body font-medium">Riwayat {index + 1}</p>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus riwayat ${index + 1}`}
                    className="text-destructive cursor-pointer"
                    onClick={() => rows.remove(index)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>

                <ControlField
                  control={form.control}
                  name={`additional.${index}.type`}
                  label="Jenis"
                >
                  {(field) => (
                    <SelectField
                      value={field.value}
                      onValueChange={field.onChange}
                      options={optionsFor(field.value)}
                      disabled={isDisabled}
                      placeholder="Pilih jenis"
                    />
                  )}
                </ControlField>

                <ControlField
                  control={form.control}
                  name={`additional.${index}.date`}
                  label="Tanggal"
                >
                  {(field) => (
                    <DateField
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isDisabled}
                      label="Tanggal riwayat"
                    />
                  )}
                </ControlField>

                <ControlField
                  control={form.control}
                  name={`additional.${index}.place`}
                  label="Tempat"
                  isOptional
                  hint="Untuk atestasi masuk: nama gereja asal."
                >
                  {(field) => <Input {...field} maxLength={100} />}
                </ControlField>

                <ControlField
                  control={form.control}
                  name={`additional.${index}.certificateNumber`}
                  label="Nomor surat"
                  isOptional
                >
                  {(field) => <Input {...field} maxLength={50} />}
                </ControlField>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() =>
            rows.append({
              type: "",
              date: "",
              certificateNumber: "",
              place: "",
            })
          }
        >
          <Plus aria-hidden />
          Tambah riwayat
        </Button>
      </FormWide>
    </FormSection>
  );
};
