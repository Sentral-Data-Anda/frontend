import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeader } from "@/components/layout";

interface PropTypes {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}

export const NoFormAccess = (props: PropTypes) => {
  const { title, description, backHref, backLabel } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader title={title} backHref={backHref} isBackPersistent />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">{description}</p>

        <p className="text-muted-foreground text-body">
          Hubungi administrator bila Anda memang seharusnya memegang akses ini.
        </p>

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
