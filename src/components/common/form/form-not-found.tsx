import { buttonVariants } from "@/components/common/control";
import { AppLink } from "@/components/common/link";
import { PageHeader } from "@/components/layout";

interface PropTypes {
  noun: string;
  backHref: string;
  backLabel: string;
}

export const FormNotFound = (props: PropTypes) => {
  const { noun, backHref, backLabel } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title={`Data ${noun} tidak ditemukan`}
        backHref={backHref}
        isBackPersistent
      />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          Data ini mungkin sudah dihapus, atau alamatnya salah.
        </p>

        <AppLink
          href={backHref}
          className={buttonVariants({ variant: "outline" })}
        >
          {backLabel}
        </AppLink>
      </div>
    </div>
  );
};
