"use client";

import { Controller } from "react-hook-form";

import { AttachmentField } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import { isWebsiteAnnouncement } from "@/lib/announcement";

import { MAX_ATTACHMENTS } from "../model";

import { type AnnouncementForm } from "./form-options";

const NOTE = "Opsional. Foto atau PDF, maksimal 4 berkas.";

interface PropTypes {
  form: AnnouncementForm;
  isDisabled: boolean;
}

export const AttachmentSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const [category, bapelId] = form.watch(["category", "bapelId"]);
  const isWebsite = isWebsiteAnnouncement({
    category,
    isChurchWide: !bapelId,
  });

  return (
    <FormSection
      legend="Lampiran"
      note={isWebsite ? NOTE : `${NOTE} Lampiran tidak dimuat di website.`}
      disabled={isDisabled}
    >
      <FormWide>
        <Controller
          control={form.control}
          name="listImage"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="listImage"
              label="Lampiran"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              max={MAX_ATTACHMENTS}
              accept="image-pdf"
              isWebsiteToggle={isWebsite}
              addLabel="Tambah lampiran"
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};
