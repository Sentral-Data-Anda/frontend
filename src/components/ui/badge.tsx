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
        // teks, tanpa bidang dan tanpa garis. Teks terhadap kanvas primary-50:
        // success-900 4.80:1, muted-foreground (primary-800) 5.66:1 — keduanya
        // lolos tanpa bidang. Titik aktif success-900 (4.80:1, non-teks ≥3:1);
        // titik tidak aktif primary-300 dekoratif, maknanya dibawa teks.
        // `text-body` (12px) eksplisit — pengecualian skala, keputusan user
        // 2026-09-22; bawaan badge `text-caption` (10px).
        // warning: primary-900 di atas warning-100 = 7.66:1; teks kuning tidak
        // pernah dipakai.
        success:
          "gap-1.5 px-0 text-body text-success-900 before:size-1.5 before:rounded-full before:bg-success-900",
        neutral:
          "gap-1.5 px-0 text-body text-muted-foreground before:size-1.5 before:rounded-full before:bg-primary-300",
        warning: "bg-warning-100 text-warning-foreground",
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
