import { useWatch } from "react-hook-form";

import { DateField, DdlField, TimeField } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { endOfYearIso, todayJakarta } from "@/lib/date";

import type { LoanRoomDetail } from "../types";

import type { LoanForm } from "./form-options";
import { RoomSchedule } from "./room-schedule";

interface PropTypes {
  form: LoanForm;
  isDisabled: boolean;
  isReadOnly: boolean;
  saved?: LoanRoomDetail;
}

export const ScheduleSection = (props: PropTypes) => {
  const { form, isDisabled, isReadOnly, saved } = props;

  const [roomId, date, startTime, endTime, repeat] = useWatch({
    control: form.control,
    name: ["roomId", "date", "startTime", "endTime", "repeat"],
  });
  const isOff = isDisabled || isReadOnly;
  const savedRoomId = saved ? String(saved.room.id) : "";
  const rooms = useDdlOptions("room", "id", savedRoomId);
  const dateMax = endOfYearIso(1);
  // R-03 (2026-11-04): a booking may not be made for a day that has passed.
  // The server refuses it; the field stops the mistake before it is typed.
  const dateMin = todayJakarta();
  const dateLabel = repeat === "WEEKLY" ? "Tanggal mulai" : "Tanggal";
  const roomName =
    roomId === savedRoomId && saved
      ? saved.room.name
      : (rooms.options.find((room) => room.value === roomId)?.label ?? "");

  return (
    <FormSection legend="Ruang dan waktu" disabled={isOff}>
      <ControlField
        control={form.control}
        name="roomId"
        label="Ruang"
        isRequired
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={rooms.options}
            isLoading={rooms.isLoading}
            disabled={isOff}
            placeholder="Pilih ruang"
            emptyMessage="Belum ada ruang aktif. Tambahkan di menu Ruang."
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="date"
        label={dateLabel}
        isRequired
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isOff}
            variant="dekat"
            min={dateMin}
            max={dateMax}
            label={dateLabel}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="startTime"
        label="Jam mulai"
        isRequired
      >
        {(field) => (
          <TimeField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isOff}
            label="Jam mulai"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="endTime"
        label="Jam selesai"
        isRequired
      >
        {(field) => (
          <TimeField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isOff}
            label="Jam selesai"
          />
        )}
      </ControlField>

      {roomId && date && !isReadOnly ? (
        <FormWide>
          <RoomSchedule
            roomId={roomId}
            roomName={roomName}
            date={date}
            startTime={startTime}
            endTime={endTime}
            ownCode={saved?.code}
          />
        </FormWide>
      ) : null}
    </FormSection>
  );
};
