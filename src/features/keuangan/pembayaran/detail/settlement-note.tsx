import { buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { AppLink } from "@/components/common/link";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { KAS_MASUK_CREATE_PATH, SETTLEMENT_NOTE } from "../model";

export const SettlementNote = () => {
  const { isCanCreate } = useMenuAccess(MENU.KAS_MASUK);

  return (
    <div className="space-y-2">
      <FormAlert
        tone="info"
        title="Uangnya belum ada di rekening gereja"
        message={SETTLEMENT_NOTE}
      />

      {isCanCreate ? (
        <AppLink
          href={KAS_MASUK_CREATE_PATH}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "cursor-pointer",
          )}
        >
          Catat pencairan di Kas Masuk
        </AppLink>
      ) : null}
    </div>
  );
};
