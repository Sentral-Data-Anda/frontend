"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";

import { Button } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";

import { EMPTY_TIER, MAX_TIERS } from "../model";

import {
  tierButtonId,
  type SetelanForm,
  type TierButton,
} from "./form-options";
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

  const rows = useFieldArray({ control: form.control, name: "tiers" });
  const [announcement, setAnnouncement] = useState("");
  const focusRef = useRef<string | null>(null);

  const total = rows.fields.length;
  const isFull = total >= MAX_TIERS;
  const tiersError = form.formState.errors.tiers;
  const listError = tiersError?.message ?? tiersError?.root?.message;

  const onMove = (from: number, to: number, button: TierButton) => {
    const isEdge = button === "up" ? to === 0 : to === total - 1;

    rows.move(from, to);
    setAnnouncement(`Tahap ${from + 1} dipindah ke posisi ${to + 1}`);
    focusRef.current = `#${tierButtonId(to, isEdge ? (button === "up" ? "down" : "up") : button)}`;
  };

  const onRemove = (index: number) => {
    const remaining = total - 1;

    rows.remove(index);
    setAnnouncement(`Tahap ${index + 1} dihapus`);
    focusRef.current =
      remaining > 1
        ? `#${tierButtonId(Math.min(index, remaining - 1), "remove")}`
        : `#${ADD_ID}`;
  };

  const onAdd = () => {
    rows.append(EMPTY_TIER, { shouldFocus: false });
    focusRef.current = `input[name="tiers.${total}.kind"]:checked`;
  };

  useEffect(() => {
    if (!focusRef.current) return;

    document.querySelector<HTMLElement>(focusRef.current)?.focus();
    focusRef.current = null;
  }, [rows.fields]);

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
              onMove={onMove}
              onRemove={onRemove}
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
              onClick={onAdd}
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
          {announcement}
        </p>
      </FormWide>
    </FormSection>
  );
};
