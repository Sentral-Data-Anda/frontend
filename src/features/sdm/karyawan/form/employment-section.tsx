"use client";

import { useWatch } from "react-hook-form";

import { DateField, Input, SelectField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { endOfYearIso } from "@/lib/date";

import { STATUS_OPTIONS, type KaryawanForm } from "./form-options";

const DATE_MAX = endOfYearIso(1);

interface PropTypes {
  form: KaryawanForm;
  isDisabled: boolean;
}

export const EmploymentSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const [status, joinDate] = useWatch({
    control: form.control,
    name: ["status", "joinDate"],
  });
  const isActive = status === "ACTIVE";

  return (
    <FormSection legend="Kepegawaian" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="position"
        label="Jabatan"
        hint="Mis. Koster, Admin Kantor."
      >
        {(field) => <Input {...field} maxLength={100} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="joinDate"
        label="Tanggal bergabung"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            max={DATE_MAX}
            isClearable={false}
            label="Tanggal bergabung"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="status" label="Status">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="resignDate"
        label="Tanggal berhenti"
        hint={
          isActive
            ? "Kosongkan selama status masih Aktif."
            : "Wajib diisi untuk status Berhenti dan Diberhentikan."
        }
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            min={joinDate || undefined}
            max={DATE_MAX}
            label="Tanggal berhenti"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
