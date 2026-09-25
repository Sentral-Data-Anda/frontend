import type { ReactNode } from "react";

interface PropTypes {
  search: ReactNode;
  picker?: ReactNode;
  filters?: ReactNode;
}

export const ListToolbar = (props: PropTypes) => {
  const { search, picker, filters } = props;

  if (!picker) {
    return (
      <div className="@container px-gutter pb-4">
        <div className="flex flex-col gap-3 @min-[36rem]:flex-row @min-[36rem]:items-center @min-[36rem]:[&>[role=group]]:mx-0 @min-[36rem]:[&>[role=group]]:px-0">
          <div className="@min-[36rem]:w-80 @min-[36rem]:shrink-0">
            {search}
          </div>

          {filters}
        </div>
      </div>
    );
  }

  return (
    <div className="@container px-gutter pb-4">
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-x-2 gap-y-3 [&>[role=group]]:ml-0 [&>[role=group]]:pl-0 @min-[36rem]:grid-cols-[minmax(0,20rem)_10rem_auto] @min-[36rem]:[&>[role=group]]:ml-1 @min-[36rem]:[&>[role=group]]:mr-0 @min-[36rem]:[&>[role=group]]:pr-0">
        <div className="col-span-2 @min-[36rem]:col-span-1">{search}</div>

        <div className="[&>button]:h-7 [&>button]:rounded-full @min-[36rem]:[&>button]:h-control @min-[36rem]:[&>button]:rounded-control">
          {picker}
        </div>

        {filters}
      </div>
    </div>
  );
};
