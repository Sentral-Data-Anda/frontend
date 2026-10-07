"use client";

import Link from "next/link";

import { AccountField } from "@/components/common/control";
import { DETAIL_LINK as LINK } from "@/components/common/display";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { AKUN_LIST_PATH, updatedByLabel } from "../model";
import type { AccountingSetting } from "../types";

import { type SettingForm } from "./form-options";

interface PropTypes {
  form: SettingForm;
  setting: AccountingSetting;
  isDisabled: boolean;
}

export const SettingSection = (props: PropTypes) => {
  const { form, setting, isDisabled } = props;

  const account = useDdlOptions("account");
  const isNoAccount = !account.isLoading && account.rows.length === 0;
  const isAccountRejected = Boolean(form.formState.errors.accountId);
  const updatedBy = updatedByLabel(setting.updatedBy);

  return (
    <FormSection
      legend="Setelan"
      note={setting.description}
      disabled={isDisabled}
    >
      <div>
        <ControlField
          control={form.control}
          name="accountId"
          label="Akun"
          hint="Pilih akun dari daftar akun gereja. Tidak ada usulan bawaan."
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

        {isNoAccount || isAccountRejected ? (
          <p className="text-muted-foreground mt-1.5 text-caption">
            {isNoAccount ? "Belum ada akun. " : null}
            <Link href={AKUN_LIST_PATH} className={LINK}>
              {isNoAccount ? "Buat akun dulu" : "Perbaiki di Akun"}
            </Link>
          </p>
        ) : null}

        {updatedBy ? (
          <p className="text-muted-foreground mt-1.5 text-caption">
            {updatedBy}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
};
