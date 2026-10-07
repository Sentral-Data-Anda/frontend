"use client";

import Link from "next/link";
import { useWatch } from "react-hook-form";

import { AmountInput } from "@/components/common/control";
import { DETAIL_LINK as LINK } from "@/components/common/display";
import { ControlField, FormAlert, FormSection } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import {
  COUNT_CHECK_LABEL,
  COUNT_CHECK_NOTE,
  KAS_MASUK_CREATE_PATH,
  countGap,
  countGapText,
} from "../model";
import type { PersembahanForm } from "../use-persembahan-form";

interface PropTypes {
  form: PersembahanForm;
  isDisabled: boolean;
}

/**
 * Selisih hitung fisik memperingatkan dan tidak pernah memblokir: form yang
 * memblokir membuat klerk memalsukan angka. Angkanya tidak dikirim ke server.
 */
export const CountCheck = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const countCheck = useWatch({ control: form.control, name: "countCheck" });
  const items = useWatch({ control: form.control, name: "items" });
  const { isCanCreate } = useMenuAccess(MENU.KAS_MASUK);
  const gap = countGap(countCheck, items);

  return (
    <FormSection
      legend="Hitung fisik"
      note={COUNT_CHECK_NOTE}
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="countCheck"
        label={COUNT_CHECK_LABEL}
      >
        {(field) => (
          <AmountInput
            ref={field.ref}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            maxDigits={13}
            maxFraction={2}
          />
        )}
      </ControlField>

      {gap === null ? null : (
        <div className="col-span-full space-y-2">
          <FormAlert
            tone="warning"
            title="Hitungan fisik tidak sama dengan total baris."
            message={countGapText(gap)}
          />
          {isCanCreate ? (
            <Link href={KAS_MASUK_CREATE_PATH} className={LINK}>
              Catat selisihnya di Kas Masuk
            </Link>
          ) : null}
        </div>
      )}
    </FormSection>
  );
};
