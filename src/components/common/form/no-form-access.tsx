import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeader } from "@/components/layout";

const NO_VIEW_TEXT = "Peran Anda tidak memiliki akses ke menu ini.";

interface PropTypes {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  isCanView?: boolean;
  isStateLocked?: boolean;
}

export const NoFormAccess = (props: PropTypes) => {
  const {
    title,
    description,
    backHref,
    backLabel,
    isCanView = true,
    isStateLocked = false,
  } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader title={title} backHref={backHref} isBackPersistent />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          {isCanView ? description : NO_VIEW_TEXT}
        </p>

        {isStateLocked ? null : (
          <p className="text-muted-foreground text-body">
            Hubungi administrator bila Anda memang seharusnya memegang akses
            ini.
          </p>
        )}

        <Link
          href={backHref}
          className={buttonVariants({ variant: "outline" })}
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
};
