import type { FormHTMLAttributes, ReactNode } from "react";

import { shellWidthFull } from "@/components/layout";
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
    <div className="w-full">
      <div className={shellWidthFull}>{header}</div>

      <form
        noValidate
        data-slot="form-layout"
        className={cn("w-full", className)}
        {...props}
      >
        <div className={cn(shellWidthFull, "@container/form")}>{children}</div>
        {actions}
      </form>
    </div>
  );
}

export function FormSection({
  legend,
  note,
  disabled = false,
  isReadOnly = false,
  children,
}: {
  legend: string;
  note?: string;
  disabled?: boolean;
  isReadOnly?: boolean;
  children: ReactNode;
}) {
  const Root = isReadOnly ? "section" : "fieldset";
  const Title = isReadOnly ? "h2" : "legend";

  return (
    <Root
      aria-label={isReadOnly ? legend : undefined}
      disabled={isReadOnly ? undefined : disabled}
      className="border-border border-b px-gutter py-5 last-of-type:border-b-0 md:mx-gutter md:px-0 @min-[44rem]/form:grid @min-[44rem]/form:grid-cols-[14rem_minmax(0,1fr)] @min-[44rem]/form:grid-rows-[auto_1fr] @min-[44rem]/form:gap-x-8"
    >
      {/* Diapungkan: peramban melukis legend di garis atas fieldset. */}
      <Title className="float-left mb-3 w-full text-title font-semibold @min-[44rem]/form:col-start-1 @min-[44rem]/form:row-start-1 @min-[44rem]/form:mb-1">
        {legend}
      </Title>

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
    </Root>
  );
}

export function FormWide({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("col-span-full", className)}>{children}</div>;
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
        <div className={cn(shellWidthFull, "lg:hidden")}>
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
    <div className="border-border bg-card sticky bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:static lg:border-t-0 lg:bg-transparent lg:pb-8">
      <div className={cn(shellWidthFull, "md:px-gutter")}>
        <div className="lg:border-border flex items-center justify-end gap-2 px-gutter py-3 md:px-0 lg:border-t lg:pt-5">
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

export function LoadingForm({ fields = 6 }: { fields?: number }) {
  return (
    <div role="status" aria-busy="true" className="space-y-4 px-gutter py-5">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} aria-hidden className="space-y-1.5">
          <span className="bg-primary-200 block h-3 w-24 animate-pulse rounded" />
          <span className="bg-primary-200 block h-control w-full animate-pulse rounded-control" />
        </div>
      ))}

      <span className="sr-only">Memuat data jemaat…</span>
    </div>
  );
}
