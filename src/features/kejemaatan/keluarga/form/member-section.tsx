"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import {
  Button,
  ComboboxField,
  DateField,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection, FormAlert } from "@/components/common/form";

import { useJemaatOptions } from "../api";
import { EMPTY_MEMBER_ROW, MEMBER_ROLE_LABEL } from "../model";
import type { KeluargaMember } from "../types";

import { type KeluargaForm } from "./form-options";

const ROLE_OPTIONS = optionsOf(MEMBER_ROLE_LABEL);

interface RowPropTypes {
  form: KeluargaForm;
  index: number;
  isDisabled: boolean;
  onRemove: () => void;
}

const MemberRow = (props: RowPropTypes) => {
  const { form, index, isDisabled, onRemove } = props;

  const jemaat = useJemaatOptions();

  return (
    <div className="border-hairline rounded-control relative border p-3">
      <ControlField
        control={form.control}
        name={`members.${index}.jemaatCode`}
        label="Jemaat"
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={jemaat.options}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            disabled={isDisabled}
            placeholder="Cari nama atau kode jemaat"
            emptyMessage="Belum ada data jemaat"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name={`members.${index}.roleInFamily`}
        label="Peran"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            disabled={isDisabled}
            options={ROLE_OPTIONS}
            placeholder="Pilih peran"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name={`members.${index}.startedAt`}
        label="Sejak"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            label="Tanggal mulai"
            hint="Kosongkan bila tidak diketahui."
          />
        )}
      </ControlField>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        onClick={onRemove}
        className="text-destructive absolute top-2 right-2"
        aria-label={`Hapus baris anggota ${index + 1}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
};

interface PropTypes {
  form: KeluargaForm;
  isDisabled: boolean;
  saved?: readonly KeluargaMember[];
  isCanEndMembership?: boolean;
  onEndMembership?: (member: KeluargaMember) => void;
}

export const MemberSection = (props: PropTypes) => {
  const {
    form,
    isDisabled,
    saved = [],
    isCanEndMembership = false,
    onEndMembership,
  } = props;

  const rows = useFieldArray({ control: form.control, name: "members" });
  const { errors } = useFormState({ control: form.control });
  const jemaat = useJemaatOptions();
  const members = useWatch({ control: form.control, name: "members" });
  const membersError = errors.members?.root?.message ?? errors.members?.message;

  // The household is named after its head, so show that name while it is being
  // chosen — the rule is easier to trust when it is visible.
  const savedHead = saved.find((row) => row.role === "KEPALA_KELUARGA");
  const typedHead = (members ?? []).find(
    (row) => row.roleInFamily === "KEPALA_KELUARGA",
  );
  const headName =
    savedHead?.name ??
    jemaat.options.find((option) => option.value === typedHead?.jemaatCode)
      ?.label ??
    null;

  const onAdd = () => {
    rows.append({ ...EMPTY_MEMBER_ROW }, { shouldFocus: false });
    form.clearErrors("members");
  };

  return (
    <FormSection
      legend="Anggota"
      note="Hanya jemaat yang sudah terdaftar. Bayi atau kerabat yang belum tercatat didaftarkan dulu di Daftar Jemaat sebagai simpatisan, lalu kembali ke sini."
      disabled={isDisabled}
    >
      <div className="col-span-full space-y-3">
        {saved.length > 0 ? (
          <ul className="border-hairline rounded-control divide-hairline divide-y border">
            {saved.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="text-body">{member.name}</span>

                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground text-caption">
                    {MEMBER_ROLE_LABEL[member.role]}
                  </span>

                  {member.endedAt ? (
                    <span className="text-muted-foreground text-caption">
                      Berakhir
                    </span>
                  ) : isCanEndMembership && onEndMembership ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isDisabled}
                      onClick={() => onEndMembership(member)}
                    >
                      Akhiri
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {rows.fields.map((field, index) => (
          <MemberRow
            key={field.id}
            form={form}
            index={index}
            isDisabled={isDisabled}
            onRemove={() => rows.remove(index)}
          />
        ))}

        <p className="text-muted-foreground text-caption">
          Nama keluarga mengikuti kepala keluarga:{" "}
          <span className="text-foreground font-medium">
            {headName ? `Kel. ${headName}` : "belum ada kepala keluarga"}
          </span>
        </p>

        {membersError ? (
          <FormAlert title="Anggota belum benar." message={membersError} />
        ) : null}

        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          onClick={onAdd}
        >
          <Plus className="size-4" aria-hidden />
          Tambah anggota
        </Button>
      </div>
    </FormSection>
  );
};
