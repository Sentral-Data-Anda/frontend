"use client";

import { Controller } from "react-hook-form";

import { AttachmentField } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";

import { MAX_DETAIL_PHOTOS } from "../model";

import { type RuangForm } from "./form-options";

interface PropTypes {
  form: RuangForm;
  isDisabled: boolean;
}

export const PhotosSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Foto"
      note="Opsional. Foto membantu peminjam mengenali ruang."
      disabled={isDisabled}
    >
      <FormWide>
        <Controller
          control={form.control}
          name="mainImage"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="mainImage"
              label="Foto utama"
              value={field.value}
              onValueChange={field.onChange}
              max={1}
              accept="image"
              addLabel="Pilih foto utama"
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>

      <FormWide>
        <Controller
          control={form.control}
          name="detailImage"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="detailImage"
              label="Foto detail"
              value={field.value}
              onValueChange={field.onChange}
              max={MAX_DETAIL_PHOTOS}
              accept="image"
              addLabel="Tambah foto"
              hint={`Maksimal ${MAX_DETAIL_PHOTOS} foto.`}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};
