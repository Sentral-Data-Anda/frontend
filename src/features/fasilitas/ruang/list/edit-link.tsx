import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { RUANG_LIST_PATH, ruangEditHref } from "../model";
import type { Room } from "../types";

interface PropTypes {
  room: Room;
}

export const EditLink = (props: PropTypes) => {
  const { room } = props;

  return (
    <Link
      href={ruangEditHref(room.code)}
      onClick={() => saveListFocus(RUANG_LIST_PATH, room.code)}
      aria-label={`Ubah ${room.name}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
