"use client";

import { DdlField, type SelectOption } from "@/components/common/control";
import {
  ControlField,
  RowOrderControls,
  type RowButton,
} from "@/components/common/form";

import { SLOT_PREFIX, type JadwalForm, type SlotOptions } from "./form-options";
import { PelayanField } from "./pelayan-field";

interface PropTypes {
  form: JadwalForm;
  index: number;
  total: number;
  roleId: string;
  takenKeys: ReadonlyMap<string, number>;
  roles: readonly SelectOption[];
  isRolesLoading: boolean;
  slotOptions: SlotOptions;
  isDisabled: boolean;
  onMove: (from: number, to: number, button: RowButton) => void;
  onRemove: (index: number) => void;
}

export const SlotFields = (props: PropTypes) => {
  const {
    form,
    index,
    total,
    roleId,
    takenKeys,
    roles,
    isRolesLoading,
    slotOptions,
    isDisabled,
    onMove,
    onRemove,
  } = props;

  const step = index + 1;
  const titleId = `${SLOT_PREFIX}-${index}-title`;

  const onPickRole = (next: string) => {
    form.setValue(`slots.${index}.roleId`, next, { shouldDirty: true });
    form.setValue(`slots.${index}.pelayan`, "", { shouldDirty: true });
    form.clearErrors(`slots.${index}`);
  };

  return (
    <li
      aria-labelledby={titleId}
      className="border-border flex items-start gap-2 border-b py-3 last:border-b-0"
    >
      <span
        id={titleId}
        className="text-muted-foreground mt-6 flex h-control w-7 shrink-0 items-center text-title font-semibold tabular-nums"
      >
        <span className="sr-only">Petugas </span>
        {step}
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap gap-3">
        <div className="min-w-0 flex-[1_1_12rem]">
          <ControlField
            control={form.control}
            name={`slots.${index}.roleId`}
            label="Tugas"
          >
            {(field) => (
              <DdlField
                value={field.value}
                onValueChange={onPickRole}
                options={roles}
                isLoading={isRolesLoading}
                disabled={isDisabled}
                placeholder="Pilih tugas"
                emptyMessage="Belum ada tugas. Tambahkan di menu Role Pelayan."
              />
            )}
          </ControlField>
        </div>

        <div className="min-w-0 flex-[1.3_1_14rem]">
          <PelayanField
            form={form}
            index={index}
            roleId={roleId}
            takenKeys={takenKeys}
            slotOptions={slotOptions}
            isDisabled={isDisabled}
          />
        </div>

        <div className="ml-auto">
          <span aria-hidden className="mb-1.5 block text-body select-none">
            &nbsp;
          </span>

          <RowOrderControls
            prefix={SLOT_PREFIX}
            noun="petugas"
            index={index}
            total={total}
            isDisabled={isDisabled}
            onMove={onMove}
            onRemove={onRemove}
          />
        </div>
      </div>
    </li>
  );
};
