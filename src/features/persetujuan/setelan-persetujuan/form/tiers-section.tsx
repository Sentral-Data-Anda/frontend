"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/common/control";
import {
  FormSection,
  FormWide,
  useOrderedRows,
} from "@/components/common/form";

import { EMPTY_TIER, MAX_TIERS } from "../model";

import { TIER_PREFIX, type SetelanForm } from "./form-options";
import { TierFields } from "./tier-fields";

const NOTE =
  "Urutan dari atas = urutan tanda tangan. Satu penanda tangan hanya boleh mengisi satu tahap.";

const EDIT_NOTE = `${NOTE} Perubahan berlaku untuk pengajuan berikutnya; permintaan yang sedang berjalan tetap memakai tahapan saat diajukan.`;

const ADD_ID = "tiers-add";

interface PropTypes {
  form: SetelanForm;
  isDisabled: boolean;
  isEditable: boolean;
  isEdit: boolean;
}

export const TiersSection = (props: PropTypes) => {
  const { form, isDisabled, isEditable, isEdit } = props;

  const rows = useOrderedRows({
    control: form.control,
    name: "tiers",
    prefix: TIER_PREFIX,
    noun: "tahap",
    addId: ADD_ID,
    pickAddFocus: (index) => `input[name="tiers.${index}.kind"]:checked`,
  });

  const { total } = rows;
  const isFull = total >= MAX_TIERS;
  const tiersError = form.formState.errors.tiers;
  const listError = tiersError?.message ?? tiersError?.root?.message;

  return (
    <FormSection
      legend="Tahapan"
      note={isEdit ? EDIT_NOTE : NOTE}
      disabled={isDisabled}
    >
      <FormWide className="space-y-3">
        <ol id="tiers" tabIndex={-1} className="space-y-3 outline-none">
          {rows.fields.map((row, index) => (
            <TierFields
              key={row.id}
              form={form}
              index={index}
              total={total}
              isDisabled={isDisabled}
              isEditable={isEditable}
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

        {isEditable ? (
          <div className="space-y-1.5">
            <Button
              id={ADD_ID}
              type="button"
              variant="outline"
              className="w-full cursor-pointer disabled:cursor-not-allowed"
              disabled={isDisabled || isFull}
              aria-describedby={isFull ? `${ADD_ID}-hint` : undefined}
              onClick={() => rows.onAdd(EMPTY_TIER)}
            >
              <Plus aria-hidden />
              Tambah tahap
            </Button>

            {isFull ? (
              <p
                id={`${ADD_ID}-hint`}
                className="text-muted-foreground text-caption"
              >
                Maksimal 10 tahap.
              </p>
            ) : null}
          </div>
        ) : null}

        <p aria-live="polite" className="sr-only">
          {rows.announcement}
        </p>
      </FormWide>
    </FormSection>
  );
};
