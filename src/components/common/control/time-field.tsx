"use client";

import { Popover } from "@base-ui/react/popover";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { BottomSheet } from "@/components/common/overlay";
import { inputVariants } from "@/components/ui";
import { useBoolean } from "@/hooks/use-boolean";
import { useIsDesktop } from "@/hooks/use-media";
import { nowTimeJakarta, parseTimeInput } from "@/lib/date";
import { cn } from "@/lib/utils";

import { FIELD_POPUP } from "./select-field";

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const pad = (value: string) => (value ? value.padStart(2, "0") : "");

const everyMinutes = (step: number) =>
  Array.from({ length: Math.ceil(60 / step) }, (_, index) =>
    String(index * step).padStart(2, "0"),
  );

const split = (value: string) =>
  /^\d{2}:\d{2}$/.test(value)
    ? { hour: value.slice(0, 2), minute: value.slice(3, 5) }
    : { hour: "", minute: "" };

interface SegmentPropTypes {
  id?: string;
  value: string;
  label: string;
  isDisabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onValueChange: (value: string) => string;
  onStep: (step: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onLeave: () => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const Segment = (props: SegmentPropTypes) => {
  const {
    id,
    value,
    label,
    isDisabled,
    inputRef,
    onValueChange,
    onStep,
    onNext,
    onPrevious,
    onLeave,
    ...aria
  } = props;

  const onChange = (raw: string) => {
    const digits = onValueChange(raw);

    if (digits.length === 2) onNext();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const step =
      event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;

    if (step) {
      event.preventDefault();
      onStep(step);
    }

    if (event.key === "ArrowRight") onNext();
    if (event.key === "ArrowLeft") onPrevious();
  };

  return (
    <input
      ref={inputRef}
      id={id}
      {...aria}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onLeave}
      // Menimpa isi segmen saat fokus masuk, supaya mengetik "07" tidak
      // menghasilkan "0807".
      onFocus={(event) => event.target.select()}
      disabled={isDisabled}
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      maxLength={2}
      placeholder="--"
      className="placeholder:text-muted-foreground w-[2ch] bg-transparent p-0 text-center text-body tabular-nums outline-none disabled:cursor-not-allowed"
      onKeyDown={onKeyDown}
    />
  );
};

interface ColumnPropTypes {
  title: string;
  options: string[];
  value: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  onPick: (value: string) => void;
}

const TimeColumn = (props: ColumnPropTypes) => {
  const { title, options, value, listRef, onPick } = props;

  // Baris terpilih dibawa ke tengah kolom saat panel dibuka, tanpa
  // `scrollIntoView` yang ikut menggeser halaman di belakang popup.
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-selected="true"]');

    if (!list || !row) return;

