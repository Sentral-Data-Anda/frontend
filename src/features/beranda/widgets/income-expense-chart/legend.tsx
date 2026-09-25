"use client";

export const Legend = () => {
  return (
    <span className="text-muted-foreground flex items-center gap-3 text-caption">
      <span className="flex items-center gap-1.5">
        <span className="bg-chart-income size-1.5 rounded-xs" aria-hidden />
        Masuk
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-chart-expense size-1.5 rounded-xs" aria-hidden />
        Keluar
      </span>
    </span>
  );
};
