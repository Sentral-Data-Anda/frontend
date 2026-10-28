"use client";

import { ComboboxField } from "@/components/common/control";
import { FormSection, ControlField } from "@/components/common/form";

import { useKeluargaOptions } from "../api";

import { type JemaatForm } from "./form-options";

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

/**
 * Household and role are not edited here any more: a family is registered with
 * its members on the Keluarga form, which is where the clerk knows who lives
 * with whom. The two values still ride along in the form state — loaded from
 * the current membership and sent back unchanged — because an absent value
 * would detach the person from their household.
 */
export const FamilySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const keluarga = useKeluargaOptions();

  return (
    <FormSection
      legend="Keluarga asal"
      note="Untuk menelusuri anak yang kini berkeluarga sendiri. Keluarga tempat tinggal sekarang diatur dari menu Keluarga."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="keluargaAsalId"
        label="Keluarga asal"
        isOptional
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={keluarga.options}
            isLoading={keluarga.isLoading}
            onSearch={keluarga.onSearch}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih keluarga asal"
            emptyMessage="Belum ada data keluarga"
            onLoadMore={keluarga.onLoadMore}
            hasMore={keluarga.hasMore}
            isLoadingMore={keluarga.isLoadingMore}
          />
        )}
      </ControlField>
    </FormSection>
  );
};
