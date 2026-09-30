"use client";

import { useWatch } from "react-hook-form";

import {
  ChoiceField,
  ComboboxField,
  DateField,
  DdlField,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions, useDdlSearch } from "@/hooks/use-ddl-options";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";

import {
  RECEIVED_BY_NOTE,
  RECEIVE_METHOD_OPTIONS,
  GATEWAY_NOTE,
} from "../model";
import type { IbadahOption } from "../types";
import type { PersembahanForm } from "../use-persembahan-form";

interface PropTypes {
  form: PersembahanForm;
  isDisabled: boolean;
}

export const HeaderSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const receivedDate = useWatch({
    control: form.control,
    name: "receivedDate",
  });
  const ibadah = useDdlOptions<IbadahOption>(
    receivedDate ? `ibadah?date=${receivedDate}` : null,
    "id",
    "",
    (row) => formatDate(row.date),
  );
  const receivedBy = useDdlSearch("jemaat");

  return (
    <FormSection legend="Penerimaan" note={GATEWAY_NOTE} disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="receivedDate"
        label="Tanggal terima"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            max={todayJakarta()}
            isClearable={false}
            label="Tanggal terima"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="receiveMethod"
        label="Cara terima"
      >
        {(field) => (
          <ChoiceField
            id="receiveMethod"
            label="Cara terima"
            isLabelVisible={false}
            value={field.value}
            onValueChange={field.onChange}
            options={RECEIVE_METHOD_OPTIONS}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="ibadahId"
        label="Ibadah"
        isOptional
        hint="Hanya ibadah pada tanggal terima."
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={ibadah.options}
            isLoading={ibadah.isLoading}
            disabled={isDisabled}
            placeholder="Pilih ibadah"
            emptyMessage="Tidak ada ibadah pada tanggal itu"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="receivedBy"
        label="Diterima oleh"
        isOptional
        hint={RECEIVED_BY_NOTE}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={receivedBy.options}
            isLoading={receivedBy.isLoading}
            onSearch={receivedBy.onSearch}
            disabled={isDisabled}
            isClearable
            placeholder="Cari nama penghitung"
            emptyMessage="Jemaat tidak ditemukan"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
