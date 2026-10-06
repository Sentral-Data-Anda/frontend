"use client";

import { AccountField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { ACCOUNT_NOTE } from "../model";

import { type KomponenForm } from "./katalog-options";

interface PropTypes {
  form: KomponenForm;
  isDisabled: boolean;
}

export const AkuntansiSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Akuntansi" note={ACCOUNT_NOTE} disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="accountId"
        label="Akun"
        isOptional
        hint="Potongan tanpa akun akan menahan pembayaran penggajian."
        isHintWarning
      >
        {(field) => (
          <AccountField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            disabled={isDisabled}
          />
        )}
      </ControlField>
    </FormSection>
  );
};
