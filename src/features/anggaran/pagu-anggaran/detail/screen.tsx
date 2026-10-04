"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";

import { useAllocationDetail } from "../api";
import { PAGU_LIST_PATH, allocationEditHref } from "../model";

import { ProgramList } from "./program-list";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Pagu Anggaran";

interface PropTypes {
  publicId: string;
}

export const AllocationDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const { isCanView, isCanUpdate } = useMenuAccess(MENU.PAGU_ANGGARAN);
  const listReturn = useListReturn(PAGU_LIST_PATH);
  const detail = useAllocationDetail(isCanView ? publicId : undefined);
  const allocation = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.ANGGARAN)} />

        <EmptyState
          title="Anda tidak memiliki akses ke Pagu Anggaran"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="pagu anggaran"
        backHref={listReturn}
        backLabel="Kembali ke Pagu Anggaran"
      />
    );
  }

  if (!allocation) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat pagu anggaran"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                >
                  {detail.isFetching ? "Memuat…" : "Coba lagi"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="px-gutter">
            <Panel>
              <div className="px-gutter py-2">
                <DescriptionSkeleton label="Memuat pagu anggaran" rows={4} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title={allocation.bapel?.name ?? TITLE}
        subtitle={`Pagu anggaran ${allocation.budgetYear.label}`}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate ? (
            <Link
              href={allocationEditHref(allocation.publicId)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "shrink-0 cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
              Ubah
            </Link>
          ) : null
        }
      />

      <div className="px-gutter">
        <SummaryPanel allocation={allocation} />
      </div>

      <div className="px-gutter">
        <ProgramList bapelId={allocation.bapelId} year={allocation.year} />
      </div>
    </div>
  );
};
