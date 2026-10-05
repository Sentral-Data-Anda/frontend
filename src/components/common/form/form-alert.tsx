import { Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "error" | "warning" | "info";

const TONE: Record<
  Tone,
  { role: "alert" | "status"; box: string; icon: string; text: string }
> = {
  error: {
    role: "alert",
    box: "border-destructive bg-destructive/10",
    icon: "text-destructive",
    text: "text-destructive",
  },
  warning: {
    role: "status",
    box: "border-warning bg-warning/10",
    icon: "text-foreground",
    text: "text-foreground",
  },
  info: {
    role: "status",
    box: "border-border bg-card",
    icon: "text-muted-foreground",
    text: "text-foreground",
  },
};

interface PropTypes {
  title: string;
  message: string;
  tone?: Tone;
}

export const FormAlert = (props: PropTypes) => {
  const { title, message, tone = "error" } = props;

  const style = TONE[tone];
  const Icon = tone === "info" ? Info : TriangleAlert;

  return (
    <div
      role={style.role}
      className={cn(
        "flex items-start gap-2 rounded-control border p-3",
        style.box,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", style.icon)} aria-hidden />

      {/* `overflow-wrap` itu properti WARISAN, jadi satu kelas di sini cukup
          untuk judul dan pesannya. Tanpa ia, teks pengguna tanpa spasi meluber
          KELUAR dari kotaknya tanpa melebarkan kotaknya — `min-w-0` menahan
          lebar flex item-nya — sehingga setiap pengukuran kotak melaporkan
          lebar yang benar sementara halamannya menggulir mendatar. Yang
          menangkapnya `scrollWidth` lawan `clientWidth`, bukan
          `getBoundingClientRect`. */}
      <div className="min-w-0 wrap-break-word">
        <p className={cn("text-body font-medium", style.text)}>{title}</p>
        <p className={cn("text-body", style.text)}>{message}</p>
      </div>
    </div>
  );
};
