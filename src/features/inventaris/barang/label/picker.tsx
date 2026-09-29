import { Button, CheckboxGroupField } from "@/components/common/control";

import type { LabelAsset } from "./model";

interface PropTypes {
  assets: LabelAsset[];
  value: string[];
  onValueChange: (value: string[]) => void;
  hint?: string;
}

export const LabelPicker = (props: PropTypes) => {
  const { assets, value, onValueChange, hint } = props;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.length === assets.length}
          onClick={() => onValueChange(assets.map((asset) => asset.code))}
        >
          Pilih semua
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.length === 0}
          onClick={() => onValueChange([])}
        >
          Kosongkan
        </Button>
      </div>
      <CheckboxGroupField
        id="label-assets"
        label="Barang yang dicetak"
        isLabelVisible={false}
        value={value}
        onValueChange={onValueChange}
        options={assets.map((asset) => ({
          value: asset.code,
          label: asset.name,
          hint: asset.code,
        }))}
        hint={hint}
      />
    </div>
  );
};
