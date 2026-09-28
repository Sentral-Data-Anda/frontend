"use client";

import { DdlField } from "@/components/common/control";
import {
  ControlField,
  RowOrderControls,
  type RowButton,
} from "@/components/common/form";

import { useRoleOptions } from "../api";
import { withSavedRole } from "../model";

import { SLOT_PREFIX, type TemplateJadwalForm } from "./form-options";

interface PropTypes {
  form: TemplateJadwalForm;
  index: number;
  total: number;
  isDisabled: boolean;
  onMove: (from: number, to: number, button: RowButton) => void;
  onRemove: (index: number) => void;
}

export const SlotFields = (props: PropTypes) => {
  const { form, index, total, isDisabled, onMove, onRemove } = props;

  const roles = useRoleOptions();

  return (
    <li className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <ControlField
          control={form.control}
          name={`slots.${index}.roleId`}
          label={`Tugas ${index + 1}`}
        >
          {(field) => (
            <DdlField
              value={field.value}
              onValueChange={field.onChange}
              options={withSavedRole(
                roles.options,
                field.value,
                roles.isLoading,
              )}
              isLoading={roles.isLoading}
              disabled={isDisabled}
              placeholder="Pilih tugas"
              emptyMessage="Belum ada data tugas di Role Pelayan"
            />
          )}
        </ControlField>
      </div>

      <div>
        <span aria-hidden className="mb-1.5 block text-body select-none">
          &nbsp;
        </span>

        <RowOrderControls
          prefix={SLOT_PREFIX}
          noun="tugas"
          index={index}
          total={total}
          isDisabled={isDisabled}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
    </li>
  );
};
