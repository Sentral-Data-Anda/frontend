"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { SelectField } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { todayJakarta } from "@/lib/date";
import { applyServerError } from "@/lib/form-error";

import { useOpenPayroll } from "../api";
import {
  openPeriodSchema,
  openPeriodText,
  openableMonths,
  yearOptions,
  type OpenPeriodValues,
} from "../model";

const YEAR_OPTIONS = yearOptions();

interface PropTypes {
  isOpen: boolean;
  onClose: () => void;
  onOpened: (code: string) => void;
}

export const OpenPeriodDialog = (props: PropTypes) => {
  const { isOpen, onClose, onOpened } = props;

  const openPeriod = useOpenPayroll();
  const form = useForm<OpenPeriodValues>({
    resolver: zodResolver(openPeriodSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { year: todayJakarta().slice(0, 4), month: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const values = useWatch({ control: form.control });
  const year = values.year ?? "";
  // Bulan yang belum mulai TIDAK ditawarkan, bukan ditolak sesudah dikirim.
  const monthOptions = openableMonths(year);

  const onSubmit = form.handleSubmit(async (picked) => {
    try {
      const response = await openPeriod.mutateAsync({
        year: Number(picked.year),
        month: Number(picked.month),
      });

      form.reset();
      onOpened(response.data.code);
    } catch (error) {
      applyServerError(error, form.setError);
    }
  });

  const onOpenChange = (isNextOpen: boolean) => {
    if (isNextOpen || isSubmitting) return;

    form.reset();
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Buka periode penggajian"
      description={openPeriodText({ year, month: values.month ?? "" })}
      confirmLabel={isSubmitting ? "Membuka…" : "Buka periode"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <ControlField control={form.control} name="year" label="Tahun">
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={(next) => {
                field.onChange(next);
                form.setValue("month", "");
              }}
              options={YEAR_OPTIONS}
              disabled={isSubmitting}
            />
          )}
        </ControlField>

        <ControlField control={form.control} name="month" label="Bulan">
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={monthOptions}
              placeholder="Pilih bulan"
              emptyMessage="Belum ada bulan yang bisa dibuka di tahun ini"
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
