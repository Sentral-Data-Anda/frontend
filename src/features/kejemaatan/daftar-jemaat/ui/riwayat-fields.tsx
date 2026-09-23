"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useFieldArray } from "react-hook-form";

import { Button } from "@/components/common/button";
import { DateField } from "@/components/common/date-field";
import { FormSection } from "@/components/common/form-layout";
import { Input } from "@/components/common/input";
import { SelectField } from "@/components/common/select-field";
import { MENU, menuHref } from "@/config/menu";
import { formatDate } from "@/lib/format";

import {
  SACRAMENT_ONCE,
  SACRAMENT_TYPE_LABEL,
  type SacramentType,
} from "../types";

import { ControlField } from "./control-field";
import type { JemaatForm } from "./form-sections";

const RIWAYAT_PATH = menuHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT);

const SACRAMENT_OPTIONS = Object.entries(SACRAMENT_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

/**
 * Riwayat gerejawi (`additional[]`): baptis, sidi, atestasi, kedukaan.
 *
 * Dua bentuk, dan perbedaannya bukan selera:
 *
 * - **Tambah** — bisa diisi, karena sakramen memang dicatat saat pendaftaran
 *   (atestasi masuk membawa tanggal, gereja asal, dan nomor surat).
 * - **Ubah** — HANYA BACA, dengan tautan ke layar Riwayat Jemaat. Sejak
 *   be-sada memperlakukan `additional` yang tidak dikirim sebagai "jangan
 *   disentuh", layar ini tidak mengirimnya sama sekali; menampilkannya
 *   sebagai kotak yang bisa diketik berarti menjanjikan perubahan yang tidak
 *   akan pernah tersimpan.
 */
export function RiwayatSection({
  form,
  isDisabled,
  isEdit,
}: {
  form: JemaatForm;
  isDisabled: boolean;
  isEdit: boolean;
}) {
  const rows = useFieldArray({ control: form.control, name: "additional" });

  if (isEdit) {
    return (
      <FormSection legend="Riwayat gerejawi" disabled={isDisabled}>
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
          , supaya satu data tidak punya dua pemilik. Menyimpan dari sini tidak
          mengubahnya.
        </p>
      </FormSection>
    );
  }

  /**
   * Baptis, sidi, dan meninggal hanya boleh SEKALI per jemaat (indeks SQL
   * `riwayat_jemaat_once_per_type`). Jenis yang sudah dipakai disembunyikan
   * dari baris berikutnya — penolakannya di server datang sebagai galat 500
   * setelah semua field lain terisi, dan itu terbaca sebagai aplikasi rusak.
   */
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
    <FormSection legend="Riwayat gerejawi" disabled={isDisabled}>
      {/*
        Satu baris catatan, BUKAN `EmptyState`: kelompok ini kosong pada
        hampir setiap pendaftaran, dan blok kosong berikon memakan 114px untuk
        menyampaikan dua kalimat yang sama. `EmptyState` tetap benar di layar
        daftar, tempat kosongnya adalah kabar; di sini kosong adalah keadaan
        biasa.
      */}
      {rows.fields.length === 0 ? (
        <p className="text-muted-foreground text-caption">
          Tambahkan baptis, sidi, atau atestasi bila suratnya dibawa sekarang.
        </p>
      ) : (
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
                {(field) => <DateField {...field} />}
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
    </FormSection>
  );
}
