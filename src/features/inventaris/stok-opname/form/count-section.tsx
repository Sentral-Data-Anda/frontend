"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ListPlus } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useFormState } from "react-hook-form";

import { Button, ComboboxField } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import { useBoolean } from "@/hooks/use-boolean";
import { useDdlSearch } from "@/hooks/use-ddl-options";
import { useIsTableWidth } from "@/hooks/use-media";
import { FetchError } from "@/lib/api/fetcher";

import { fetchStockItems, findCachedStockItem, stockItemDdlPath } from "../api";
import { stockItemHintOf, toCountLine } from "../model";
import type { StockItemOption } from "../types";

import { CountRow } from "./count-row";
import { CountSummary } from "./count-summary";
import type { OpnameForm } from "./form-options";

const GRID =
  "grid grid-cols-[minmax(0,2fr)_6rem_5rem_minmax(0,2fr)_2.25rem] gap-x-3";

interface PropTypes {
  form: OpnameForm;
  roomId: string;
  roomName: string;
  isDisabled: boolean;
}

export const CountSection = (props: PropTypes) => {
  const { form, roomId, roomName, isDisabled } = props;

  const queryClient = useQueryClient();
  const rows = useFieldArray({ control: form.control, name: "items" });
  const { errors } = useFormState({ control: form.control, name: "items" });
  const isTable = useIsTableWidth() === true;
  const isLoadingItems = useBoolean();
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const search = useDdlSearch<StockItemOption>(
    stockItemDdlPath(roomId),
    "id",
    null,
    stockItemHintOf,
  );
  const taken = new Set(rows.fields.map((row) => row.stockItemId));
  const options = search.options.map((option) =>
    taken.has(option.value)
      ? { ...option, isDisabled: true, hint: "Sudah di daftar" }
      : option,
  );
  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const isEmpty = rows.fields.length === 0;

  const onLoad = async () => {
    setLoadMessage(null);
    isLoadingItems.onTrue();
    try {
      const found = await fetchStockItems(queryClient, roomId);

      if (found.length === 0) {
        setLoadMessage(
          roomId
            ? `Belum ada barang persediaan di ${roomName}.`
            : "Belum ada barang persediaan.",
        );
        return;
      }

      rows.replace(found.map(toCountLine));
      form.clearErrors("items");
    } catch (error) {
      setLoadMessage(
        error instanceof FetchError
          ? error.message
          : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      );
    } finally {
      isLoadingItems.onFalse();
    }
  };

  const onPick = (id: string) => {
    const found = findCachedStockItem(queryClient, id);

    if (!found || taken.has(id)) return;

    rows.append(toCountLine(found), { shouldFocus: false });
    form.clearErrors("items");
  };

  const items = rows.fields.map((row, index) => (
    <CountRow
      key={row.id}
      form={form}
      index={index}
      isTable={isTable}
      isDisabled={isDisabled}
      onRemove={rows.remove}
    />
  ));

  return (
    <FormSection
      legend="Hitungan"
      note="Isi jumlah yang benar-benar ada di rak. Stok di aplikasi diambil saat disimpan."
      disabled={isDisabled}
    >
      <FormWide className="space-y-3">
        {isEmpty ? null : (
          <>
            <CountSummary form={form} />

            {isTable ? (
              <div className="border-border bg-card rounded-control border">
                <div
                  aria-hidden
                  className={`${GRID} text-muted-foreground px-3 py-2 text-caption font-medium`}
                >
                  <span>Barang</span>
                  <span className="text-right">Fisik</span>
                  <span className="text-right">Selisih</span>
                  <span>Catatan</span>
                  <span />
                </div>
                <ol aria-label="Barang yang dihitung" className={GRID}>
                  {items}
                </ol>
              </div>
            ) : (
              <ol aria-label="Barang yang dihitung" className="space-y-2">
                {items}
              </ol>
            )}
          </>
        )}

        <div className="flex flex-wrap items-end gap-3">
          {isEmpty ? (
            <Button
              type="button"
              variant="outline"
              disabled={isDisabled || isLoadingItems.value}
              className="cursor-pointer disabled:cursor-not-allowed"
              onClick={() => void onLoad()}
            >
              <ListPlus aria-hidden />
              {isLoadingItems.value
                ? "Memuat barang…"
                : roomId
                  ? `Muat barang di ${roomName}`
                  : "Muat semua barang"}
            </Button>
          ) : null}

          <div className="min-w-0 flex-[1_1_16rem]">
            <label
              htmlFor="items"
              className="mb-1.5 block text-body font-medium"
            >
              {isEmpty ? "Atau tambah satu barang" : "Tambah barang"}
            </label>
            <ComboboxField
              id="items"
              value=""
              onValueChange={onPick}
              options={options}
              isLoading={search.isLoading}
              onSearch={search.onSearch}
              disabled={isDisabled}
              placeholder="Cari kode atau nama barang"
              emptyMessage={
                roomId
                  ? `Tidak ada barang persediaan di ${roomName}`
                  : "Tidak ada barang persediaan"
              }
              aria-invalid={itemsError ? true : undefined}
              aria-describedby={itemsError ? "items-error" : undefined}
            />
          </div>
        </div>

        {loadMessage ? (
          <p role="status" className="text-muted-foreground text-body">
            {loadMessage}
          </p>
        ) : null}

        {itemsError ? (
          <p id="items-error" className="text-destructive text-body">
            {itemsError}
          </p>
        ) : null}
      </FormWide>
    </FormSection>
  );
};
