"use client";

import { useWatch } from "react-hook-form";

import { DateField, DdlField, Input } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { endOfYearIso } from "@/lib/date";

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
  const dateLabel = repeat === "WEEKLY" ? "Tanggal mulai" : "Tanggal";
  const roomName =
    roomId === savedRoomId && saved
      ? saved.room.name
      : (rooms.options.find((room) => room.value === roomId)?.label ?? "");

  return (
    <FormSection legend="Ruang dan waktu" disabled={isOff}>
      <ControlField control={form.control} name="roomId" label="Ruang">
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

      <ControlField control={form.control} name="date" label={dateLabel}>
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isOff}
            variant="dekat"
            max={dateMax}
            label={dateLabel}
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="startTime" label="Jam mulai">
        {(field) => <Input {...field} type="time" disabled={isOff} />}
      </ControlField>

      <ControlField control={form.control} name="endTime" label="Jam selesai">
        {(field) => <Input {...field} type="time" disabled={isOff} />}
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
