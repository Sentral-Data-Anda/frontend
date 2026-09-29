"use client";

import { Copy } from "lucide-react";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control";
import { FormSection, FormWide, LineItemList } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { formatMoney, formatNumber, formatRupiah } from "@/lib/format";

import {
  MAX_LINES,
  isForeign,
  newLine,
  orderTotalOf,
  overEstimateOf,
  rateCaptionOf,
  toIdr,
} from "../model";
import { OverEstimateAlert } from "../ui";

import type { OrderForm, RateState, RequestEstimate } from "./form-options";
import { ItemRow } from "./item-row";

interface PropTypes {
  form: OrderForm;
  estimate: RequestEstimate | null;
  purpose: string;
  rate: RateState;
  isCopyAllowed: boolean;
  isCopying: boolean;
  copyMessage: string | null;
  onCopy: () => void;
  isDisabled: boolean;
}

export const ItemSection = (props: PropTypes) => {
  const {
    form,
    estimate,
    purpose,
    rate,
    isCopyAllowed,
    isCopying,
    copyMessage,
    onCopy,
    isDisabled,
  } = props;

  const rows = useFieldArray({ control: form.control, name: "items" });
  const [currencyCode, lines] = useWatch({
    control: form.control,
    name: ["currencyCode", "items"],
  });
  const { errors, dirtyFields } = useFormState({ control: form.control });
  const units = useDdlOptions("unit");
  const types = useDdlOptions("type-item");
  const total = orderTotalOf(lines ?? []);
  const totalIdr = rate.rate === null ? null : toIdr(total, rate.rate);
  const isValas = isForeign(currencyCode);
  const over =
    estimate && totalIdr !== null
      ? overEstimateOf({ ...estimate, totalIDR: totalIdr })
      : null;
  const isPriced = (lines ?? []).some((line) => Number(line.unitPrice) > 0);
  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const count = rows.fields.length;

  const onAdd = () => {
    rows.append(newLine(purpose), { shouldFocus: false });
    form.clearErrors("items");
  };

  const summary = (
    <>
      {`${formatNumber(count)} barang · Total ${formatMoney(total, currencyCode)}`}
      {isValas && totalIdr !== null && rate.rateDate ? (
        <span className="text-muted-foreground block font-normal">
          {` ≈ ${formatRupiah(totalIdr)} (${rateCaptionOf(rate.rate ?? 0, rate.rateDate)})`}
        </span>
      ) : null}
    </>
  );

  const empty = estimate ? (
    <div className="flex flex-col items-center gap-3">
      <p>
        {isCopyAllowed
          ? "Salin barang dari permintaan, lalu sesuaikan nama, harga, dan tempat simpannya."
          : "Tambah barang yang dibeli satu per satu."}
      </p>
      {isCopyAllowed ? (
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled || isCopying}
          className="cursor-pointer disabled:cursor-not-allowed"
          onClick={onCopy}
        >
          <Copy aria-hidden />
          {isCopying ? "Menyalin…" : "Salin barang dari permintaan"}
        </Button>
      ) : null}
    </div>
  ) : (
    "Pilih permintaan pembelian dulu, lalu salin barangnya atau tambah satu per satu."
  );

  return (
    <FormSection
      legend="Barang"
      note="Harga satuan termasuk PPN. Ruang simpan = tempat barang disimpan sesudah diterima."
      disabled={isDisabled}
    >
      <FormWide className="space-y-3">
        <LineItemList
          label="Barang dipesan"
          count={count}
          isAddDisabled={isDisabled || count >= MAX_LINES}
          onAdd={onAdd}
          empty={empty}
          summary={count > 0 ? summary : undefined}
          error={itemsError}
          errorId="items-error"
        >
          {rows.fields.map((row, index) => (
            <ItemRow
              key={row.id}
              form={form}
              index={index}
              currencyCode={currencyCode}
              unitOptions={units.options}
              typeOptions={types.options}
              isOptionsLoading={units.isLoading || types.isLoading}
              isDisabled={isDisabled}
              onRemove={rows.remove}
            />
          ))}
        </LineItemList>

        {copyMessage ? (
          <p role="status" className="text-destructive text-body">
            {copyMessage}
          </p>
        ) : null}

        {dirtyFields.currencyCode && isPriced ? (
          <p className="text-muted-foreground text-caption">
            {`Harga ditulis dalam ${currencyCode}. Harga yang sudah diisi tidak dikonversi.`}
          </p>
        ) : null}

        <OverEstimateAlert over={over} tail="Pesanan tetap bisa disimpan." />
      </FormWide>
    </FormSection>
  );
};
