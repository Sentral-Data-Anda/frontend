"use client";

import { useWatch } from "react-hook-form";

import { ChoiceField, ComboboxField, Input } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { useJemaatSearch } from "../api";
import { isEmailAsked, type ParticipantKind } from "../model";

import { KIND_OPTIONS, type RegistrationForm } from "./form-options";

const KIND_BOUND = [
  "jemaatId",
  "participantName",
  "participantPhone",
  "participantEmail",
] as const;

interface PropTypes {
  form: RegistrationForm;
  isDisabled: boolean;
  isPaid: boolean;
}

export const ParticipantSection = (props: PropTypes) => {
  const { form, isDisabled, isPaid } = props;

  const [kind, isPhoneAsked] = useWatch({
    control: form.control,
    name: ["kind", "isPhoneAsked"],
  });
  const jemaat = useJemaatSearch();
  const isGuest = kind === "tamu";

  const onPickKind = (value: string) => {
    const options = { shouldDirty: true };

    form.setValue("kind", value as ParticipantKind, options);
    for (const name of KIND_BOUND) form.setValue(name, "", options);
    form.setValue("isPhoneAsked", false);
    form.clearErrors([...KIND_BOUND]);
  };

  const onPickJemaat = (value: string) => {
    form.setValue("jemaatId", value, { shouldDirty: true });
    form.setValue("isPhoneAsked", false);
    form.setValue("participantPhone", "");
    form.clearErrors(["jemaatId", "participantPhone"]);
  };

  const phoneField = (
    <ControlField
      control={form.control}
      name="participantPhone"
      label="Telepon"
      hint={
        isGuest ? undefined : "Jemaat ini belum punya nomor telepon tercatat."
      }
    >
      {(field) => (
        <Input
          {...field}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={15}
        />
      )}
    </ControlField>
  );

  const emailField = (
    <ControlField
      control={form.control}
      name="participantEmail"
      label="Email"
      isOptional
      hint={isPaid ? "Tagihan dikirim ke email ini bila diisi." : undefined}
    >
      {(field) => (
        <Input {...field} type="email" autoComplete="email" maxLength={150} />
      )}
    </ControlField>
  );

  return (
    <FormSection legend="Peserta" disabled={isDisabled}>
      <FormWide>
        <ChoiceField
          id="kind"
          label="Jenis peserta"
          value={kind}
          onValueChange={onPickKind}
          options={KIND_OPTIONS}
          disabled={isDisabled}
        />
      </FormWide>

      {isGuest ? (
        <>
          <ControlField
            control={form.control}
            name="participantName"
            label="Nama"
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="name"
                autoCapitalize="words"
                maxLength={150}
              />
            )}
          </ControlField>
          {phoneField}
          {emailField}
        </>
      ) : (
        <>
          <ControlField
            control={form.control}
            name="jemaatId"
            label="Jemaat"
            hint="Nama dan telepon diambil dari data jemaat."
          >
            {(field) => (
              <ComboboxField
                value={field.value}
                onValueChange={onPickJemaat}
                options={jemaat.options}
                isLoading={jemaat.isLoading}
                onSearch={jemaat.onSearch}
                disabled={isDisabled}
                placeholder="Pilih jemaat"
                emptyMessage="Tidak ada jemaat dengan nama itu"
              />
            )}
          </ControlField>
          {isPhoneAsked ? phoneField : null}
          {isEmailAsked(kind, isPaid) ? emailField : null}
        </>
      )}
    </FormSection>
  );
};
