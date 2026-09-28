import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { GALERI_LIST_PATH, galeriEditHref } from "../model";
import type { Album } from "../types";

interface PropTypes {
  album: Album;
}

export const EditLink = (props: PropTypes) => {
  const { album } = props;

  return (
    <Link
      href={galeriEditHref(album.code)}
      onClick={() => saveListFocus(GALERI_LIST_PATH, album.code)}
      aria-label={`Ubah ${album.name}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
