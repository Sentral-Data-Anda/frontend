import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  PARTICIPANT_KIND_LABEL,
  PENDAFTARAN_LIST_PATH,
  maskPhone,
  registrationHref,
} from "../model";
import type { Registration } from "../types";
import { RegistrationStatus } from "../ui";

const saveFocus = (registration: Registration) =>
  saveListFocus(PENDAFTARAN_LIST_PATH, registration.code);

const hrefOf = (registration: Registration) =>
  registrationHref(registration.code);

const labelOf = (registration: Registration) =>
  `Lihat pendaftaran ${registration.participantName}, ${registration.event.name}`;

const kindOf = (registration: Registration) =>
  registration.jemaat
    ? PARTICIPANT_KIND_LABEL.jemaat
    : PARTICIPANT_KIND_LABEL.tamu;

const metaOf = (registration: Registration) =>
  [
    registration.jemaat ? null : PARTICIPANT_KIND_LABEL.tamu,
    maskPhone(registration.participantPhone),
    registration.event.name,
  ]
    .filter(Boolean)
    .join(" · ");

interface PropTypes {
  registration: Registration;
}

export const PendaftaranListItemRow = (props: PropTypes) => {
  const { registration } = props;

  return (
    <DataListRow
      id={registration.code}
      className="hover:bg-card relative transition-colors"
      leading={<Avatar label={registration.participantName} />}
      title={
        <Link
          href={hrefOf(registration)}
          onClick={() => saveFocus(registration)}
          aria-label={labelOf(registration)}
          className={TABLE_ROW_LINK}
        >
          {registration.participantName}
        </Link>
      }
      meta={metaOf(registration)}
      trailing={<RegistrationStatus status={registration.status} />}
    />
  );
};

type Column = DataTableColumn<Registration>;

const truncated = (text: string) => (
  <span className="block truncate" title={text}>
    {text}
  </span>
);

const COLUMNS: Column[] = [
  {
    key: "participant",
    header: "Peserta",
    width: "minmax(0,2.2fr)",
    cell: (registration) => (
      <span className="block min-w-0">
        <span
          className="block truncate font-medium"
          title={registration.participantName}
        >
          {registration.participantName}
        </span>
        <span className="text-muted-foreground block truncate text-caption tabular-nums">
          {registration.code}
        </span>
      </span>
    ),
  },
  {
    key: "event",
    header: "Event",
    width: "minmax(0,2fr)",
    cell: (registration) => truncated(registration.event.name),
  },
  {
    key: "kind",
    header: "Jenis",
    width: "minmax(0,0.8fr)",
    cell: (registration) => truncated(kindOf(registration)),
  },
  {
    key: "phone",
    header: "Telepon",
    width: "minmax(0,1.1fr)",
    isSecondary: true,
    cell: (registration) => (
      <span className="block truncate tabular-nums">
        {maskPhone(registration.participantPhone)}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Didaftarkan",
    width: "minmax(0,1fr)",
    isSecondary: true,
    cell: (registration) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(registration.createdAt)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.3fr)",
    cell: (registration) => <RegistrationStatus status={registration.status} />,
  },
];

export function pendaftaranTable(): DataTableConfig<Registration> {
  return {
    columns: COLUMNS,
    getRowHref: hrefOf,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
