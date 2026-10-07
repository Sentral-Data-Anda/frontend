"use client";

import { Controller } from "react-hook-form";

import { ChoiceField, Input, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { digitsOf } from "../model";

import { STATUS_OPTIONS, type SupplierForm } from "./form-options";

interface PropTypes {
  form: SupplierForm;
  isDisabled: boolean;
}

export const IdentitySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Supplier"
      note="Nama kontak, email, dan alamat boleh dikosongkan."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={150}
            autoComplete="off"
            placeholder="mis. Toko Buku Agape"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="contactPerson"
        label="Nama kontak"
      >
        {(field) => (
          <Input
            {...field}
            maxLength={100}
            autoComplete="off"
            placeholder="mis. Ibu Maria"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="phone"
        label="No telepon"
        hint="Hanya angka, mis. 081234567890"
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(digitsOf(event.target.value, 15))
            }
            type="tel"
            inputMode="tel"
            autoComplete="off"
            className="tabular-nums"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="email" label="Email">
        {(field) => (
          <Input
            {...field}
            type="email"
            maxLength={150}
            autoComplete="off"
            placeholder="mis. toko@contoh.com"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField control={form.control} name="address" label="Alamat">
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              placeholder="mis. Jl. Pemuda No. 5, Medan"
            />
          )}
        </ControlField>
      </FormWide>

      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <div>
            <ChoiceField
              id="isActive"
              label="Status"
              value={field.value}
              onValueChange={field.onChange}
              options={STATUS_OPTIONS}
              disabled={isDisabled}
              hint="Supplier nonaktif tidak bisa dipilih di pesanan baru."
            />
          </div>
        )}
      />
    </FormSection>
  );
};
