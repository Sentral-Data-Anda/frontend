"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useRef, useState } from "react";

import { BottomSheet } from "@/components/common/overlay";
import { Input } from "@/components/ui";
import { useBoolean } from "@/hooks/use-boolean";
import { useIsDesktop } from "@/hooks/use-media";
import {
  DATE_ERROR,
  ageInYears,
  parseDateInput,
  toInputText,
  todayJakarta,
} from "@/lib/date";
import { formatDate, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Calendar } from "./calendar";
import { FIELD_POPUP } from "./select-field";

export type DateVariant = "dekat" | "lahir";

const MIN_DEFAULT = "1900-01-01";

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  variant?: DateVariant;
  label?: string;
  min?: string;
  max?: string;
  hint?: string;
  isClearable?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const DateField = (props: PropTypes) => {
  const {
    id,
    value,
    onValueChange,
    variant = "dekat",
    label = "Tanggal",
    min = MIN_DEFAULT,
    max,
    hint = "Ketik dd/mm/yyyy, mis. 12/05/1990.",
    isClearable = true,
    disabled = false,
    onBlur,
    ...aria
  } = props;

  const today = todayJakarta();

  // TANPA `max`, field ini MELARANG MASA DEPAN. Bawaannya benar untuk mayoritas
  // layar SADA — mereka mencatat hal yang sudah terjadi — tapi kegagalannya
  // SENYAP: layarnya tidak rusak, ia hanya menolak semua yang diketik orang.
  // Cuti kena begitu (setiap tanggal mulai besok ditolak) dan nol test merah,
  // karena seluruh fixture-nya bertanggal lampau.
  //
  // Jadi: kalau fieldmu boleh di masa depan, KIRIM `max` eksplisit. Konvensi
  // rumah, pakai `endOfYearIso(n)`: Hari Libur, periode jabatan, masa berlaku
  // kontrak & komponen payroll, garansi barang 5 · Cuti, Pengumuman, Event,
  // program anggaran 2 · Jadwal Pelayan, Ibadah, Peminjaman Ruang, rencana
  // perawatan, permintaan pembelian 1.
  //
  // Dan test-nya harus benar-benar MENGETIK tanggal masa depan — tanggal
  // lampau lolos di kedua arah dan tidak membuktikan apa pun.
  const upperBound = max ?? today;

  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isCalendarOpen = useBoolean();
  const isDesktop = useIsDesktop();
  const boxRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLButtonElement>(null);

  const text = draft ?? toInputText(value);

  const checkInput = (raw: string): string => {
    const parsed = parseDateInput(raw);

    if (parsed.error) return parsed.error;
    if (!parsed.iso) return "";
    if (parsed.iso > upperBound) {
      return upperBound === today
        ? `${label} tidak boleh di masa depan.`
        : `${label} setelah ${formatDate(upperBound)} tidak bisa disimpan.`;
    }
    if (parsed.iso < min) {
      return `${label} sebelum ${formatDate(min)} tidak bisa disimpan.`;
    }

    return "";
  };

  const onType = (raw: string) => {
    setDraft(raw);

    if (!error) return;

    const next = checkInput(raw);

    setError(next);
    if (!next) onValueChange(parseDateInput(raw).iso ?? "");
  };

  const onLeave = () => {
    const next = checkInput(text);

    setError(next);
    if (!next) setDraft(null);

    // Hanya tulis balik kalau orangnya MENGETIK sesuatu. Blur tanpa ketikan
    // (Tab lewat) dulu ikut menulis — dan menulis "" begitu nilainya jatuh di
    // luar batas, misalnya saat `min` bergeser setelah nilainya tersimpan.
    // Akibatnya sekadar melewati field menghapus tanggal yang sudah benar,
    // tanpa jejak. Galatnya tetap tampil; yang dicabut hanya penghapusannya.
    if (draft !== null) {
      onValueChange(next ? "" : (parseDateInput(text).iso ?? ""));
    }

    onBlur?.();
  };

  const confirmed = !error && parseDateInput(text).iso;
  const age = confirmed && variant === "lahir" ? ageInYears(confirmed) : null;

  const onPick = (iso: string) => {
    setDraft(null);
    setError("");
    onValueChange(iso);
    if (isDesktop) isCalendarOpen.onFalse();
  };

  const onDismiss = () => {
    isCalendarOpen.onFalse();
    boxRef.current?.focus();
  };

  const calendar = (
    <Calendar
      value={confirmed || ""}
      onPick={onPick}
      onClose={onDismiss}
      min={min}
      max={upperBound}
      startInYearGrid={variant === "lahir" && !confirmed}
      isClearable={isClearable}
      isConfirmVisible={isDesktop === false}
      focusRef={cellRef}
    />
  );

  return (
    <div>
      <div className="relative">
        <Input
          ref={boxRef}
          id={id}
          {...aria}
          value={text}
          onChange={(event) => onType(event.target.value)}
          onBlur={onLeave}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={variant === "lahir" ? "bday" : "off"}
          placeholder="dd/mm/yyyy"
          maxLength={10}
          aria-invalid={aria["aria-invalid"] ?? (error ? true : undefined)}
          className="pr-control tabular-nums"
          onKeyDown={(event) => {
            if (event.altKey && event.key === "ArrowDown") {
              event.preventDefault();
              isCalendarOpen.onTrue();
            }
          }}
        />

        {isDesktop === false ? (
          <button
            type="button"
            disabled={disabled}
            onClick={isCalendarOpen.onTrue}
            aria-label="Buka kalender"
            aria-haspopup="dialog"
            aria-expanded={isCalendarOpen.value}
            className={CALENDAR_BUTTON}
          >
            <CalendarDays className="size-4" aria-hidden />
          </button>
        ) : (
          <Popover.Root
            open={isCalendarOpen.value}
            onOpenChange={(next) => {
              isCalendarOpen.setValue(next);
              if (!next) boxRef.current?.focus();
            }}
          >
            <Popover.Trigger
              disabled={disabled}
              aria-label="Buka kalender"
              className={CALENDAR_BUTTON}
            >
              <CalendarDays className="size-4" aria-hidden />
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Positioner
                side="bottom"
                align="end"
                sideOffset={4}
                className="z-50 outline-none"
              >
                <Popover.Popup
                  aria-label="Pilih tanggal"
                  initialFocus={cellRef}
                  className={cn(FIELD_POPUP, "max-h-(--available-height) w-72")}
                >
                  {calendar}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mt-1.5 min-h-3.5 truncate text-caption",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error ||
          (confirmed
            ? [
                formatDate(confirmed),
                formatWeekday(confirmed),
                age === null ? null : `${age} tahun`,
              ]
                .filter(Boolean)
                .join(" · ")
            : hint)}
      </p>

      {isDesktop === false ? (
        <BottomSheet
          isOpen={isCalendarOpen.value}
          title="Pilih tanggal"
          subtitle={label}
          onClose={onDismiss}
        >
          {isCalendarOpen.value ? calendar : null}
        </BottomSheet>
      ) : null}
    </div>
  );
};

const CALENDAR_BUTTON =
  "text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex size-control cursor-pointer items-center justify-center rounded-control transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

export { DATE_ERROR };
