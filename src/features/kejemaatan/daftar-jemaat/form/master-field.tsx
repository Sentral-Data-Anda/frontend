"use client";

import { useState } from "react";

import { Button, ComboboxField } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useDdlOptions, type DdlOption } from "@/hooks/use-ddl-options";
import { FetchError } from "@/lib/api/fetcher";
import { findSimilar } from "@/lib/name";
import type { ApiResponse } from "@/types/api";

import { useCreateMaster, type MasterKind } from "../api";

import { type JemaatForm } from "./form-options";

const NOUN: Record<MasterKind, [string, string]> = {
  profession: ["pekerjaan", "Pekerjaan"],
  "ethnic-group": ["suku", "Suku"],
};

const errorText = (error: Error, noun: string) => {
  if (!(error instanceof FetchError)) {
    return "Tidak dapat menghubungi server. Periksa koneksi Anda.";
  }
  if (error.status === 403) {
    return `Anda tidak punya izin menambah ${noun}. Pilih dari daftar yang ada.`;
  }

  return error.message;
};

interface PropTypes {
  form: JemaatForm;
  name: "professionId" | "ethnicGroupId";
  kind: MasterKind;
  label: string;
  isClearable: boolean;
  isDisabled: boolean;
}

export const MasterField = (props: PropTypes) => {
  const { form, name, kind, label, isClearable, isDisabled } = props;

  const { isCanCreate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const toast = useToast();
  const master = useDdlOptions(kind);
  const createMaster = useCreateMaster(kind);
  const isCreateOpen = useBoolean();
  const [pickName, setPickName] = useState("");

  const [noun, nounTitle] = NOUN[kind];
  const suggestions = findSimilar(master.options, pickName);

  const onPickValue = (value: string) =>
    form.setValue(name, value, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

  const onCreate = (text: string) => {
    createMaster.reset();
    setPickName(text);
    isCreateOpen.onTrue();
  };

  const onPickSuggestion = (value: string) => {
    onPickValue(value);
    isCreateOpen.onFalse();
  };

  const onAdded = (created: ApiResponse<DdlOption>) => {
    onPickValue(String(created.data.id));
    isCreateOpen.onFalse();
    toast.add({
      title:
        created.status === 200
          ? `“${created.data.name}” sudah ada di daftar dan sudah dipilih.`
          : created.message,
    });
  };

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen && !createMaster.isPending) isCreateOpen.onFalse();
  };

  return (
    <>
      <ControlField control={form.control} name={name} label={label}>
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={master.options}
            isLoading={master.isLoading}
            isClearable={isClearable}
            disabled={isDisabled}
            placeholder={`Pilih ${noun}`}
            emptyMessage={`Belum ada data ${noun}`}
            onCreate={isCanCreate ? onCreate : undefined}
          />
        )}
      </ControlField>

      <ConfirmDialog
        isOpen={isCreateOpen.value}
        onOpenChange={onOpenChange}
        title={`Tambah ${noun} baru?`}
        description={`“${pickName}” belum ada di daftar. ${nounTitle} ini akan bisa dipilih untuk semua jemaat.`}
        confirmLabel={createMaster.isPending ? "Menambahkan…" : "Tambahkan"}
        isPending={createMaster.isPending}
        isClosedOnConfirm={false}
        onConfirm={() => createMaster.mutate(pickName, { onSuccess: onAdded })}
      >
        {suggestions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-body text-muted-foreground">Maksud Anda:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  disabled={createMaster.isPending}
                  onClick={() => onPickSuggestion(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {createMaster.error ? (
          <p role="alert" className="text-body text-destructive">
            {errorText(createMaster.error, noun)}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
};
