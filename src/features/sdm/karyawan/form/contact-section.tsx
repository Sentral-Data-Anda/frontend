"use client";

import { Input, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { keepDigits } from "@/lib/number";

import { type KaryawanForm } from "./form-options";

interface PropTypes {
  form: KaryawanForm;
  isDisabled: boolean;
}

export const ContactSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Kontak"
      note="Hanya nomor HP yang wajib; email dan alamat boleh dikosongkan."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="phone" label="Nomor HP">
        {(field) => (
          <Input
            {...field}
            value={field.value}
            onChange={(event) =>
              field.onChange(keepDigits(event.target.value, 15))
            }
            inputMode="numeric"
            autoComplete="tel"
            maxLength={15}
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="email" label="Email">
        {(field) => (
          <Input
            {...field}
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={150}
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField control={form.control} name="address" label="Alamat">
          {(field) => <Textarea {...field} rows={3} maxLength={250} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
