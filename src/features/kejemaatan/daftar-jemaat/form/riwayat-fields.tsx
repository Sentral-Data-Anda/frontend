"use client";

import Link from "next/link";
import { useFieldArray, useWatch } from "react-hook-form";

import { FormSection, FormWide, LineItemList } from "@/components/common/form";
import { MENU, menuHref } from "@/config/menu";

import { type SacramentType } from "../types";

import { type JemaatForm } from "./form-options";
import { RiwayatRow } from "./riwayat-row";
import { RiwayatSavedRow } from "./riwayat-saved-row";

const RIWAYAT_PATH = menuHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT);

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
  isEdit: boolean;
}

export const RiwayatSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit } = props;

  const rows = useFieldArray({ control: form.control, name: "additional" });
  const values = useWatch({ control: form.control, name: "additional" });
  const usedTypes = (values ?? []).map((row) => row.type as SacramentType);

  // After the jemaat exists, each riwayat is a record of its own with its own
  // izin and its own audit trail, so this form only shows them.
  if (isEdit) {
    return (
      <FormSection legend="Riwayat gerejawi" disabled={isDisabled}>
        <FormWide className="space-y-3">
          <LineItemList
            label="Riwayat gerejawi"
            count={rows.fields.length}
            empty="Belum ada riwayat baptis, sidi, atau atestasi."
          >
            {rows.fields.map((row, index) => (
              <RiwayatSavedRow
                key={row.id}
                index={index}
                row={form.getValues(`additional.${index}`)}
              />
            ))}
          </LineItemList>

          <p className="text-muted-foreground text-caption">
            Riwayat ditambah dan diubah di{" "}
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

  return (
    <FormSection legend="Riwayat gerejawi" disabled={isDisabled}>
      <FormWide>
        <LineItemList
          label="Riwayat gerejawi"
          count={rows.fields.length}
          addLabel="Tambah riwayat"
          isAddDisabled={isDisabled}
          empty="Tambahkan baptis, sidi, atau atestasi bila suratnya dibawa sekarang."
          onAdd={() =>
            rows.append({
              type: "",
              date: "",
              certificateNumber: "",
              place: "",
            })
          }
        >
          {rows.fields.map((row, index) => (
            <RiwayatRow
              key={row.id}
              form={form}
              index={index}
              usedTypes={usedTypes}
              isDisabled={isDisabled}
              onRemove={rows.remove}
            />
          ))}
        </LineItemList>
      </FormWide>
    </FormSection>
  );
};
