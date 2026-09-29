"use client";

import {
  DateField,
  DdlField,
  Input,
  SelectField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { CONDITION_OPTIONS, type BarangForm } from "./form-options";

interface PropTypes {
  form: BarangForm;
  isDisabled: boolean;
}

export const IdentitySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const savedTypeId = form.formState.defaultValues?.typeId ?? "";
  const types = useDdlOptions("type-item", "id", savedTypeId);

  return (
    <FormSection legend="Barang" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={150}
            autoComplete="off"
            placeholder="mis. Proyektor Epson EB-X51"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="typeId" label="Tipe">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={types.options}
            isLoading={types.isLoading}
            disabled={isDisabled}
            placeholder="Pilih tipe"
            emptyMessage="Belum ada data tipe barang"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="condition" label="Kondisi">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={CONDITION_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih kondisi"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="serialNumber"
        label="Nomor seri"
        hint="Harus berbeda untuk tiap barang."
        isOptional
      >
        {(field) => <Input {...field} maxLength={100} autoComplete="off" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="warrantyUntil"
        label="Garansi sampai"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            label="Garansi sampai"
            isClearable
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="description"
          label="Keterangan"
          hint="Ciri, letak, atau pemakaian barang."
        >
          {(field) => <Textarea {...field} maxLength={250} rows={3} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
