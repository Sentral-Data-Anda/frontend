import { cn } from "@/lib/utils";

interface PropTypes {
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export const Panel = (props: PropTypes) => {
  const { label, className, children } = props;
  const Root = label ? "section" : "div";

  return (
    <Root
      aria-label={label}
      className={cn(
        "bg-card border-hairline min-w-0 rounded-lg border",
        className,
      )}
    >
      {children}
    </Root>
  );
};
