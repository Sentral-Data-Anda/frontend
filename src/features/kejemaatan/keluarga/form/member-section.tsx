"use client";

import { Controller, useFieldArray, useWatch } from "react-hook-form";

import {
  Button,
  ComboboxField,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import {
  FormSection,
  FormWide,
  LineItemCard,
  LineItemList,
  useLineItemErrors,
} from "@/components/common/form";

import { useJemaatOptions } from "../api";
import { EMPTY_MEMBER_ROW, MEMBER_ROLE_LABEL } from "../model";
import type { KeluargaMember } from "../types";

import { type KeluargaForm } from "./form-options";

const ROLE_OPTIONS = optionsOf(MEMBER_ROLE_LABEL);

const FIELDS = ["jemaatCode", "roleInFamily"] as const;

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface RowPropTypes {
  form: KeluargaForm;
  index: number;
  isDisabled: boolean;
  isHeadTaken: boolean;
  onRemove: (index: number) => void;
}

const MemberRow = (props: RowPropTypes) => {
  const { form, index, isDisabled, isHeadTaken, onRemove } = props;

  const jemaat = useJemaatOptions();
  const errors = useLineItemErrors(form.control, "members", index, FIELDS);
  const row = useWatch({ control: form.control, name: `members.${index}` });
  const chosen = jemaat.options.find(
    (option) => option.value === row?.jemaatCode,
  );

  // One household has one head, so the role stops being offered once it is
  // taken — except to the row holding it, which still has to be able to change.
  const isHeadHidden = isHeadTaken && row?.roleInFamily !== "KEPALA_KELUARGA";
  const roleOptions = isHeadHidden
    ? ROLE_OPTIONS.filter((option) => option.value !== "KEPALA_KELUARGA")
    : ROLE_OPTIONS;

  const ariaOf = (field: (typeof FIELDS)[number]) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  return (
    <LineItemCard
      index={index}
      title={chosen?.label ?? "Anggota baru"}
      meta={row ? MEMBER_ROLE_LABEL[row.roleInFamily] : undefined}
      removeLabel={`Hapus baris anggota ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      <div className="min-w-0 flex-[2_1_18rem]">
        <label htmlFor={errors.idOf("jemaatCode")} className={LABEL}>
          Jemaat
          <span className="sr-only"> baris {index + 1}</span>
        </label>

        <Controller
          control={form.control}
          name={`members.${index}.jemaatCode`}
          render={({ field }) => (
            <ComboboxField
              {...ariaOf("jemaatCode")}
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
        />
      </div>

      <div className="min-w-0 flex-[1_1_12rem]">
        <label htmlFor={errors.idOf("roleInFamily")} className={LABEL}>
          Peran
          <span className="sr-only"> baris {index + 1}</span>
        </label>

        <Controller
          control={form.control}
          name={`members.${index}.roleInFamily`}
          render={({ field }) => (
            <SelectField
              {...ariaOf("roleInFamily")}
              value={field.value}
              onValueChange={field.onChange}
              disabled={isDisabled}
              options={roleOptions}
              placeholder="Pilih peran"
            />
          )}
        />
      </div>
    </LineItemCard>
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
  const jemaat = useJemaatOptions();
  const members = useWatch({ control: form.control, name: "members" });
  const errors = form.formState.errors;
  const membersError = errors.members?.root?.message ?? errors.members?.message;

  // The household is named after its head, so show that name while it is being
  // chosen — the rule is easier to trust when it is visible.
  const savedHead = saved.find(
    (row) => row.role === "KEPALA_KELUARGA" && !row.endedAt,
  );
  const typedHeadIndex = (members ?? []).findIndex(
    (row) => row.roleInFamily === "KEPALA_KELUARGA",
  );
  const headName =
    savedHead?.name ??
    jemaat.options.find(
      (option) => option.value === members?.[typedHeadIndex]?.jemaatCode,
    )?.label ??
    null;
  const isHeadTaken = Boolean(savedHead) || typedHeadIndex !== -1;

  // A household is built from its head down, so the first row opens as the
  // head and every row after it opens as a child.
  const onAdd = () => {
    rows.append(
      {
        ...EMPTY_MEMBER_ROW,
        roleInFamily: isHeadTaken ? "ANAK" : "KEPALA_KELUARGA",
      },
      { shouldFocus: false },
    );
    form.clearErrors("members");
  };

  return (
    <FormSection
      legend="Anggota"
      note="Hanya jemaat yang sudah terdaftar. Bayi atau kerabat yang belum tercatat didaftarkan dulu di Daftar Jemaat sebagai simpatisan, lalu kembali ke sini."
      disabled={isDisabled}
    >
      {saved.length > 0 ? (
        <FormWide>
          <p className={LABEL}>Sudah menjadi anggota</p>

          <ul className="border-border divide-border rounded-control divide-y border">
            {saved.map((member) => (
              <li
                key={member.id}
                className="flex min-h-control items-center justify-between gap-3 px-3 py-2"
              >
                <span className="min-w-0 text-body wrap-break-word">
                  {member.name}
                </span>

                <span className="flex shrink-0 items-center gap-3">
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
        </FormWide>
      ) : null}

      <FormWide>
        <LineItemList
          label="Anggota yang akan ditambahkan"
          count={rows.fields.length}
          addLabel="Tambah anggota"
          isAddDisabled={isDisabled}
          onAdd={onAdd}
          empty={
            saved.length > 0
              ? "Belum ada anggota baru yang akan ditambahkan."
              : "Belum ada anggota. Mulai dari kepala keluarganya."
          }
          summary={headName ? `Kel. ${headName}` : "Nama ikut kepala keluarga"}
          error={membersError}
          errorId="members-error"
        >
          {rows.fields.map((field, index) => (
            <MemberRow
              key={field.id}
              form={form}
              index={index}
              isDisabled={isDisabled}
              isHeadTaken={isHeadTaken}
              onRemove={rows.remove}
            />
          ))}
        </LineItemList>
      </FormWide>
    </FormSection>
  );
};
