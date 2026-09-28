"use client";

import { ImagePlus, Undo2 } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import { AttachmentField, Button } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import type { ServerAttachment } from "@/types/attachment";

import { MAX_PHOTOS, websiteStatusOf } from "../model";

import { type GaleriForm } from "./form-options";
import { SavedPhotos } from "./saved-photos";

const REPLACE_ID = "replacePhotos";

const focusLater = (id: string) =>
  requestAnimationFrame(() => document.getElementById(id)?.focus());

interface PropTypes {
  form: GaleriForm;
  savedPhotos: readonly ServerAttachment[] | null;
  isDisabled: boolean;
}

export const PhotosSection = (props: PropTypes) => {
  const { form, savedPhotos, isDisabled } = props;

  const [isPickingPhotos, isPublish, listImage] = useWatch({
    control: form.control,
    name: ["isPickingPhotos", "isPublish", "listImage"],
  });
  const isReadOnly = savedPhotos !== null && !isPickingPhotos;
  const websiteStatus = websiteStatusOf(
    isPublish === "true",
    isReadOnly ? savedPhotos : listImage,
  );
  const status = websiteStatus ? (
    <p className="text-muted-foreground text-body">{websiteStatus}</p>
  ) : null;

  const onStartReplace = () => {
    form.setValue("isPickingPhotos", true, { shouldDirty: true });
    focusLater("listImage");
  };

  const onCancelReplace = () => {
    form.setValue("listImage", [], { shouldDirty: true });
    form.setValue("isPickingPhotos", false, { shouldDirty: true });
    form.clearErrors("listImage");
    focusLater(REPLACE_ID);
  };

  return (
    <FormSection
      legend="Foto"
      note={`Maksimal ${MAX_PHOTOS} foto. Foto tampil di website hanya bila album terbit dan fotonya dicentang “Tampil di website”.`}
      disabled={isDisabled}
    >
      <FormWide className="flex flex-col gap-3">
        {isReadOnly ? (
          <>
            <SavedPhotos photos={savedPhotos} />
            {status}
            <div className="flex flex-col items-start gap-1.5">
              <Button
                id={REPLACE_ID}
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={onStartReplace}
              >
                <ImagePlus aria-hidden />
                Ganti semua foto
              </Button>
              <p className="text-muted-foreground text-caption">
                Foto tersimpan tidak bisa diubah satu per satu. Untuk mengganti
                foto atau centang website, pilih ulang semua foto.
              </p>
            </div>
          </>
        ) : (
          <>
            {savedPhotos ? (
              <p className="border-warning bg-warning/10 rounded-control border px-2 py-1 text-body">
                Menyimpan foto baru mengganti semua {savedPhotos.length} foto
                lama, termasuk pengaturan tampil di website.
              </p>
            ) : null}

            <Controller
              control={form.control}
              name="listImage"
              render={({ field, fieldState }) => (
                <AttachmentField
                  id="listImage"
                  label="Foto album"
                  isLabelVisible={false}
                  value={field.value}
                  onValueChange={field.onChange}
                  max={MAX_PHOTOS}
                  accept="image"
                  isWebsiteToggle
                  addLabel="Tambah foto"
                  error={fieldState.error?.message}
                  disabled={isDisabled}
                />
              )}
            />

            {status}

            {savedPhotos ? (
              <Button
                type="button"
                variant="outline"
                className="w-fit cursor-pointer"
                onClick={onCancelReplace}
              >
                <Undo2 aria-hidden />
                Batal ganti foto
              </Button>
            ) : null}
          </>
        )}
      </FormWide>
    </FormSection>
  );
};
