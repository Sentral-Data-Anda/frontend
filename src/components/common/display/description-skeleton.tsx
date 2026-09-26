import { DescriptionList } from "./description-list";

interface PropTypes {
  label: string;
  rows?: number;
}

export const DescriptionSkeleton = (props: PropTypes) => {
  const { label, rows = 6 } = props;

  return (
    <div aria-busy aria-label={label}>
      <DescriptionList>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="flex items-center justify-between gap-4 py-2 @min-[36rem]/dl:block @min-[36rem]/dl:space-y-1.5"
          >
            <span className="bg-skeleton block h-3 w-24 animate-pulse rounded" />
            <span className="bg-skeleton block h-3 w-32 animate-pulse rounded" />
          </div>
        ))}
      </DescriptionList>
    </div>
  );
};
