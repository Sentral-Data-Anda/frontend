import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-caption font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Status di baris daftar yang rata di kanvas (keputusan user): titik +
        // teks, tanpa bidang dan tanpa garis. Sejak latar aurora (2026-09-24)
        // teks diukur terhadap titik gradasi terburuk, bukan primary-50:
        // success-900 hanya 4,19:1 di sana, jadi teks `success` memakai
        // `foreground` dan warna status dibawa TITIK (success-900, objek
        // grafik ≥ 3:1) — pilihan user. muted-foreground (primary-800)
        // terburuk 4,69:1, lolos. Titik tidak aktif primary-300 dekoratif,
        // maknanya dibawa teks.
        // `text-body` (12px) eksplisit — pengecualian skala, keputusan user
        // 2026-09-22; bawaan badge `text-caption` (10px).
        // warning: primary-900 di atas warning-100 = 7.66:1; teks kuning tidak
        // pernah dipakai.
        success:
          "gap-1.5 px-0 text-body text-foreground before:size-1.5 before:rounded-full before:bg-success-900",
        neutral:
          "gap-1.5 px-0 text-body text-muted-foreground before:size-1.5 before:rounded-full before:bg-primary-300",
        warning: "bg-warning-100 text-warning-foreground",
        // Status dashboard (bahasa C, §10.9): titik + teks, sama dengan
        // success/neutral. Teks memakai token yang lolos 4.5:1 terhadap
        // putih; titik (objek grafik, 3:1) boleh warna skala. Teks kuning
        // tidak pernah dipakai (warning < 3:1) — draf = teks netral.
        due: "gap-1.5 px-0 text-body text-destructive before:size-1.5 before:rounded-full before:bg-failed-700",
        draft:
          "gap-1.5 px-0 text-body text-foreground before:size-1.5 before:rounded-full before:bg-warning-400",
        wait: "gap-1.5 px-0 text-body text-secondary-foreground before:size-1.5 before:rounded-full before:bg-secondary-700",
        // Penanda "contoh data" untuk widget berdata fixture (hanya di luar
        // production, `SHOW_DUMMY`).
        sample:
          "h-auto rounded-sm border-dashed border-border px-1.5 py-0 text-muted-foreground tracking-normal normal-case italic",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
