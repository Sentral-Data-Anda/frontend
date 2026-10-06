"use client";

import { useWatch } from "react-hook-form";

import { ComboboxField } from "@/components/common/control";
import {
  ControlField,
  FormSection,
  LockedField,
} from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { EMPLOYEE_NOTE } from "../model";
import type { KontrakKaryawan } from "../types";

import { type KontrakForm } from "./form-options";

interface PropTypes {
  form: KontrakForm;
  isDisabled: boolean;
  // Dari rutenya, bukan dari apakah detailnya termuat: muat yang gagal tidak
  // boleh mengubah form ubah jadi form tambah.
  isEdit: boolean;
  code?: string;
  contract?: KontrakKaryawan;
}

export const EmployeeSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit, code, contract } = props;

  const karyawanId = useWatch({ control: form.control, name: "karyawanId" });
  const karyawan = useDdlOptions("karyawan", "id", karyawanId);

  return (
    <FormSection
      legend="Karyawan"
      note={isEdit ? EMPLOYEE_NOTE : undefined}
      disabled={isDisabled}
    >
      {isEdit ? (
        <LockedField
          id="karyawanId"
          label="Karyawan"
          value={contract?.karyawan.name ?? ""}
        />
      ) : (
        <ControlField control={form.control} name="karyawanId" label="Karyawan">
          {(field) => (
            <ComboboxField
              id={field.name}
              value={field.value}
              onValueChange={field.onChange}
              options={karyawan.options}
              isLoading={karyawan.isLoading}
              disabled={isDisabled}
              placeholder="Pilih karyawan"
              emptyMessage="Belum ada karyawan aktif"
            />
          )}
        </ControlField>
      )}

      {isEdit ? (
        <LockedField
          id="code"
          label="Kode kontrak"
          value={contract?.code ?? code ?? ""}
        />
      ) : null}
    </FormSection>
  );
};
