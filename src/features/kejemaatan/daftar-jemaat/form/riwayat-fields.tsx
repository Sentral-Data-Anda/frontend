"use client";

import { useFieldArray, useWatch } from "react-hook-form";

import { FormSection, FormWide, LineItemList } from "@/components/common/form";

import { useJemaatOptions } from "../api";
import { type SacramentType } from "../types";

import { type JemaatForm } from "./form-options";
import { RiwayatRow } from "./riwayat-row";

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const RiwayatSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "additional" });
  const values = useWatch({ control: form.control, name: "additional" });
  const usedTypes = (values ?? []).map((row) => row.type as SacramentType);
  const { data: partnerOptions } = useJemaatOptions();
  const currentId = form.getValues("id");

  const filteredPartnerOptions = (partnerOptions ?? []).filter(
    (option) => option.value !== currentId,
  );

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
              partnerId: "",
              endedAt: "",
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
              partnerOptions={filteredPartnerOptions}
            />
          ))}
        </LineItemList>
      </FormWide>
    </FormSection>
  );
};
