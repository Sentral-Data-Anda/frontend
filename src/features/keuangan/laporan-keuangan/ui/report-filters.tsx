interface PropTypes {
  children: React.ReactNode;
}

export const ReportFilters = (props: PropTypes) => {
  const { children } = props;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,18rem))] gap-3 px-gutter pb-4 print:hidden">
      {children}
    </div>
  );
};
