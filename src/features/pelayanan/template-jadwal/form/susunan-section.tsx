"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/common/control";
import {
  FormSection,
  FormWide,
  useOrderedRows,
} from "@/components/common/form";

import { EMPTY_SLOT } from "../model";

import { SLOT_PREFIX, type TemplateJadwalForm } from "./form-options";
import { SlotFields } from "./slot-fields";

const ADD_ID = "slots-add";

interface PropTypes {
  form: TemplateJadwalForm;
  isDisabled: boolean;
}

export const SusunanSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useOrderedRows({
    control: form.control,
    name: "slots",
    prefix: SLOT_PREFIX,
    noun: "tugas",
    addId: ADD_ID,
    pickAddFocus: (index) => `[id="slots.${index}.roleId"]`,
  });

  const slotsError = form.formState.errors.slots;
  const listError = slotsError?.message ?? slotsError?.root?.message;

  return (
    <FormSection
      legend="Susunan tugas"
      note="Urutan dari atas = urutan petugas di jadwal. Tugas yang sama boleh lebih dari sekali, mis. dua Singer."
      disabled={isDisabled}
    >
      <FormWide className="max-w-2xl space-y-4">
        <ol id="slots" tabIndex={-1} className="space-y-3 outline-none">
          {rows.fields.map((row, index) => (
            <SlotFields
              key={row.id}
              form={form}
              index={index}
              total={rows.total}
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
          id={ADD_ID}
          type="button"
          variant="outline"
          className="w-full cursor-pointer disabled:cursor-not-allowed"
          disabled={isDisabled}
          onClick={() => rows.onAdd(EMPTY_SLOT)}
        >
          <Plus aria-hidden />
          Tambah tugas
        </Button>

        <p aria-live="polite" className="sr-only">
          {rows.announcement}
        </p>
      </FormWide>
    </FormSection>
  );
};
