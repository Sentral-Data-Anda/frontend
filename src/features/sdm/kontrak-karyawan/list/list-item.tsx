import { CalendarOff } from "lucide-react";

import { Avatar, Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { formatAmount } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  LIST_PATH,
  WEEKLY_DAY_OFF_MISSING,
  contractEditHref,
  periodShortText,
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
  isCanUpdate ? contractEditHref(contract.publicId) : undefined;

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

interface PropTypes {
  contract: KontrakKaryawan;
}

export const KontrakListItem = (props: PropTypes) => {
  const { contract } = props;

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
        </>
      }
    />
  );
};

const deleteLabelOf = (x: KontrakKaryawan) =>
  `Hapus kontrak ${x.karyawan.name}`;

export const deleteTargetLabelOf = (x: KontrakKaryawan) =>
  `kontrak ${x.karyawan.name}`;

export function kontrakTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: KontrakKaryawan) => void,
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
          <span
            className="block truncate"
            title={CONTRACT_TYPE_LABEL[contract.contractType]}
          >
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
          <span
            className="block truncate tabular-nums"
            title={formatAmount(contract.basicSalary)}
          >
            {formatAmount(contract.basicSalary)}
          </span>
        ),
      },
      {
        key: "effectiveFrom",
        header: "Berlaku",
        width: "minmax(0,1.8fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (contract) => (
          <span
            className="block truncate tabular-nums"
            title={periodText(contract)}
          >
            {periodShortText(contract)}
          </span>
        ),
      },
      {
        key: "phase",
        header: "Status berlaku",
        width: "minmax(0,1.4fr)",
        narrowWidth: "minmax(0,1.7fr)",
        cell: phaseBadge,
      },
    ],
    getRowActions: (x) => ({
      label: labelOf(x),
      edit: {
        href: hrefOf(isCanUpdate)(x),
        onNavigate: () => saveFocus(x),
        label: labelOf(x),
      },
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
