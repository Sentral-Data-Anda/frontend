"use client";

import { Controller, useWatch } from "react-hook-form";

import { CheckboxGroupField, DdlField } from "@/components/common/control";
import { FormField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { type PelayanForm } from "./form-options";

interface PropTypes {
  form: PelayanForm;
  isDisabled: boolean;
}

export const TugasSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const typePelayan = useWatch({ control: form.control, name: "typePelayan" });
  const roles = useDdlOptions("role-pelayan", "id");
  const skills = useDdlOptions("skill-music", "id");
  const isGroup = typePelayan === "GROUP";

  return (
    <FormSection legend="Tugas" disabled={isDisabled}>
      {isGroup ? (
        <Controller
          control={form.control}
          name="rolePelayan"
          render={({ field, fieldState }) => (
            <FormField
              htmlFor="rolePelayan"
              label="Tugas kelompok"
              error={fieldState.error?.message}
              hint="Kelompok memegang satu tugas, mis. Singer untuk paduan suara."
            >
              <DdlField
                value={field.value[0] ?? ""}
                onValueChange={(value) => field.onChange(value ? [value] : [])}
                options={roles.options}
                isLoading={roles.isLoading}
                disabled={isDisabled}
                placeholder="Pilih tugas"
                emptyMessage="Belum ada data tugas"
              />
            </FormField>
          )}
        />
      ) : (
        <FormWide>
          <Controller
            control={form.control}
            name="rolePelayan"
            render={({ field, fieldState }) => (
              <CheckboxGroupField
                id="rolePelayan"
                label="Tugas"
                isLabelVisible={false}
                value={field.value}
                onValueChange={field.onChange}
                options={roles.options}
                error={fieldState.error?.message}
                hint="Pilih semua tugas yang biasa dipegang."
                disabled={isDisabled}
                emptyMessage={
                  roles.isLoading ? "Memuat tugas…" : "Belum ada data tugas"
                }
              />
            )}
          />
        </FormWide>
      )}

      <FormWide>
        <Controller
          control={form.control}
          name="musikSkill"
          render={({ field, fieldState }) => (
            <CheckboxGroupField
              id="musikSkill"
              label="Alat musik"
              value={field.value}
              onValueChange={field.onChange}
              options={skills.options}
              error={fieldState.error?.message}
              hint="Isi untuk pemusik. Di Jadwal Pelayan pemusik dipilih per alat, mis. Christian (Gitar)."
              disabled={isDisabled}
              emptyMessage={
                skills.isLoading
                  ? "Memuat alat musik…"
                  : "Belum ada data alat musik"
              }
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};
