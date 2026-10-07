"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";

import {
  AccountField,
  ChoiceField,
  Input,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { AKUN_LIST_PATH } from "../model";

import {
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
  type OfferingTypeForm,
} from "./form-options";

const LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary";

const LATER = "Perubahan hanya berlaku untuk persembahan berikutnya.";

type ChoiceName = "hasPeriod" | "requiresJemaat" | "isActive";

const choiceField = (
  form: OfferingTypeForm,
  name: ChoiceName,
  label: string,
  options: SelectOption[],
  note: string,
  isDisabled: boolean,
) => (
  <Controller
    control={form.control}
    name={name}
    render={({ field }) => (
      <div>
        <ChoiceField
          id={name}
          label={label}
          value={field.value}
          onValueChange={field.onChange}
          options={options}
          disabled={isDisabled}
          hint={note}
        />
      </div>
    )}
  />
);

interface PropTypes {
  form: OfferingTypeForm;
  isDisabled: boolean;
  isEdit: boolean;
}

export const TypeSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit } = props;

  const income = useDdlOptions("account?type=INCOME");
  const isNoAccount = !income.isLoading && income.rows.length === 0;
  const isAccountRejected = Boolean(form.formState.errors.accountId);

  return (
    <FormSection legend="Tipe persembahan" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={50}
            autoCapitalize="words"
            placeholder="mis. Kolekte"
          />
        )}
      </ControlField>

      <div>
        <ControlField
          control={form.control}
          name="accountId"
          label="Akun pendapatan"
          isOptional
          hint="Akun pendapatan yang dikredit saat persembahan diposting. Untuk dana khusus, pakai akun pendapatan dana itu."
        >
          {(field) => (
            <AccountField
              id={field.name}
              value={field.value}
              onValueChange={field.onChange}
              type="INCOME"
              disabled={isDisabled}
            />
          )}
        </ControlField>

        {isNoAccount || isAccountRejected ? (
          <p className="text-muted-foreground mt-1.5 text-caption">
            {isNoAccount ? "Belum ada akun pendapatan. " : null}
            <Link href={AKUN_LIST_PATH} className={LINK}>
              {isNoAccount ? "Buat akun dulu" : "Perbaiki di Akun"}
            </Link>
          </p>
        ) : null}
      </div>

      {choiceField(
        form,
        "hasPeriod",
        "Minta periode",
        YES_NO_OPTIONS,
        isEdit
          ? `Untuk persembahan bulanan. Pencatat akan diminta memilih bulan yang dimaksud, bukan tanggal uangnya diterima. ${LATER}`
          : "Untuk persembahan bulanan. Pencatat akan diminta memilih bulan yang dimaksud, bukan tanggal uangnya diterima.",
        isDisabled,
      )}

      {choiceField(
        form,
        "requiresJemaat",
        "Wajib menunjuk jemaat",
        YES_NO_OPTIONS,
        isEdit
          ? `Untuk perpuluhan dan sejenisnya. Tipe yang tidak mewajibkan boleh dicatat anonim. ${LATER}`
          : "Untuk perpuluhan dan sejenisnya. Tipe yang tidak mewajibkan boleh dicatat anonim.",
        isDisabled,
      )}

      {choiceField(
        form,
        "isActive",
        "Status",
        STATUS_OPTIONS,
        "Tipe nonaktif tidak bisa dipilih saat mencatat persembahan baru.",
        isDisabled,
      )}
    </FormSection>
  );
};
