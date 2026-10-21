import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";

import {
  HARI_LIBUR_LIST_PATH,
  formatHolidayDate,
  formatHolidayDateShort,
} from "../model";
import { HOLIDAY_TYPE_LABEL, type HolidayRow } from "../types";

import { RecurringBadge } from "./recurring-badge";

const keyOf = (holiday: HolidayRow) => String(holiday.id);

const editHrefOf = (holiday: HolidayRow) =>
  editHref(MENU.SETTINGS, MENU.HOLIDAY, keyOf(holiday));

const saveFocus = (holiday: HolidayRow) =>
  saveListFocus(HARI_LIBUR_LIST_PATH, keyOf(holiday));

const labelOf = (holiday: HolidayRow) => `Ubah ${holiday.name}`;

interface PropTypes {
  holiday: HolidayRow;
}

export const HolidayListItemRow = (props: PropTypes) => {
  const { holiday } = props;

  return (
    <DataListRow
      id={keyOf(holiday)}
      title={holiday.name}
      meta={`${formatHolidayDate(holiday.date)} · ${HOLIDAY_TYPE_LABEL[holiday.type]}`}
      trailing={
        <>
          {holiday.isRecurring ? (
            <RecurringBadge originDate={holiday.originDate} />
          ) : null}
        </>
      }
    />
  );
};

const deleteLabelOf = (x: HolidayRow) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: HolidayRow) => `${x.name}`;

export function holidayTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: HolidayRow) => void,
): DataTableConfig<HolidayRow> {
  return {
    columns: [
      {
        key: "date",
        header: "Tanggal",
        width: "minmax(0,1.25fr)",
        narrowWidth: "minmax(0,1.25fr)",
        cell: (holiday) => (
          <span className="block truncate tabular-nums">
            {formatHolidayDateShort(holiday.date)}
          </span>
        ),
      },
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (holiday) => (
          <span className="block truncate font-medium" title={holiday.name}>
            {holiday.name}
          </span>
        ),
      },
      {
        key: "type",
        header: "Tipe",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (holiday) => HOLIDAY_TYPE_LABEL[holiday.type],
      },
      {
        key: "isRecurring",
        header: "Berulang",
        width: "minmax(0,0.75fr)",
        isSecondary: true,
        cell: (holiday) =>
          holiday.isRecurring ? (
            <RecurringBadge originDate={holiday.originDate} />
          ) : (
            <OptionalText text={null} empty="Tidak berulang" />
          ),
      },
    ],
    getRowActions: (x) => ({
      label: labelOf(x),
      edit: {
        href: isCanUpdate ? editHrefOf(x) : undefined,
        onNavigate: () => saveFocus(x),
        label: labelOf(x),
      },
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
