"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { cn } from "@/lib/utils";

interface PropTypes {
  isDeleting: boolean;
  error: string | null;
  deactivateHref: string | null;
  onDelete: () => void;
}

export const DeleteAction = (props: PropTypes) => {
  const { isDeleting, error, deactivateHref, onDelete } = props;

  return (
    <section aria-label="Hapus supplier" className="space-y-3 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground min-w-0 flex-[1_1_16rem] text-body">
          Hapus hanya supplier yang belum pernah dipakai. Supplier yang sudah
          dipakai cukup dinonaktifkan.
        </p>
        <Button
          type="button"
          variant="destructive"
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? "Menghapus…" : "Hapus supplier"}
        </Button>
      </div>

      {error ? (
        <div className="space-y-2">
          <FormAlert title="Supplier belum terhapus." message={error} />
          {deactivateHref ? (
            <Link
              href={deactivateHref}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer",
              )}
            >
              Nonaktifkan
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
