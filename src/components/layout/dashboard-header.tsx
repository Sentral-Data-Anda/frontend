import Link from "next/link";

import { buttonVariants } from "@/components/common/control";

export type HeaderAction = { label: string; href: string };

interface PropTypes {
  title: string;
  subtitle: string;
  actions: HeaderAction[];
  picker?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const DashboardHeader = (props: PropTypes) => {
  const { title, subtitle, actions, picker, trailing } = props;

  return (
    <header className="flex items-center gap-3 px-gutter lg:pt-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-lead font-semibold" suppressHydrationWarning>
          {title}
        </h1>
        <p
          className="text-muted-foreground text-body tabular-nums"
          suppressHydrationWarning
        >
          {subtitle}
        </p>
      </div>

      {picker}

      {actions.length || trailing ? (
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {actions
            .slice(0, 2)
            .reverse()
            .map((action, index, list) => (
              <Link
                key={action.href}
                href={action.href}
                className={buttonVariants({
                  variant: index === list.length - 1 ? "default" : "outline",
                  className: "whitespace-nowrap",
                })}
              >
                {action.label}
              </Link>
            ))}
          {trailing}
        </div>
      ) : null}
    </header>
  );
};
