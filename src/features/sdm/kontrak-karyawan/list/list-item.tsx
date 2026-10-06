import { CalendarOff, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Avatar, Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { formatAmount, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  LIST_PATH,
  OPEN_ENDED,
  WEEKLY_DAY_OFF_MISSING,
  contractEditHref,
  periodText,
  phaseOf,
} from "../model";
import {
  CONTRACT_PHASE_LABEL,
  CONTRACT_PHASE_VARIANT,
  CONTRACT_TYPE_LABEL,
  type KontrakKaryawan,
} from "../types";

const saveFocus = (contract: KontrakKaryawan) =>
  saveListFocus(LIST_PATH, contract.code);

const labelOf = (contract: KontrakKaryawan) =>
  `Ubah kontrak ${contract.karyawan.name}`;

const hrefOf = (isCanUpdate: boolean) => (contract: KontrakKaryawan) =>
  isCanUpdate ? contractEditHref(contract.code) : undefined;

const isDayOffMissing = (contract: KontrakKaryawan) =>
  contract.weeklyDayOff.length === 0;

const DayOffMark = () => (
  <span
    title={WEEKLY_DAY_OFF_MISSING}
    className="bg-warning/30 text-warning-foreground shrink-0 rounded-full p-0.5"
  >
    <CalendarOff aria-hidden className="size-3.5" />
    <span className="sr-only">Libur mingguan belum diisi</span>
  </span>
);

const phaseBadge = (contract: KontrakKaryawan) => {
  const phase = phaseOf(contract);

  return (
    <Badge variant={CONTRACT_PHASE_VARIANT[phase]}>
      {CONTRACT_PHASE_LABEL[phase]}
    </Badge>
  );
};

const periodShort = (contract: KontrakKaryawan) =>
  `${formatDateShort(contract.effectiveFrom)} – ${
    contract.effectiveTo ? formatDateShort(contract.effectiveTo) : OPEN_ENDED
  }`;

interface PropTypes {
  contract: KontrakKaryawan;
  isCanUpdate?: boolean;
}

export const KontrakListItem = (props: PropTypes) => {
  const { contract, isCanUpdate = false } = props;

  const href = hrefOf(isCanUpdate)(contract);

  return (
    <DataListRow
      id={contract.code}
      leading={<Avatar label={contract.karyawan.name} />}
      title={contract.karyawan.name}
      meta={`${contract.position} · ${formatAmount(contract.basicSalary)} · ${periodText(contract)}`}
      trailing={
        <>
          {isDayOffMissing(contract) ? <DayOffMark /> : null}
          {phaseBadge(contract)}

          {href ? (
            <Link
              href={href}
              onClick={() => saveFocus(contract)}
              aria-label={labelOf(contract)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
            </Link>
          ) : null}
        </>
      }
    />
  );
};

export function kontrakTable(
  isCanUpdate: boolean,
): DataTableConfig<KontrakKaryawan> {
  return {
    columns: [
      {
        key: "karyawan",
        header: "Karyawan",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.2fr)",
        cell: (contract) => (
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="truncate font-medium"
              title={contract.karyawan.name}
            >
              {contract.karyawan.name}
            </span>
            {isDayOffMissing(contract) ? <DayOffMark /> : null}
          </span>
        ),
      },
      {
        key: "position",
        header: "Jabatan",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,1.7fr)",
        cell: (contract) => (
          <span className="block truncate" title={contract.position}>
            {contract.position}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (contract) => (
          <span className="block truncate tabular-nums">{contract.code}</span>
        ),
      },
      {
        key: "contractType",
        header: "Jenis",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (contract) => (
          <span className="block truncate">
            {CONTRACT_TYPE_LABEL[contract.contractType]}
          </span>
        ),
      },
      {
        key: "basicSalary",
        header: "Gaji pokok",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.6fr)",
        align: "end",
        cell: (contract) => (
          <span className="block truncate tabular-nums">
            {formatAmount(contract.basicSalary)}
          </span>
        ),
      },
      {
        key: "effectiveFrom",
        header: "Berlaku",
        width: "minmax(0,1.8fr)",
        narrowWidth: "minmax(0,1.7fr)",
        cell: (contract) => (
          <span className="block truncate tabular-nums">
            {periodShort(contract)}
          </span>
        ),
      },
      {
        key: "phase",
        header: "Status berlaku",
        width: "minmax(0,1.4fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: phaseBadge,
      },
    ],
    getRowHref: hrefOf(isCanUpdate),
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
