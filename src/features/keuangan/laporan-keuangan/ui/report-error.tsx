"use client";

import { Button } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";

import type { ReportQuery } from "../types";

interface PropTypes {
  title: string;
  query: ReportQuery;
}

export const ReportError = (props: PropTypes) => {
  const { title, query } = props;

  return (
    <div className="flex flex-col items-start gap-2 px-gutter">
      <FormAlert
        title={title}
        message={query.error?.message ?? "Coba muat ulang laporannya."}
      />

      <Button
        type="button"
        variant="outline"
        className="cursor-pointer"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        {query.isFetching ? "Memuat…" : "Coba lagi"}
      </Button>
    </div>
  );
};
