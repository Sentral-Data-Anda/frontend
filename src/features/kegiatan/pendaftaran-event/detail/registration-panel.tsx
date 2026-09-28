import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  PANEL_TITLE,
  Panel,
} from "@/components/common/display";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { eventEditHref, formatEventTime } from "../model";
import type { RegistrationDetail } from "../types";
import { RegistrationStatus } from "../ui";

const LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary";

interface PropTypes {
  registration: RegistrationDetail;
  isCanUpdateEvent: boolean;
}

export const RegistrationPanel = (props: PropTypes) => {
  const { registration, isCanUpdateEvent } = props;
  const { event, jemaat } = registration;

  return (
    <Panel label="Pendaftaran">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Pendaftaran</h2>

      <DescriptionList className="px-gutter pb-2">
        <DescriptionItem label="Event">
          {isCanUpdateEvent ? (
            <Link href={eventEditHref(event.code)} className={LINK}>
              {event.name}
            </Link>
          ) : (
            event.name
          )}
        </DescriptionItem>
        <DescriptionItem label="Waktu event">
          <span className="tabular-nums">{formatEventTime(event)}</span>
        </DescriptionItem>
        <DescriptionItem label="Jenis">
          {jemaat ? (
            <>
              Jemaat{" "}
              <span className="text-muted-foreground font-normal tabular-nums">
                {jemaat.code}
              </span>
            </>
          ) : (
            "Tamu"
          )}
        </DescriptionItem>
        <DescriptionItem label="Telepon">
          <a
            href={`tel:${registration.participantPhone.replace(/[\s-]/g, "")}`}
            className={cn(LINK, "tabular-nums")}
          >
            {registration.participantPhone}
          </a>
        </DescriptionItem>
        <DescriptionItem label="Email">
          {registration.participantEmail ? (
            <a
              href={`mailto:${registration.participantEmail}`}
              className={LINK}
            >
              {registration.participantEmail}
            </a>
          ) : (
            <OptionalText empty="Tanpa email" />
          )}
        </DescriptionItem>
        <DescriptionItem label="Status">
          <RegistrationStatus status={registration.status} />
        </DescriptionItem>
        <DescriptionItem label="Didaftarkan">
          <span className="tabular-nums">
            {formatDateTime(registration.createdAt)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{registration.code}</span>
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
