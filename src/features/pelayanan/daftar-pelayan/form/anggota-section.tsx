"use client";

import { useEffect, useRef, useState } from "react";
import { useController } from "react-hook-form";

import { ComboboxField } from "@/components/common/control";
import { FormField, FormSection, FormWide } from "@/components/common/form";

import { useActiveJemaatSearch } from "../api";

import { type PelayanForm } from "./form-options";
import { MemberRow, memberRemoveId } from "./member-row";

const ADD_ID = "members";

interface PropTypes {
  form: PelayanForm;
  isDisabled: boolean;
}

export const AnggotaSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const { field, fieldState } = useController({
    control: form.control,
    name: "members",
  });
  const jemaat = useActiveJemaatSearch();
  const [announcement, setAnnouncement] = useState("");
  const focusRef = useRef<string | null>(null);

  const members = field.value;
  const options = jemaat.options.filter(
    (option) => !members.some((member) => member.id === option.value),
  );

  const onAdd = (value: string) => {
    const picked = jemaat.options.find((option) => option.value === value);

    if (!picked) return;

    field.onChange([
      ...members,
      { id: picked.value, code: "", name: picked.label },
    ]);
    jemaat.onSearch("");
    setAnnouncement(`${picked.label} ditambahkan`);
    focusRef.current = ADD_ID;
  };

  const onRemove = (index: number) => {
    const next = members.filter((_, position) => position !== index);

    field.onChange(next);
    setAnnouncement(`${members[index].name} dihapus`);
    focusRef.current = index < next.length ? memberRemoveId(index) : ADD_ID;
  };

  useEffect(() => {
    if (!focusRef.current) return;

    document.getElementById(focusRef.current)?.focus();
    focusRef.current = null;
  }, [members]);

  return (
    <FormSection
      legend="Anggota"
      note={`${members.length} anggota`}
      disabled={isDisabled}
    >
      <FormWide>
        <FormField
          htmlFor={ADD_ID}
          label="Tambah anggota"
          error={fieldState.error?.message}
          hint="Cari jemaat aktif lalu pilih; ulangi untuk anggota berikutnya."
        >
          <ComboboxField
            value=""
            onValueChange={onAdd}
            options={options}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            disabled={isDisabled}
            placeholder="Pilih jemaat"
            emptyMessage="Tidak ada jemaat aktif dengan nama itu"
          />
        </FormField>

        {members.length > 0 ? (
          <ul aria-label="Anggota kelompok" className="mt-3">
            {members.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                index={index}
                isDisabled={isDisabled}
                onRemove={onRemove}
              />
            ))}
          </ul>
        ) : null}

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </FormWide>
    </FormSection>
  );
};
