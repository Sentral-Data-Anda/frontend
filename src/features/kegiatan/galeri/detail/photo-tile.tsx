import type { Ref } from "react";

import { MediaThumb } from "@/components/common/display";
import type { ServerAttachment } from "@/types/attachment";

import { WebsiteMark } from "../ui";

interface PropTypes {
  photo: ServerAttachment;
  label: string;
  buttonRef: Ref<HTMLButtonElement>;
  onOpen: () => void;
}

export const PhotoTile = (props: PropTypes) => {
  const { photo, label, buttonRef, onOpen } = props;

  return (
    <li>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        onClick={onOpen}
        className="focus-visible:ring-ring hover:ring-border relative block w-full cursor-pointer rounded-control outline-none hover:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <MediaThumb src={photo.url} alt={photo.name} size="fill" />
        {photo.showOnWebsite ? <WebsiteMark /> : null}
      </button>
    </li>
  );
};
