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
  hint = "Ketik dd/mm/yyyy, mis. 12/05/1990.",
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
  /**
   * Petunjuk field tanggal, ditampilkan DI BARIS KONFIRMASI saat belum ada
   * tanggal yang sah — bukan lewat `hint` `FormField`. Field tanggal hanya
   * punya satu baris pesan (lihat komentar pada baris itu). Satu baris di 390.
   */
  hint?: string;
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

  /**
   * Teks kotak DITURUNKAN dari `value`, kecuali saat user sedang mengetik.
   *
   * `draft` bernilai `null` berarti "tidak sedang diketik" — kotaknya
   * menampilkan bentuk normal dari nilai form. Begitu user mengetik, draft
   * memegang apa adanya sampai blur.
   *
   * Sebelumnya ini disetel lewat state yang disesuaikan SAAT RENDER, dan itu
   * punya bug yang terukur: klik pertama pada tombol kalender sesudah tanggal
   * diketik tidak membuka apa pun — pembaruan state dari klik terbuang
   * bersama render yang dibatalkan oleh penyesuaian itu, dan baru klik kedua
   * yang bekerja. Menurunkan nilai alih-alih menyimpannya menghapus seluruh
   * kelas bug itu, bukan menambal gejalanya.
   */
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isCalendarOpen = useBoolean();
  const isDesktop = useIsDesktop();
  const boxRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLButtonElement>(null);

  const text = draft ?? toInputText(value);

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
    setDraft(raw);

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
    // Sah → draft dilepas, kotak kembali menampilkan bentuk normal dari nilai
    // form. Salah → draft DIPERTAHANKAN, supaya user melihat yang ia ketik
    // dan bisa membetulkannya alih-alih menebak apa yang hilang.
    if (!next) setDraft(null);
    onValueChange(next ? "" : (parsed.iso ?? ""));
    onBlur?.();
  };

  const confirmed = !error && parseDateInput(text).iso;
  const age = confirmed && variant === "lahir" ? ageInYears(confirmed) : null;

  /** Kalender memilih → kotak, nilai form, dan galat disetel sekaligus. */
  const onPick = (iso: string) => {
    setDraft(null);
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

        Dibuka pada `click` biasa. Sempat dipasang pembuka di `pointerdown`
        untuk menyiasati klik yang tertelan oleh pergeseran tata letak — itu
        SALAH dua kali: di atas `Popover.Trigger` Base UI yang sudah menoggle
        sendiri, urutannya jadi tekan→buka, lepas→toggle→tutup, sehingga
        kalender tidak pernah terbuka dengan tetikus; dan di layar sentuh,
        gerakan menggulir yang dimulai di atas tombol ikut membukanya. Akar
        masalahnya diperbaiki di `FormField`, yang kini menyediakan ruang
        pesan galat sejak awal sehingga tidak ada yang bergeser.
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
                  // Fokus masuk ke SEL yang sedang dituju, bukan berhenti di
                  // pemicu (APG §7.8). Tanpa ini pengguna keyboard membuka
                  // kalender lalu masih harus menekan Tab untuk masuk.
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

      {/*
        Baris konfirmasi mengeja ulang tanggal dalam bentuk yang tidak bisa
        salah dibaca: "12/05/1990" bisa dikira bulan Desember oleh orang yang
        terbiasa mm/dd, "12 Mei 1990" tidak bisa. Ia dihasilkan komponen, bukan
        ditulis layar, dan digantikan pesan galat selama ada galat.
      */}
      {/*
        SATU-SATUNYA slot bertinggi tetap di form, dan alasannya khusus:
        field tanggal memang memvalidasi ketikannya saat kotak ditinggalkan —
        menunda "31/02/1990" sampai Simpan berarti nilainya diam-diam dikirim
        kosong, karena bagi skema form tanggal lahir yang kosong itu sah.
        Maka baris ini SELALU berisi satu baris teks — petunjuk selagi belum
        ada tanggal, "12 Mei 1990 · Sabtu" sesudahnya, atau galat — dan
        pergantian di antara ketiganya tidak mengubah tingginya, jadi tidak
        menggeser apa pun di bawahnya saat kotak ditinggalkan dengan klik.

        Karena selalu berisi, jaraknya ke field berikutnya sama dengan field
        berpetunjuk lain, dan field tanggal tidak lagi punya dua baris pesan.
      */}
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
