"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { useRef, useState } from "react";

import { BottomSheet } from "@/components/common/bottom-sheet";
import { Calendar } from "@/components/common/calendar";
import { FIELD_POPUP } from "@/components/common/select-field";
import { Input } from "@/components/ui/input";
import { useBoolean } from "@/hooks/use-boolean";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  DATE_ERROR,
  ageInYears,
  parseDateInput,
  toInputText,
  todayJakarta,
} from "@/lib/date";
import { formatDate, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Tanggal kalender: **diketik**, dengan baris konfirmasi yang mengeja ulang
 * apa yang dipahami sistem (`docs/design/date-input.md §7`).
 *
 * Kenapa ketik dulu dan bukan kalender dulu: dua dari tiga kelompok tanggal di
 * aplikasi ini jauh dari hari ini — tanggal lahir puluhan tahun ke belakang,
 * tanggal baptis yang sama tuanya. Memilih 12 Mei 1974 lewat kisi berarti
 * puluhan klik; mengetik "12/05/1974" selesai dalam sedetik. Kalendernya
 * menyusul sebagai pelengkap untuk tanggal yang memang dekat.
 *
 * Nilai yang dipegang form tetap `YYYY-MM-DD` atau `""` — tidak pernah
 * `Date`, tidak pernah `null`.
 */

export type DateVariant = "dekat" | "lahir";

const MIN_DEFAULT = "1900-01-01";

export function DateField({
  id,
  value,
  onValueChange,
  variant = "dekat",
  label = "Tanggal",
  min = MIN_DEFAULT,
  max,
  isClearable = true,
  disabled = false,
  onBlur,
  ...aria
}: {
  id?: string;
  /** `YYYY-MM-DD` atau `""`. */
  value: string;
  onValueChange: (value: string) => void;
  variant?: DateVariant;
  /** Dipakai di kalimat galat batas ("Tanggal lahir tidak boleh di masa depan."). */
  label?: string;
  min?: string;
  max?: string;
  /** Kaki kalender menampilkan "Hapus" — untuk field yang boleh kosong. */
  isClearable?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const today = todayJakarta();

  /**
   * Bawaan `max` adalah HARI INI untuk kedua varian: tidak ada tanggal lahir,
   * tanggal bergabung, atau tanggal baptis di masa depan. Field yang memang
   * boleh (jadwal ibadah nanti) menaikkannya sendiri.
   *
   * CATATAN PENYIMPANGAN dari `date-input.md §7.6`: spesifikasi memberi
   * varian `dekat` rentang "hari ini ± 5 tahun", padahal §7.6 juga menyebut
   * **tanggal riwayat** sebagai pemakai `dekat` — dan tanggal baptis di data
   * tiruan saja sudah 1990. Batas bawah 5 tahun akan menolak hampir seluruh
   * riwayat jemaat yang sah. Yang diambil di sini: batas bawah 1900 untuk
   * kedua varian, dan −5 tahun hanya memengaruhi **bulan mana yang dibuka
   * kalender** (tahap 4), bukan apa yang boleh disimpan.
   */
  const upperBound = max ?? today;

  const [text, setText] = useState(() => toInputText(value));
  const [error, setError] = useState("");
  const [lastValue, setLastValue] = useState(value);
  const isCalendarOpen = useBoolean();
  const isDesktop = useIsDesktop();
  const boxRef = useRef<HTMLInputElement>(null);

  /**
   * Menyesuaikan state saat prop berubah — dikerjakan SAAT RENDER, bukan di
   * `useEffect`. Lewat efek, kotak sempat merender nilai lama satu kali lalu
   * menimpanya, dan itu terlihat sebagai kedipan saat form ubah memuat detail.
   *
   * Dua penjaga: teks tidak ditimpa kalau ia sudah mengurai ke nilai yang
   * sama (blur baru saja menormalkannya), dan tidak ditimpa selama ada galat
   * — di situ `value` sengaja dikosongkan, sementara teks yang salah harus
   * tetap terlihat supaya bisa dibetulkan.
   */
  if (value !== lastValue) {
    setLastValue(value);

    if (!error && parseDateInput(text).iso !== value) {
      setText(toInputText(value));
    }
  }

  const onCheck = (raw: string): string => {
    const parsed = parseDateInput(raw);

    if (parsed.error) return parsed.error;
    if (!parsed.iso) return "";
    if (parsed.iso > upperBound) {
      return `${label} tidak boleh di masa depan.`;
    }
    if (parsed.iso < min) {
      return `${label} sebelum ${min.slice(0, 4)} tidak bisa disimpan.`;
    }

    return "";
  };

  const onType = (raw: string) => {
    setText(raw);

    // Selama belum pernah salah, mengetik tidak memerahkan apa pun
    // (form-pattern.md §3.6). Begitu pernah salah, tiap ketikan diperiksa
    // ulang supaya pesannya hilang detik itu juga saat sudah benar.
    if (!error) return;

    const next = onCheck(raw);

    setError(next);
    if (!next) onValueChange(parseDateInput(raw).iso ?? "");
  };

  const onLeave = () => {
    const next = onCheck(text);
    const parsed = parseDateInput(text);

    setError(next);
    // Teks dinormalkan ke `dd/mm/yyyy` hanya bila sah; kalau salah, biarkan
    // apa adanya supaya user melihat yang ia ketik dan bisa membetulkannya.
    if (!next) setText(toInputText(parsed.iso ?? ""));
    onValueChange(next ? "" : (parsed.iso ?? ""));
    onBlur?.();
  };

  const confirmed = !error && parseDateInput(text).iso;
  const age = confirmed && variant === "lahir" ? ageInYears(confirmed) : null;

  /** Kalender memilih → kotak, nilai form, dan galat disetel sekaligus. */
  const onPick = (iso: string) => {
    setText(toInputText(iso));
    setError("");
    onValueChange(iso);
    if (isDesktop) isCalendarOpen.onFalse();
  };

  const onDismiss = () => {
    isCalendarOpen.onFalse();
    // Fokus kembali ke kotak (APG §7.8) — tanpa ini, Escape membuang fokus
    // ke `<body>` dan pengguna keyboard harus menyusuri form dari awal.
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
      hasConfirm={isDesktop === false}
    />
  );

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          ref={boxRef}
          id={id}
          {...aria}
          value={text}
          onChange={(event) => onType(event.target.value)}
          onBlur={onLeave}
          disabled={disabled}
          // `numeric`, bukan `type="date"`: papan tik angka muncul, tapi
          // kotaknya tetap milik kita — bukan pemilih bawaan perangkat.
          inputMode="numeric"
          autoComplete={variant === "lahir" ? "bday" : "off"}
          placeholder="dd/mm/yyyy"
          maxLength={10}
          aria-invalid={aria["aria-invalid"] ?? (error ? true : undefined)}
          // Ruang untuk tombol kalender di dalam kotak.
          className="pr-control tabular-nums"
          onKeyDown={(event) => {
            // `Alt+↓` membuka kalender (APG). Panah biasa tetap milik kotak
            // teks, jadi mengetik tidak pernah membuka apa pun.
            if (event.altKey && event.key === "ArrowDown") {
              event.preventDefault();
              isCalendarOpen.onTrue();
            }
          }}
        />

        {/*
        Tombolnya SEBAGIAN kotak, bukan seluruh kotak: mengklik teks harus
        menaruh kursor untuk mengetik (§7.1). Kalender yang terbuka setiap kali
        kotak disentuh akan menghalangi jalan yang justru paling cepat.
      */}
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
                {/*
                  Cangkang yang SAMA dengan select dan combobox — bukan
                  permukaan ketiga. Dua hal dari `FIELD_POPUP` sengaja
                  ditimpa: lebarnya TIDAK mengikuti pemicu (kalender butuh
                  tujuh kolom, sementara kotak tanggalnya selebar form), dan
                  batas 18rem dicabut karena kisi + kaki tombolnya ±350px —
                  dengan batas itu "Hari ini" dan "Hapus" tergulir keluar
                  pandangan. `--available-height` tetap dipakai supaya popup
                  tidak pernah melebihi layar.
                */}
                <Popover.Popup
                  aria-label="Pilih tanggal"
                  className={cn(FIELD_POPUP, "max-h-(--available-height) w-72")}
                >
                  {calendar}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>

      {/*
        Baris konfirmasi mengeja ulang tanggal dalam bentuk yang tidak bisa
        salah dibaca: "12/05/1990" bisa dikira bulan Desember oleh orang yang
        terbiasa mm/dd, "12 Mei 1990" tidak bisa. Ia dihasilkan komponen, bukan
        ditulis layar, dan digantikan pesan galat selama ada galat.
      */}
      {error ? (
        <p className="text-destructive text-caption">{error}</p>
      ) : confirmed ? (
        <p aria-live="polite" className="text-muted-foreground text-caption">
          {[
            formatDate(confirmed),
            formatWeekday(confirmed),
            age === null ? null : `${age} tahun`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}

      {/*
        Di HP panel penuh dari bawah, memakai `BottomSheet` yang sudah ada —
        `<dialog>` native, jadi lapisan atas, Escape, dan pengurungan fokus
        datang dari peramban, bukan dari kode yang harus dijaga sendiri.
      */}
      {isDesktop === false ? (
        <BottomSheet
          isOpen={isCalendarOpen.value}
          title="Pilih tanggal"
          subtitle={label}
          onClose={onDismiss}
        >
          {/*
            Isinya dirender HANYA saat terbuka. `<dialog>` yang tertutup tetap
            memasang anaknya di DOM, jadi tanpa penjaga ini setiap field
            tanggal di halaman membawa satu kalender lengkap yang tidak
            terlihat siapa pun — tiga field berarti tiga kisi 42 sel.
          */}
          {isCalendarOpen.value ? calendar : null}
        </BottomSheet>
      ) : null}
    </div>
  );
}

/** Tombol kalender di dalam kotak, 36×36 — target sentuh penuh tinggi kotak. */
const CALENDAR_BUTTON =
  "text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex size-control cursor-pointer items-center justify-center rounded-control transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

export { DATE_ERROR };
