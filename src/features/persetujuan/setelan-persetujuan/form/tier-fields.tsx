"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useWatch } from "react-hook-form";

import {
  Button,
  ChoiceField,
  ComboboxField,
  DdlField,
} from "@/components/common/control";
import { ControlField } from "@/components/common/form";

import { useBapelOptions, useJabatanOptions, useRoleOptions } from "../api";
import { withSavedJabatan } from "../model";

import {
  tierButtonId,
  withEmptyOption,
  type SetelanForm,
  type TierButton,
} from "./form-options";

const KIND_OPTIONS = [
  { value: "role", label: "Role sistem" },
  { value: "position", label: "Jabatan komisi" },
];

const SUBMITTER_BAPEL = "Badan pelayanan pengaju dokumen";

interface PropTypes {
  form: SetelanForm;
  index: number;
  total: number;
  isDisabled: boolean;
  isEditable: boolean;
  onMove: (from: number, to: number, button: TierButton) => void;
  onRemove: (index: number) => void;
}

export const TierFields = (props: PropTypes) => {
  const { form, index, total, isDisabled, isEditable, onMove, onRemove } =
    props;

  const [kind, bapelId, roleName] = useWatch({
    control: form.control,
    name: [
      `tiers.${index}.kind`,
      `tiers.${index}.bapelId`,
      `tiers.${index}.roleName`,
    ],
  });
  const isPosition = kind === "position";
  const roles = useRoleOptions();
  const bapel = useBapelOptions();
  const jabatan = useJabatanOptions(bapelId, isPosition);
  const saved = withSavedJabatan(jabatan.options, roleName, jabatan.isLoaded);
  const step = index + 1;
  const titleId = `tier-${index}-title`;

  const onPickKind = (next: string) => {
    form.setValue(`tiers.${index}.kind`, next as "role" | "position", {
      shouldDirty: true,
    });
    form.setValue(`tiers.${index}.roleUserId`, "");
    form.setValue(`tiers.${index}.roleName`, "");
    form.setValue(`tiers.${index}.bapelId`, "");
    form.clearErrors(`tiers.${index}`);
  };

  const onPickBapel = (next: string) => {
    form.setValue(`tiers.${index}.bapelId`, next, { shouldDirty: true });
    form.setValue(`tiers.${index}.roleName`, "");
  };

  return (
    <li
      aria-labelledby={titleId}
      className="border-hairline space-y-3 rounded-control border p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p id={titleId} className="text-body font-medium">
          Tahap {step}
        </p>

        {isEditable ? (
          <div className="flex gap-1">
            <Button
              id={tierButtonId(index, "up")}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Naikkan tahap ${step}`}
              className="cursor-pointer disabled:cursor-not-allowed"
              disabled={isDisabled || index === 0}
              onClick={() => onMove(index, index - 1, "up")}
            >
              <ArrowUp aria-hidden />
            </Button>

            <Button
              id={tierButtonId(index, "down")}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Turunkan tahap ${step}`}
              className="cursor-pointer disabled:cursor-not-allowed"
              disabled={isDisabled || index === total - 1}
              onClick={() => onMove(index, index + 1, "down")}
            >
              <ArrowDown aria-hidden />
            </Button>

            <Button
              id={tierButtonId(index, "remove")}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Hapus tahap ${step}`}
              className="text-destructive cursor-pointer disabled:cursor-not-allowed"
              disabled={isDisabled || total === 1}
              onClick={() => onRemove(index)}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-56 flex-1">
          <ChoiceField
            id={`tiers.${index}.kind`}
            label="Penanda tangan"
            value={kind}
            onValueChange={onPickKind}
            options={KIND_OPTIONS}
            disabled={isDisabled}
          />
        </div>

        {isPosition ? (
          <>
            <div className="min-w-56 flex-1">
              <ControlField
                control={form.control}
                name={`tiers.${index}.bapelId`}
                label="Badan pelayanan"
                hint={
                  bapelId
                    ? undefined
                    : "Dokumen yang tidak terkait badan pelayanan akan ditolak saat diajukan."
                }
              >
                {(field) => (
                  <DdlField
                    value={field.value}
                    onValueChange={onPickBapel}
                    options={withEmptyOption(SUBMITTER_BAPEL, bapel.options)}
                    isLoading={bapel.isLoading}
                    disabled={isDisabled}
                    placeholder={SUBMITTER_BAPEL}
                    emptyMessage="Belum ada data badan pelayanan"
                  />
                )}
              </ControlField>
            </div>

            <div className="min-w-56 flex-1">
              <ControlField
                control={form.control}
                name={`tiers.${index}.roleName`}
                label="Nama jabatan"
                hint={
                  saved.isMissing
                    ? "Saat ini tidak ada yang memegang jabatan ini; tahap akan menunggu sampai ada."
                    : undefined
                }
                isHintWarning={saved.isMissing}
              >
                {(field) => (
                  <ComboboxField
                    value={field.value}
                    onValueChange={field.onChange}
                    options={saved.options}
                    isLoading={jabatan.isLoading}
                    disabled={isDisabled}
                    placeholder="Pilih jabatan"
                    emptyMessage={
                      jabatan.isError
                        ? "Daftar jabatan gagal dimuat. Muat ulang halaman untuk mencoba lagi."
                        : bapelId
                          ? "Belum ada jabatan di Role Jemaat untuk badan pelayanan ini."
                          : "Belum ada jabatan di Role Jemaat."
                    }
                  />
                )}
              </ControlField>
            </div>
          </>
        ) : (
          <div className="min-w-56 flex-1">
            <ControlField
              control={form.control}
              name={`tiers.${index}.roleUserId`}
              label="Role"
            >
              {(field) => (
                <DdlField
                  value={field.value}
                  onValueChange={field.onChange}
                  options={roles.options}
                  isLoading={roles.isLoading}
                  disabled={isDisabled}
                  placeholder="Pilih role"
                  emptyMessage="Belum ada data role"
                />
              )}
            </ControlField>
          </div>
        )}
      </div>
    </li>
  );
};
