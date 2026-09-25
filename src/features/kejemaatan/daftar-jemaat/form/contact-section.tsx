"use client";

import { Input } from "@/components/common/control";
import { FormSection } from "@/components/common/form";

import { normalizePhone } from "../model";

import { ControlField } from "./control-field";
import { type JemaatForm } from "./form-options";

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const ContactSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Kontak"
      note="Keduanya boleh dikosongkan. Satu nomor boleh dipakai beberapa anggota keluarga."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="phone" label="Telepon">
        {(field) => (
          <Input
            {...field}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className="tabular-nums"
            onChange={(event) =>
              field.onChange(normalizePhone(event.target.value))
            }
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
            autoCapitalize="none"
            maxLength={150}
          />
        )}
      </ControlField>
    </FormSection>
  );
};
