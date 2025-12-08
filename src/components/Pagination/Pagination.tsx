import { Pagination, useMantineTheme } from "@mantine/core";

interface PropTypes {
  totalPage: number;
  activePage: number;
  setActivePage: (_value: number) => void;
}

export const PaginationComponent = (props: PropTypes) => {
  const { totalPage, activePage, setActivePage } = props;

  const theme = useMantineTheme();

  return (
    <Pagination
      total={totalPage}
      size="xs"
      radius="sm"
      autoContrast
      siblings={1}
      color={theme.colors.default[9]}
      hideWithOnePage={true}
      value={activePage}
      onChange={setActivePage}
    />
  );
};
