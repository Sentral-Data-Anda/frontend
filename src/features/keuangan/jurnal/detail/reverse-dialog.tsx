"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { DateField, Input } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { todayJakarta } from "@/lib/date";

import {
  DESCRIPTION_MAX,
  REVERSE_NOTE,
  emptyReverseForm,
  reverseFormSchema,
  toReversePayload,
  type ReverseFormValues,
} from "../model";
import type { JournalEntryDetail, ReversePayload } from "../types";

interface PropTypes {
  entry: JournalEntryDetail;
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onReverse: (payload: ReversePayload) => void;
}

export const ReverseDialog = (props: PropTypes) => {
  const { entry, isOpen, isPending, onOpenChange, onReverse } = props;

  const form = useForm<ReverseFormValues>({
    resolver: zodResolver(reverseFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: emptyReverseForm(entry),
  });

  const onSubmit = form.handleSubmit((values) =>
    onReverse(toReversePayload(values)),
  );

  useEffect(() => {
    if (isOpen) form.reset(emptyReverseForm(entry));
  }, [isOpen, entry, form]);

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={(next) => (isPending ? undefined : onOpenChange(next))}
      title={`Balikkan ${entry.code}`}
      description={`Entri pembalik baru dibuat dengan debit dan kredit yang bertukar. ${entry.code} tetap ada dan ditandai Dibalik.`}
      confirmLabel={isPending ? "Membalik…" : "Balikkan"}
      isPending={isPending}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!isPending) void onSubmit();
        }}
        className="space-y-3"
      >
        <ControlField
          control={form.control}
          name="entryDate"
          label="Tanggal pembalikan"
          hint={REVERSE_NOTE}
        >
          {(field) => (
            <DateField
              id="entryDate"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              max={todayJakarta()}
              label="Tanggal pembalikan"
              disabled={isPending}
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="description"
          label="Keterangan"
        >
          {(field) => (
            <Input
              {...field}
              maxLength={DESCRIPTION_MAX}
              disabled={isPending}
              autoCapitalize="sentences"
            />
          )}
        </ControlField>
      </form>
    </ConfirmDialog>
  );
};
