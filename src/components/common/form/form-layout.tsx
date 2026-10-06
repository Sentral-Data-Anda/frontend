import type { FormHTMLAttributes, ReactNode } from "react";

import { mainInsetBleed, shellWidthFull } from "@/components/layout";
import { cn } from "@/lib/utils";

export function FormLayout({
  header,
  actions,
  children,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & {
  header?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className={shellWidthFull}>{header}</div>

      <form
        noValidate
        data-slot="form-layout"
        className={cn("flex w-full flex-1 flex-col", className)}
        {...props}
      >
        <div className={cn(shellWidthFull, "@container/form flex-1")}>
          {children}
        </div>
        {actions}
      </form>
    </div>
  );
}

export function FormSection({
  legend,
  note,
  disabled = false,
  children,
}: {
  legend: string;
  note?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="border-border border-b px-gutter py-5 last-of-type:border-b-0 md:mx-gutter md:px-0 @min-[44rem]/form:grid @min-[44rem]/form:grid-cols-[14rem_minmax(0,1fr)] @min-[44rem]/form:grid-rows-[auto_1fr] @min-[44rem]/form:gap-x-8"
    >
      {/* Diapungkan: peramban melukis legend di garis atas fieldset. */}
      <legend className="float-left mb-3 w-full text-title font-semibold @min-[44rem]/form:col-start-1 @min-[44rem]/form:row-start-1 @min-[44rem]/form:mb-1">
        {legend}
      </legend>

      {note ? (
        <p className="text-muted-foreground clear-left mb-4 text-caption @min-[44rem]/form:col-start-1 @min-[44rem]/form:row-start-2 @min-[44rem]/form:mb-0">
          {note}
        </p>
      ) : null}

      <div className="@container clear-left @min-[44rem]/form:col-start-2 @min-[44rem]/form:row-span-2 @min-[44rem]/form:row-start-1">
        <div className="space-y-4 @min-[44rem]/form:grid @min-[44rem]/form:gap-4 @min-[44rem]/form:space-y-0 @min-[44rem]/form:@min-[39rem]:grid-cols-2 @min-[44rem]/form:@min-[73rem]:grid-cols-4">
          {children}
        </div>
      </div>
    </fieldset>
  );
}

export function FormWide({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  // `min-w-0` wajib: `Textarea` memakai `field-sizing-content`, jadi lebar
  // min-content-nya mengikuti isinya. Tanpa ini `min-width: auto` menyelesaikan
  // ke lebar itu dan meluber keluar track `minmax(0,1fr)` milik `FormSection` —
  // halaman menggulir mendatar dan action bar sticky ikut lari. Hanya muncul di
  // pita 704-800 dan 1024-1200, jadi 390/820/1440 semuanya hijau (pedoman §7.3).
  return (
    <div className={cn("col-span-full min-w-0", className)}>{children}</div>
  );
}

export function FormActions({
  status,
  children,
}: {
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {status ? (
        <div className={cn(shellWidthFull, "lg:hidden print:hidden")}>
          <p className="text-muted-foreground px-gutter pb-4 text-caption">
            {status}
          </p>
        </div>
      ) : null}

      <FormActionsBar status={status}>{children}</FormActionsBar>
    </>
  );
}

function FormActionsBar({
  status,
  children,
}: {
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card sticky bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] print:hidden",
        mainInsetBleed,
      )}
    >
      <div className={cn(shellWidthFull, "md:px-gutter")}>
        <div className="flex flex-wrap items-center justify-end gap-2 px-gutter py-3 md:px-0">
          {status ? (
            <p className="text-muted-foreground hidden flex-1 pr-4 text-caption lg:block">
              {status}
            </p>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}

export function LoadingForm({
  fields = 6,
  label = "Memuat data…",
}: {
  fields?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-busy="true" className="space-y-4 px-gutter py-5">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} aria-hidden className="space-y-1.5">
          <span className="bg-skeleton block h-3 w-24 animate-pulse rounded" />
          <span className="bg-skeleton block h-control w-full animate-pulse rounded-control" />
        </div>
      ))}

      <span className="sr-only">{label}</span>
    </div>
  );
}
