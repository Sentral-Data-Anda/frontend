import { X } from "lucide-react";

import { Button } from "@/components/common/control";
import { Avatar } from "@/components/common/display";

import { type MemberValue } from "../model";

export const memberRemoveId = (index: number) => `members-${index}-remove`;

interface PropTypes {
  member: MemberValue;
  index: number;
  isDisabled: boolean;
  onRemove: (index: number) => void;
}

export const MemberRow = (props: PropTypes) => {
  const { member, index, isDisabled, onRemove } = props;

  return (
    <li className="flex h-12 items-center gap-3 border-b border-border last:border-b-0">
      <Avatar label={member.name} />

      <p className="min-w-0 flex-1 truncate text-body" title={member.name}>
        <span className="font-medium">{member.name}</span>
        {member.code ? (
          <span className="text-muted-foreground tabular-nums">
            {" "}
            · {member.code}
          </span>
        ) : null}
      </p>

      <Button
        id={memberRemoveId(index)}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Hapus ${member.name} dari anggota`}
        className="cursor-pointer disabled:cursor-not-allowed"
        disabled={isDisabled}
        onClick={() => onRemove(index)}
      >
        <X aria-hidden />
      </Button>
    </li>
  );
};
