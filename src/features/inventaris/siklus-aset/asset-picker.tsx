"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ComboboxField } from "@/components/common/control";
import type { FieldControlProps } from "@/components/common/form";
import { useDdlSearch } from "@/hooks/use-ddl-options";

import { findAssetRow, usePresetAsset } from "./api";
import { assetCostHintOf, assetHintOf } from "./model";
import type { AssetOption } from "./types";

interface PropTypes extends FieldControlProps {
  value: string;
  onValueChange: (value: string, row: AssetOption | undefined) => void;
  onPreset: (row: AssetOption) => void;
  disabled: boolean;
  isCostShown?: boolean;
}

export const AssetPicker = (props: PropTypes) => {
  const {
    value,
    onValueChange,
    onPreset,
    disabled,
    isCostShown = false,
    ...aria
  } = props;

  const queryClient = useQueryClient();
  const presetCode = useSearchParams().get("barang") ?? "";
  const preset = usePresetAsset(presetCode);
  const presetRef = useRef(false);
  const hintOf = isCostShown ? assetCostHintOf : assetHintOf;
  const picked = value ? findAssetRow(queryClient, value) : undefined;
  const assets = useDdlSearch<AssetOption>(
    "asset",
    "id",
    picked
      ? { value: String(picked.id), label: picked.name, hint: hintOf(picked) }
      : null,
    hintOf,
  );

  const onPick = (next: string) =>
    onValueChange(next, next ? findAssetRow(queryClient, next) : undefined);

  useEffect(() => {
    if (presetRef.current || !preset.data || value) return;

    presetRef.current = true;
    onPreset(preset.data);
  }, [preset.data, value, onPreset]);

  return (
    <ComboboxField
      {...aria}
      value={value}
      onValueChange={onPick}
      options={assets.options}
      isLoading={assets.isLoading}
      onSearch={assets.onSearch}
      disabled={disabled}
      placeholder="Pilih barang"
      emptyMessage="Tidak ada barang aktif dengan nama atau kode itu"
    />
  );
};
