"use client";

import { Eye } from "lucide-react";

import { Button, SelectField } from "@/components/common/control";
import { Panel } from "@/components/common/display";

interface PropTypes {
  bulan: string;
  options: readonly { value: string; label: string }[];
  isPending: boolean;
  onPickBulan: (bulan: string) => void;
  onPreview: () => void;
}

export const RangeSection = (props: PropTypes) => {
  const { bulan, options, isPending, onPickBulan, onPreview } = props;

  return (
    <Panel label="Rentang persembahan">
      <div className="flex flex-wrap items-end gap-3 px-gutter py-4">
        <div className="min-w-0 flex-1 basis-56">
          <label
            htmlFor="bulan"
            className="text-muted-foreground mb-1 block text-caption"
          >
            Bulan
          </label>
          <SelectField
            id="bulan"
            aria-label="Bulan persembahan"
            value={bulan}
            onValueChange={onPickBulan}
            options={options}
          />
        </div>

        <Button
          type="button"
          disabled={isPending || !bulan}
          onClick={onPreview}
        >
          <Eye aria-hidden />
          {isPending ? "Memeriksa…" : "Lihat pratinjau"}
        </Button>
      </div>
    </Panel>
  );
};
