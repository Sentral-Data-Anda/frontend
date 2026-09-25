import { Eye, Lock } from "lucide-react";
import type { Ref } from "react";

import { Button } from "@/components/common/control";

interface PropTypes {
  controlsId: string;
  showRef: Ref<HTMLButtonElement>;
  onShow: () => void;
}

export const OfferingVeil = (props: PropTypes) => {
  const { controlsId, showRef, onShow } = props;

  return (
    <div className="relative">
      <ul aria-hidden className="select-none">
        {[0, 1, 2].map((row) => (
          <li
            key={row}
            className="border-border flex h-14 items-center gap-3 border-b last:border-b-0"
          >
            <div className="flex-1 space-y-1.5 blur-[2px]">
              <span className="bg-muted block h-3 w-40 max-w-full rounded" />
              <span className="bg-muted/60 block h-2.5 w-24 rounded" />
            </div>
            <span className="text-muted-foreground text-body tracking-widest blur-[2px]">
              Rp •••••
            </span>
          </li>
        ))}
      </ul>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background/90 flex flex-col items-center gap-2 rounded-lg px-5 py-3 text-center">
          <Lock className="text-muted-foreground size-5" aria-hidden />
          <p className="text-body font-medium">Riwayat disembunyikan</p>
          <Button
            ref={showRef}
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={false}
            aria-controls={controlsId}
            onClick={onShow}
          >
            <Eye className="size-4" aria-hidden />
            Tampilkan
          </Button>
        </div>
      </div>
    </div>
  );
};
