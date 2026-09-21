/**
 * Jam mulai dalam blok dua baris ("08" / ".00"), untuk slot `leading`
 * `DataListRow`. `time` berbentuk "HH:mm" — kolom jam dinding be-sada
 * (`startTime`), bukan instant, jadi tidak ada zona yang diterapkan di sini.
 *
 * Tampilan dua baris disembunyikan dari pembaca layar; yang dibacakan adalah
 * "08.00" utuh.
 */
export function TimeBadge({ time }: { time: string }) {
  const [hour, minute = "00"] = time.split(":");

  return (
    <span className="bg-muted flex size-10 shrink-0 flex-col items-center justify-center rounded-control text-body leading-tight font-semibold tabular-nums">
      <span aria-hidden>{hour}</span>
      <span aria-hidden>.{minute}</span>
      <span className="sr-only">
        {hour}.{minute}
      </span>
    </span>
  );
}
