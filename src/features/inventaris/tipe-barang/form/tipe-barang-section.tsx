"use client";

import { AccountField, Input } from "@/components/common/control";
import {
  ControlField,
  FormSection,
  LockedField,
} from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { accountText } from "../model";
import type { TipeBarang } from "../types";

import { type TipeBarangForm } from "./form-options";

interface PropTypes {
  form: TipeBarangForm;
  isDisabled: boolean;
  /** The saved type, for the accounts shown when they may not be edited. */
  tipeBarang?: TipeBarang;
}

const HINT = "Hanya pemegang Setelan Akuntansi yang bisa mengubahnya.";

export const TipeBarangSection = (props: PropTypes) => {
  const { form, isDisabled, tipeBarang } = props;

  // Setelan Akuntansi, NOT Tipe Barang. These three accounts decide where
  // depreciation lands in the general ledger, and the server refuses the
  // change to anyone without that grant — so a picker shown here to a stock
  // clerk would only earn them a 403 after they had filled it in.
  //
  // Locked rather than hidden: the clerk may read which accounts a type uses,
  // and `/tipe-barang/:code` already tells them. The picker could not stand in
  // for it even disabled, because `/ddl/account` does not list Tipe Barang
  // among its menus and would answer 403 — so there would be nothing to show.
  const { isCanUpdate: isCanSetAccounts } = useMenuAccess(
    MENU.SETELAN_AKUNTANSI,
  );

  return (
    <>
      <FormSection legend="Tipe barang" disabled={isDisabled}>
        <ControlField control={form.control} name="name" label="Nama">
          {(field) => (
            <Input
              {...field}
              maxLength={50}
              autoCapitalize="words"
              placeholder="mis. Alat Musik"
            />
          )}
        </ControlField>
      </FormSection>

      <FormSection
        legend="Akun akuntansi"
        note="Dipakai saat perolehan aset dan penyusutan diposting. Dibiarkan kosong, penyusutan memakai akun di Setelan Akuntansi."
        disabled={isDisabled}
      >
        {isCanSetAccounts ? (
          <>
            <ControlField
              control={form.control}
              name="assetAccountId"
              label="Akun aset"
            >
              {(field) => (
                <AccountField
                  value={field.value}
                  onValueChange={field.onChange}
                  type="ASSET"
                  isClearable
                  disabled={isDisabled}
                  placeholder="Pilih akun aset"
                />
              )}
            </ControlField>

            <ControlField
              control={form.control}
              name="depreciationExpenseAccountId"
              label="Akun beban penyusutan"
            >
              {(field) => (
                <AccountField
                  value={field.value}
                  onValueChange={field.onChange}
                  type="EXPENSE"
                  isClearable
                  disabled={isDisabled}
                  placeholder="Pilih akun beban"
                />
              )}
            </ControlField>

            <ControlField
              control={form.control}
              name="accumulatedDepreciationAccountId"
              label="Akun akumulasi penyusutan"
            >
              {(field) => (
                <AccountField
                  value={field.value}
                  onValueChange={field.onChange}
                  type="ASSET"
                  isClearable
                  disabled={isDisabled}
                  placeholder="Pilih akun akumulasi"
                />
              )}
            </ControlField>
          </>
        ) : (
          <>
            <LockedField
              id="assetAccountId"
              label="Akun aset"
              value={accountText(tipeBarang?.assetAccount ?? null)}
              hint={HINT}
            />

            <LockedField
              id="depreciationExpenseAccountId"
              label="Akun beban penyusutan"
              value={accountText(
                tipeBarang?.depreciationExpenseAccount ?? null,
              )}
              hint={HINT}
            />

            <LockedField
              id="accumulatedDepreciationAccountId"
              label="Akun akumulasi penyusutan"
              value={accountText(
                tipeBarang?.accumulatedDepreciationAccount ?? null,
              )}
              hint={HINT}
            />
          </>
        )}
      </FormSection>
    </>
  );
};
