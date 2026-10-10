"use client";

import { Eye } from "lucide-react";

import { Button, SelectField } from "@/components/common/control";
import { Panel } from "@/components/common/display";

interface PropTypes {
  /** Apa yang diposting: "persembahan", "pembayaran", "aset". */
  noun: string;
  bulan: string;
  options: readonly { value: string; label: string }[];
  isPending: boolean;
  onPickBulan: (bulan: string) => void;
  onPreview: () => void;
}

export const RangeSection = (props: PropTypes) => {
  const { noun, bulan, options, isPending, onPickBulan, onPreview } = props;

  return (
    <Panel label={`Rentang ${noun}`}>
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
            aria-label={`Bulan ${noun}`}
            value={bulan}
            onValueChange={onPickBulan}
            options={options}
          />
        </div>

        <Button
          type="button"
          disabled={isPending || !bulan}
          onClick={onPreview}
          isLoading={isPending}
        >
          <Eye aria-hidden />
          {isPending ? "Memeriksa…" : "Lihat pratinjau"}
        </Button>
      </div>
    </Panel>
  );
};
