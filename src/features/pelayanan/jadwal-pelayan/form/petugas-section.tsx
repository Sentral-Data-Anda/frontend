"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/common/control";
import {
  FormSection,
  FormWide,
  useOrderedRows,
} from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import {
  EMPTY_SLOT_ROW,
  filledCount,
  takenKeysOf,
  type SlotRow,
} from "../model";

import {
  SLOT_PREFIX,
  SLOTS_ADD_ID,
  type JadwalForm,
  type SlotOptions,
} from "./form-options";
import { SlotFields } from "./slot-fields";

interface PropTypes {
  form: JadwalForm;
  slots: readonly SlotRow[];
  slotOptions: SlotOptions;
  isDisabled: boolean;
}

export const PetugasSection = (props: PropTypes) => {
  const { form, slots, slotOptions, isDisabled } = props;

  const roles = useDdlOptions("role-pelayan");
  const rows = useOrderedRows({
    control: form.control,
    name: "slots",
    prefix: SLOT_PREFIX,
    noun: "petugas",
    addId: SLOTS_ADD_ID,
    pickAddFocus: (index) => `[id="slots.${index}.roleId"]`,
  });

  const slotsError = form.formState.errors.slots;
  const listError = slotsError?.message ?? slotsError?.root?.message;

  return (
    <FormSection
      legend="Petugas"
      note={`${filledCount(slots)} dari ${slots.length} terisi. Petugas boleh dikosongkan dulu. Satu orang hanya satu tugas per jadwal.`}
      disabled={isDisabled}
    >
      <FormWide className="space-y-3">
        <ol id="slots" tabIndex={-1} className="outline-none">
          {rows.fields.map((row, index) => (
            <SlotFields
              key={row.id}
              form={form}
              index={index}
              total={rows.total}
              roleId={slots[index]?.roleId ?? ""}
              takenKeys={takenKeysOf(slots, index)}
              roles={roles.options}
              isRolesLoading={roles.isLoading}
              slotOptions={slotOptions}
              isDisabled={isDisabled}
              onMove={rows.onMove}
              onRemove={rows.onRemove}
            />
          ))}
        </ol>

        {listError ? (
          <p role="alert" className="text-destructive text-body">
            {listError}
          </p>
        ) : null}

        <Button
          id={SLOTS_ADD_ID}
          type="button"
          variant="outline"
          className="w-full cursor-pointer disabled:cursor-not-allowed"
          disabled={isDisabled}
          onClick={() => rows.onAdd(EMPTY_SLOT_ROW)}
        >
          <Plus aria-hidden />
          Tambah petugas
        </Button>

        <p aria-live="polite" className="sr-only">
          {rows.announcement}
        </p>
      </FormWide>
    </FormSection>
  );
};
