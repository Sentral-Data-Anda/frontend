import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  JADWAL_PELAYAN_LIST_PATH,
  formatScheduleDate,
  jadwalEditHref,
} from "../model";
import type { JadwalPelayan } from "../types";

interface PropTypes {
  jadwal: JadwalPelayan;
}

export const EditLink = (props: PropTypes) => {
  const { jadwal } = props;

  return (
    <Link
      href={jadwalEditHref(jadwal.code)}
      onClick={() => saveListFocus(JADWAL_PELAYAN_LIST_PATH, jadwal.code)}
      aria-label={`Ubah ${jadwal.name}, ${formatScheduleDate(jadwal.date)}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
