"use client";

import { useFieldArray, useWatch } from "react-hook-form";

import { FormSection, FormWide, LineItemList } from "@/components/common/form";

import { type JemaatAdditional, type SacramentType } from "../types";

import { type JemaatForm } from "./form-options";
import { PernikahanReadonly } from "./pernikahan-readonly";
import { RiwayatRow } from "./riwayat-row";

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
  /** Seluruh riwayat tersimpan, termasuk yang tidak bisa diedit di sini. */
  stored?: readonly JemaatAdditional[];
}

export const RiwayatSection = (props: PropTypes) => {
  const { form, isDisabled, stored = [] } = props;

  const rows = useFieldArray({ control: form.control, name: "additional" });
  const values = useWatch({ control: form.control, name: "additional" });
  const usedTypes = (values ?? []).map((row) => row.type as SacramentType);
  return (
    <FormSection legend="Riwayat gerejawi" disabled={isDisabled}>
      <FormWide>
        <LineItemList
          label="Riwayat gerejawi"
          count={rows.fields.length}
          addLabel="Tambah riwayat"
          isAddDisabled={isDisabled}
          empty="Tambahkan baptis, sidi, atestasi, atau kedukaan bila suratnya ada."
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

        <PernikahanReadonly rows={stored} />
      </FormWide>
    </FormSection>
  );
};
