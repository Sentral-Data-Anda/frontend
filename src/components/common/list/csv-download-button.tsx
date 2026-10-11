"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/common/control";

interface PropTypes {
  isPending?: boolean;
  onDownload: () => void;
  label?: string;
}

/** Mengunduh isi yang sedang tersaring sebagai CSV. */
export const CsvDownloadButton = (props: PropTypes) => {
  const { isPending = false, onDownload, label = "CSV" } = props;

  return (
    <Button
      type="button"
      variant="outline"
      className="cursor-pointer"
      isLoading={isPending}
      onClick={onDownload}
    >
      <Download aria-hidden />
      {isPending ? "Menyiapkan…" : label}
    </Button>
  );
};
