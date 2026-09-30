"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { SelectField } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { todayJakarta } from "@/lib/date";
import { applyServerError } from "@/lib/form-error";

import { useOpenYear } from "../api";
import {
  openYearSchema,
  openYearText,
  yearOptions,
  type OpenYearValues,
} from "../model";

const YEAR_OPTIONS = yearOptions();

interface PropTypes {
  isOpen: boolean;
  onClose: () => void;
  onOpened: (year: string) => void;
}

export const OpenYearDialog = (props: PropTypes) => {
  const { isOpen, onClose, onOpened } = props;

  const openYear = useOpenYear();
  const form = useForm<OpenYearValues>({
    resolver: zodResolver(openYearSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { year: todayJakarta().slice(0, 4) },
  });
  const { errors, isSubmitting } = form.formState;
  const year = useWatch({ control: form.control, name: "year" });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await openYear.mutateAsync({ year: Number(values.year) });

      onOpened(values.year);
    } catch (error) {
      applyServerError(error, form.setError);
    }
  });

  const onOpenChange = (isNextOpen: boolean) => {
    if (isNextOpen || isSubmitting) return;

    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Buka tahun buku"
      description={openYearText(year)}
      confirmLabel={isSubmitting ? "Membuka…" : "Buka tahun"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <ControlField control={form.control} name="year" label="Tahun">
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={YEAR_OPTIONS}
              disabled={isSubmitting}
            />
          )}
        </ControlField>

        {errors.root ? (
          <p role="alert" className="text-destructive mt-2 text-body">
            {errors.root.message}
          </p>
        ) : null}
      </form>
    </ConfirmDialog>
  );
};
