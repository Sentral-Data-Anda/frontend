import { AppLink } from "@/components/common/link";

interface PropTypes {
  title: string;
  isTitleHidden?: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export const SectionHeader = (props: PropTypes) => {
  const { title, isTitleHidden, actionLabel, actionHref } = props;

  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 has-[h2.sr-only]:justify-end">
      <h2 className={isTitleHidden ? "sr-only" : "text-title font-semibold"}>
        {title}
      </h2>

      {actionLabel && actionHref ? (
        <AppLink
          href={actionHref}
          className="focus-visible:ring-ring inline-flex min-h-6 items-center rounded-control text-body font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
        >
          {actionLabel}
        </AppLink>
      ) : null}
    </div>
  );
};