    list.scrollTop =
      row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
  }, [listRef, value]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="text-muted-foreground border-hairline border-b px-3 py-1.5 text-caption font-semibold tracking-wide uppercase">
        {title}
      </p>

      <div
        ref={listRef}
        role="listbox"
        aria-label={title}
        tabIndex={0}
        className={cn(
          "h-52 overflow-y-auto overscroll-contain p-1 outline-none",
          "focus-visible:ring-ring focus-visible:ring-2",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {options.map((option) => {
          const isPicked = option === value;

          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isPicked}
              tabIndex={-1}
              onClick={() => onPick(option)}
              className={cn(
                "rounded-control flex h-8 w-full items-center justify-center text-body tabular-nums transition-colors",
                isPicked
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-accent",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  hint?: string;
  stepMinutes?: number;
  disabled?: boolean;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const TimeField = (props: PropTypes) => {
  const {
    id,
    value,
    onValueChange,
    label = "Jam",
    hint = "Jam dan menit, mis. 08:30.",
    stepMinutes = 1,
    disabled = false,
    onBlur,
    ...aria
  } = props;

  const stored = split(value);
  const [draft, setDraft] = useState<{ hour: string; minute: string } | null>(
    null,
  );
  const isPanelOpen = useBoolean();
  const isDesktop = useIsDesktop();
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  // Nilai yang kita kirim sendiri. Tanpa ini, mengirim "" untuk jam yang baru
  // setengah terisi akan dibaca balik sebagai nilai baru dan menghapus ketikan.
  const lastSent = useRef(value);

  useEffect(() => {
    if (value === lastSent.current) return;

    lastSent.current = value;
    setDraft(null);
  }, [value]);

  const hour = draft?.hour ?? stored.hour;
  const minute = draft?.minute ?? stored.minute;

  const send = (next: string) => {
    lastSent.current = next;
    onValueChange(next);
  };

  const commit = (next: { hour: string; minute: string }) => {
    setDraft(next);
    send(next.hour && next.minute ? `${next.hour}:${next.minute}` : "");
  };

  // Satu segmen bisa menerima ketikan utuh ("08:30") atau tempelan ("0830").
  const onTypeSegment = (part: "hour" | "minute", raw: string) => {
    const all = raw.replace(/\D/g, "");

    if (all.length > 2) {
      const pasted = parseTimeInput(raw);

      if (pasted.time) {
        commit(split(pasted.time));
        minuteRef.current?.focus();
        return pasted.time;
      }

      return "";
    }

    // Satu angka yang mustahil jadi jam (mis. 9) dibaca apa adanya.
    const limit = part === "hour" ? 23 : 59;
    const digits =
      all.length === 2 && Number(all) > limit ? all.slice(-1) : all;

    commit({ hour, minute, [part]: digits });

    return digits;
  };

  const onStepSegment = (part: "hour" | "minute", step: number) => {
    const limit = part === "hour" ? 24 : 60;
    const current = Number((part === "hour" ? hour : minute) || 0);

    commit({
      ...{ hour, minute },
      [part]: pad(String((current + step + limit) % limit)),
    });
  };

  const onLeaveSegment = (part: "hour" | "minute") => {
    const next = { hour: pad(hour), minute: pad(minute) };

    // Hanya menulis balik kalau memang ada yang perlu dirapikan, supaya blur
    // karena Tab tidak mengirim nilai yang sama sekali baru.
    if (next.hour !== hour || next.minute !== minute) {
      setDraft(next);
      send(next.hour && next.minute ? `${next.hour}:${next.minute}` : "");
    }

    if (part === "minute") onBlur?.();
  };

  // Memilih jam belum menyelesaikan apa pun, jadi panel dibiarkan terbuka dan
  // fokus pindah ke kolom menit. Memilih menit yang menutupnya.
  const onPick = (nextHour: string, nextMinute: string) => {
    setDraft({ hour: nextHour, minute: nextMinute });
    send(`${nextHour}:${nextMinute}`);
  };

  const onPickHour = (next: string) => {
    onPick(next, minute || "00");
    minuteListRef.current?.focus();
  };

  const onPickMinute = (next: string) => {
    onPick(hour || "00", next);
    if (isDesktop) isPanelOpen.onFalse();
  };

  const onClear = () => {
    setDraft({ hour: "", minute: "" });
    send("");
    if (isDesktop) isPanelOpen.onFalse();
  };

  const onNow = () => {
    const now = nowTimeJakarta();

    onPick(now.slice(0, 2), now.slice(3, 5));
    if (isDesktop) isPanelOpen.onFalse();
  };

  const onDismiss = () => {
    isPanelOpen.onFalse();
    hourRef.current?.focus();
  };

  const slots = everyMinutes(stepMinutes);
  // Jam yang tersimpan di luar langkah tetap ditampilkan, supaya nilainya tidak
  // terbaca sebagai "tidak ada pilihan".
  const minuteOptions =
    minute && !slots.includes(minute) ? [minute, ...slots] : slots;
  const isInvalid = aria["aria-invalid"];

  const panel = (
    <div className="flex flex-col">
      <div className="flex divide-x">
        <TimeColumn
          title="Jam"
          options={HOURS}
          value={hour}
          listRef={hourListRef}
          onPick={onPickHour}
        />
        <TimeColumn
          title="Menit"
          options={minuteOptions}
          value={minute}
          listRef={minuteListRef}
          onPick={onPickMinute}
        />
      </div>

      <div className="border-hairline flex items-center gap-1 border-t px-2 py-1.5">
        <button
          type="button"
          onClick={onNow}
          className="text-primary hover:bg-accent rounded-control px-2 py-1 text-body font-medium"
        >
          Sekarang
        </button>

        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-control px-2 py-1 text-body"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={isDesktop ? isPanelOpen.onFalse : onDismiss}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-control px-2.5 py-1 text-body font-medium"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="relative">
        <div
          className={cn(
            inputVariants({ variant: "outline" }),
            "focus-within:border-primary flex items-center pr-control",
            disabled && "pointer-events-none opacity-50",
            isInvalid &&
              "border-destructive bg-destructive/10 focus-within:border-destructive",
          )}
        >
          <Segment
            id={id}
            value={hour}
            label={label}
            isDisabled={disabled}
            inputRef={hourRef}
            aria-invalid={isInvalid}
            aria-describedby={aria["aria-describedby"]}
            onValueChange={(next) => onTypeSegment("hour", next)}
            onStep={(step) => onStepSegment("hour", step)}
            onNext={() => minuteRef.current?.focus()}
            onPrevious={() => hourRef.current?.focus()}
            onLeave={() => onLeaveSegment("hour")}
          />

          <span
            aria-hidden
            className="text-muted-foreground px-0.5 select-none"
          >
            :
          </span>

          <Segment
            value={minute}
            label={`${label} menit`}
            isDisabled={disabled}
            inputRef={minuteRef}
            onValueChange={(next) => onTypeSegment("minute", next)}
            onStep={(step) => onStepSegment("minute", step)}
            onNext={() => minuteRef.current?.focus()}
            onPrevious={() => hourRef.current?.focus()}
            onLeave={() => onLeaveSegment("minute")}
          />
        </div>

        {isDesktop === false ? (
          <button
            type="button"
            disabled={disabled}
            onClick={isPanelOpen.onTrue}
            aria-label="Pilih jam"
            aria-haspopup="dialog"
            aria-expanded={isPanelOpen.value}
            className={CLOCK_BUTTON}
          >
            <Clock className="size-4" aria-hidden />
          </button>
        ) : (
          <Popover.Root
            open={isPanelOpen.value}
            onOpenChange={(next) => {
              isPanelOpen.setValue(next);
              if (!next) hourRef.current?.focus();
            }}
          >
            <Popover.Trigger
              disabled={disabled}
              aria-label="Pilih jam"
              className={CLOCK_BUTTON}
            >
              <Clock className="size-4" aria-hidden />
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Positioner
                side="bottom"
                align="end"
                sideOffset={4}
                className="z-50 outline-none"
              >
                <Popover.Popup
                  aria-label="Pilih jam"
                  className={cn(FIELD_POPUP, "w-56 overflow-hidden")}
                >
                  {panel}
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
          isInvalid ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {isInvalid ? "" : hint}
      </p>

      {isDesktop === false ? (
        <BottomSheet
          isOpen={isPanelOpen.value}
          title="Pilih jam"
          subtitle={label}
          onClose={onDismiss}
        >
          {isPanelOpen.value ? <div className="pb-2">{panel}</div> : null}
        </BottomSheet>
      ) : null}
    </div>
  );
};

const CLOCK_BUTTON =
  "text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex size-control cursor-pointer items-center justify-center rounded-control transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";
