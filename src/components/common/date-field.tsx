"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  DATE_ERROR,
  ageInYears,
  parseDateInput,
  toInputText,
  todayJakarta,
} from "@/lib/date";
import { formatDate, formatWeekday } from "@/lib/format";

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

  return (
    <div className="space-y-1">
      <Input
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
        className="tabular-nums"
      />

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
    </div>
  );
}

export { DATE_ERROR };
