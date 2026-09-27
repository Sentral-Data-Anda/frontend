"use client";

import { Input, SelectField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { ADMIN_OPTIONS, type RoleUserForm } from "./form-options";

interface PropTypes {
  form: RoleUserForm;
  isDisabled: boolean;
  isAdminLocked: boolean;
}

export const RoleSection = (props: PropTypes) => {
  const { form, isDisabled, isAdminLocked } = props;

  const onPickAdmin = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    form.setValue("access", {}, { shouldDirty: true });
  };

  return (
    <FormSection legend="Role" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama"
        hint="4–25 karakter, mis. Sekretariat."
      >
        {(field) => <Input {...field} maxLength={25} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="isAdmin"
        label="Akses penuh (Administrator)"
        hint={
          isAdminLocked
            ? "Hanya administrator yang dapat mengubah akses penuh."
            : undefined
        }
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={(value) => onPickAdmin(value, field.onChange)}
            options={ADMIN_OPTIONS}
            disabled={isDisabled || isAdminLocked}
            placeholder="Pilih akses penuh"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
