"use client";

import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { FetchError } from "@/lib/api/fetcher";

import { NoCycleAccess } from "./no-cycle-access";

interface PropTypes {
  noun: string;
  backHref: string;
  query: {
    data: unknown;
    error: Error | null;
    isFetching: boolean;
    refetch: () => unknown;
  };
  children: ReactNode;
}

export const DetailFrame = (props: PropTypes) => {
  const { noun, backHref, query, children } = props;

  const { isCanView } = useMenuAccess(MENU.SIKLUS_ASET);
  const isNotFound =
    query.error instanceof FetchError && query.error.status === 404;

  const header = (
    <PageHeader title="Siklus Aset" backHref={backHref} isBackPersistent />
  );

  if (!isCanView) return <NoCycleAccess />;

  if (isNotFound) {
    return (
      <FormNotFound
        noun={noun}
        backHref={backHref}
        backLabel="Kembali ke Siklus Aset"
      />
    );
  }

  if (query.error && !query.data) {
    return (
      <div className="pb-8">
        {header}
        <div
          role="alert"
          className="flex flex-col items-center px-gutter py-12 text-center"
        >
          <TriangleAlert className="text-destructive mb-3 size-8" aria-hidden />
          <p className="text-body font-medium">Gagal memuat {noun}</p>
          <p className="text-muted-foreground mt-1 text-body">
            {query.error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="mt-4"
          >
            {query.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="pb-8">
        {header}
        <div className="px-gutter">
          <Panel>
            <div className="px-gutter py-2">
              <DescriptionSkeleton label={`Memuat ${noun}`} rows={7} />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  return children;
};
