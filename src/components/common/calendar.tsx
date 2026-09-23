"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import {
  addDays,
  addMonths,
  isSameMonth,
  isWithin,
  monthGrid,
  startOfMonth,
  todayJakarta,
  weekdayIndex,
} from "@/lib/date";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Kisi kalender (`docs/design/date-input.md §7.5`, keyboard §7.8).
 *
 * Satu kisi untuk dua cangkang: popover berjangkar di desktop dan panel penuh
 * di HP. Yang berbeda hanya pembungkusnya — kalau kisinya juga bercabang, dua
 * bentuk itu akan berbeda perilaku tanpa ada yang sengaja membedakannya.
 *
 * SATU TITIK TAB (roving tabindex) seperti diminta WAI-ARIA APG: kisi 42 sel
 * yang tiap selnya bisa di-Tab berarti 42 tekan Tab untuk melewati kalender.
 * Yang berpindah adalah `tabIndex`, dan panahlah yang memindahkannya.
 */

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const monthTitleFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "September 2026" — dibaca dari tengah hari UTC supaya tidak bergeser. */
const monthTitle = (iso: string): string =>
  monthTitleFormat.format(new Date(`${iso.slice(0, 7)}-01T00:00:00.000Z`));

const YEARS_PER_ROW = 4;

export function Calendar({
  value,
  onPick,
  onClose,
  min,
  max,
  /** Varian `lahir` membuka kisi tahun lebih dulu (§7.6). */
  startInYearGrid = false,
  isClearable = false,
  hasConfirm = false,
  focusRef,
}: {
  value: string;
  onPick: (iso: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
  startInYearGrid?: boolean;
  isClearable?: boolean;
  /** Panel HP menutup sendiri lewat tombol "Pilih". */
  hasConfirm?: boolean;
  /**
   * Sel yang sedang dituju, dibagikan ke pembungkus supaya popover bisa
   * mengarahkan fokus awalnya ke sana (`Popover.Popup initialFocus`).
   */
  focusRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const today = todayJakarta();

  /**
   * Bulan yang sedang dilihat, dan hari yang sedang "dituju" keyboard.
   *
   * Keduanya terpisah dari `value`: menekan panah harus bisa menjelajah tanpa
   * memilih apa pun, dan yang dipilih baru berubah saat Enter ditekan. Kalau
   * panah langsung memilih, setiap penjelajahan menulis ke form.
   */
  const [cursor, setCursor] = useState(() => {
    const start = value || (isWithin(today, min, max) ? today : (min ?? today));

    return start;
  });
  const [isYearGrid, setIsYearGrid] = useState(startInYearGrid);
  const cursorRef = useRef<HTMLButtonElement>(null);

  const month = startOfMonth(cursor);
  const days = monthGrid(cursor);

  /**
   * Fokus DOM mengikuti kursor — syarat APG, dan sekaligus perbaikan bug yang
   * terukur: saat panah memindahkan kursor melewati batas bulan, sel yang
   * sedang difokus DI-UNMOUNT bersama bulan lamanya, fokus jatuh ke `<body>`,
   * dan tombol berikutnya tidak sampai ke kisi sama sekali. Terukur sebelum
   * perbaikan: `PageUp` bekerja, `Shift+PageUp` sesudahnya tidak.
   */
  useEffect(() => {
    /*
     * DUA frame, bukan satu. Cangkang popover Base UI mengatur fokus sendiri
     * dua kali: saat popup dibuka, dan lagi saat elemen yang sedang difokus
     * hilang dari dalamnya — yang persis terjadi ketika kisi tahun ditukar
     * dengan kisi hari. Satu frame menang atas yang pertama tapi kalah dari
     * yang kedua, dan fokus tertinggal di pembungkus "Pilih tanggal".
     */
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => cursorRef.current?.focus());
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [cursor, isYearGrid]);

  /**
   * Kursor TIDAK PERNAH keluar batas.
   *
   * Sebelumnya panah memindahkannya ke hari yang `disabled`, dan elemen
   * disabled menolak fokus — jadi fokus hilang dan tekanan BERIKUTNYA
   * tertelan. Terukur: dari 23 September (= `max`), `ArrowRight` benar
   * ditolak, tapi `ArrowLeft` sesudahnya tidak menggerakkan apa pun.
   */
  const onMove = (next: string) => {
    if (!next || !isWithin(next, min, max)) return;

    setCursor(next);
  };

  /** Panah menjelajah, Enter memilih — persis pola APG untuk `grid`. */
  const onGridKey = (event: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    if (step[event.key] !== undefined) {
      event.preventDefault();
      onMove(addDays(cursor, step[event.key]));
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const offset = weekdayIndex(cursor);
      onMove(addDays(cursor, event.key === "Home" ? -offset : 6 - offset));
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const direction = event.key === "PageUp" ? -1 : 1;
      onMove(addMonths(cursor, event.shiftKey ? direction * 12 : direction));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isWithin(cursor, min, max)) onPick(cursor);
    }
  };

  if (isYearGrid) {
    const firstYear = Number((min ?? "1900-01-01").slice(0, 4));
    const lastYear = Number((max ?? today).slice(0, 4));
    const years = Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => lastYear - index,
    );
    const cursorYear = Number(cursor.slice(0, 4));

    /** Pindah ke tahun lain dengan tanggal/bulan yang sama, dijepit ke batas. */
    const onYear = (year: number) => {
      if (year < firstYear || year > lastYear) return;

      const next = `${year}${cursor.slice(4)}`;
      setCursor(isWithin(next, min, max) ? next : (max ?? min ?? today));
    };

    /**
     * Panah yang sama dengan kisi hari (APG `grid`). Kisi ini yang dibuka
     * PERTAMA untuk tanggal lahir, dan tanpa panah mencapai 1990 dari 2026
     * berarti 36 kali Tab melewati 127 tombol.
     *
     * Daftarnya urut MENURUN (tahun terbaru di kiri atas), jadi "kanan" dan
     * "bawah" berarti tahun yang lebih lampau.
     */
    const onYearKey = (event: React.KeyboardEvent) => {
      const step: Record<string, number> = {
        ArrowLeft: 1,
        ArrowRight: -1,
        ArrowUp: YEARS_PER_ROW,
        ArrowDown: -YEARS_PER_ROW,
        PageUp: YEARS_PER_ROW * 3,
        PageDown: -YEARS_PER_ROW * 3,
      };

      if (step[event.key] !== undefined) {
        event.preventDefault();
        onYear(cursorYear + step[event.key]);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const column = years.indexOf(cursorYear) % YEARS_PER_ROW;
        onYear(
          event.key === "Home"
            ? cursorYear + column
            : cursorYear - (YEARS_PER_ROW - 1 - column),
        );
      }
    };

    return (
      <div className="p-2">
        <p className="mb-2 px-1 text-title font-semibold">Pilih tahun</p>

        <div
          role="grid"
          aria-label="Pilih tahun"
          onKeyDown={onYearKey}
          className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto overscroll-contain"
          style={{ gridTemplateColumns: `repeat(${YEARS_PER_ROW}, 1fr)` }}
        >
          {years.map((year) => {
            const isCurrent = cursorYear === year;

            return (
              <button
                key={year}
                ref={(node) => {
                  if (isCurrent) cursorRef.current = node;
                }}
                type="button"
                role="gridcell"
                // Satu titik Tab, seperti kisi hari — panah memindahkannya.
                tabIndex={isCurrent ? 0 : -1}
                aria-selected={isCurrent}
                data-autofocus={isCurrent ? "" : undefined}
                onClick={() => {
                  onYear(year);
                  setIsYearGrid(false);
                }}
                className={cn(
                  "h-control cursor-pointer rounded-control text-body tabular-nums",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  // Hover hanya untuk sel yang BELUM terpilih: `hover:bg-accent`
                  // menimpa `bg-primary` dan meninggalkan teks putih di atas
                  // bidang pucat (tak terbaca).
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-1 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bulan sebelumnya"
          className="cursor-pointer"
          onClick={() => onMove(addMonths(cursor, -1))}
        >
          <ChevronLeft aria-hidden />
        </Button>

        {/*
          Judul bulan adalah TOMBOL ke kisi tahun: tanpa itu, tanggal lahir
          1953 butuh 880 kali tekan panah. `aria-live` mengumumkan bulan yang
          berganti satu kali — bukan tiap sel, yang akan membanjiri pembaca
          layar saat panah ditahan.
        */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-live="polite"
          className="flex-1 cursor-pointer font-semibold"
          onClick={() => setIsYearGrid(true)}
        >
          {monthTitle(month)}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bulan berikutnya"
          className="cursor-pointer"
          onClick={() => onMove(addMonths(cursor, 1))}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div
        role="grid"
        aria-label="Kalender"
        onKeyDown={onGridKey}
        className="grid grid-cols-7 gap-0.5"
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            role="columnheader"
            aria-label={label}
            className="text-muted-foreground flex h-7 items-center justify-center text-caption"
          >
            {label}
          </div>
        ))}

        {/*
          `key` POSISI, bukan tanggal. Dengan key tanggal, menyeberang bulan
          membuang 42 node dan membuat 42 yang baru — sel yang sedang difokus
          ikut hilang, fokus terlempar ke pembungkus popup, dan panah
          sesudahnya tidak lagi menggerakkan apa pun. Dengan key posisi,
          node-nya tetap sama dan hanya isinya yang berganti.
        */}
        {days.map((day, index) => {
          const isOutside = !isSameMonth(day, month);
          const isAllowed = isWithin(day, min, max);
          const isSelected = day === value;
          const isCursor = day === cursor;

          return (
            <button
              key={index}
              ref={(node) => {
                if (!isCursor) return;

                cursorRef.current = node;
                if (focusRef) focusRef.current = node;
              }}
              data-autofocus={isCursor ? "" : undefined}
              type="button"
              role="gridcell"
              // Satu titik Tab: hanya sel yang sedang dituju yang bisa
              // dijangkau Tab; panah memindahkannya.
              tabIndex={isCursor ? 0 : -1}
              disabled={!isAllowed}
              aria-label={formatDate(day)}
              aria-selected={isSelected}
              aria-current={day === today ? "date" : undefined}
              onClick={() => onPick(day)}
              className={cn(
                // `w-full`, bukan lebar tetap: di panel HP sel mengisi
                // kolomnya sehingga target sentuhnya ikut membesar
                // (`date-input.md §7.4`), sementara di popover desktop
                // kolomnya memang sempit dan hasilnya tetap 36px.
                "flex h-9 w-full items-center justify-center rounded-control text-body tabular-nums transition-colors",
                // Cincin fokus ber-OFFSET, supaya tidak terbaca sebagai garis
                // tepi tombol: di kaki kalender ada tombol "Hari ini" yang
                // memang bergaris, dan dua kotak bergaris berdampingan
                // membuat seolah ada dua yang terfokus.
                "cursor-pointer focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                !isSelected && "hover:bg-accent",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                isOutside && "text-muted-foreground",
                // Titik, BUKAN cincin: cincin adalah bahasa fokus, dan
                // sel "hari ini" yang bercincin terbaca seolah ikut terfokus
                // — apalagi bersebelahan dengan tombol "Hari ini" bergaris.
                day === today &&
                  !isSelected &&
                  "relative font-semibold after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
                isSelected && "bg-primary text-primary-foreground",
              )}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={!isWithin(today, min, max)}
          onClick={() => onPick(today)}
        >
          Hari ini
        </Button>

        {isClearable ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => onPick("")}
          >
            Hapus
          </Button>
        ) : null}

        {hasConfirm ? (
          <Button
            type="button"
            size="sm"
            className="ml-auto cursor-pointer"
            onClick={onClose}
          >
            Pilih
          </Button>
        ) : null}
      </div>
    </div>
  );
}
