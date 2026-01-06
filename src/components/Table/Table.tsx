import { Grid, Pagination, Table, Text, useMantineTheme } from "@mantine/core";
import { ReactElement } from "react";
import { TableLoadingComponent } from "../Loading";

export type Header = {
  name: string;
  colSpan?: number;
  rowSpan?: number;
  textAlign?: string;
  width?: number;
};

interface PropTypes {
  typeHeader: string;
  mainHeader: Header[];
  childHeader?: Header[];
  children: ReactElement | null;
  activePage: number;
  setActivePage: (_value: number) => void;
  totalPage: number;
  totalData: number;
  limitData: number;
  loading: boolean;
  minWidth?: number;
  maxHeight?: number;
}

export const TableComponent = (props: PropTypes) => {
  const {
    typeHeader,
    mainHeader,
    childHeader,
    children,
    activePage,
    setActivePage,
    totalPage,
    totalData,
    limitData,
    loading = true,
    minWidth = 500,
    maxHeight,
  } = props;

  const theme = useMantineTheme();

  const message = `Showing ${limitData * (activePage - 1) + 1} – ${Math.min(
    totalData,
    limitData * activePage,
  )} of ${totalData}`;

  const basicHeader = (
    <Table.Thead bg={theme.colors.primary[9]}>
      <Table.Tr>
        {mainHeader && mainHeader.length > 0
          ? mainHeader.map((value, index) => (
              <Table.Th
                key={index}
                ta={"center"}
                w={value.width}
                style={{
                  textWrap: "nowrap",
                  fontSize: "12px",
                }}
                colSpan={value.colSpan ?? 0}
                rowSpan={value.rowSpan ?? 0}>
                {value.name}
              </Table.Th>
            ))
          : null}
      </Table.Tr>
    </Table.Thead>
  );

  const dynamicHeader = (
    <Table.Thead bg={theme.colors.primary[9]}>
      <Table.Tr>
        {mainHeader && mainHeader.length > 0
          ? mainHeader.map((value, index) => (
              <Table.Th
                key={index}
                ta={value.textAlign as "left" | "center" | "right" | "center"}
                tt={"uppercase"}
                style={{
                  textWrap: "nowrap",
                  border: "1px solid gray",
                  fontSize: "12px",
                }}
                colSpan={value.colSpan ?? 0}
                rowSpan={value.rowSpan ?? 0}>
                {value.name}
              </Table.Th>
            ))
          : null}
      </Table.Tr>

      {childHeader && childHeader.length > 0 ? (
        <Table.Tr>
          {childHeader.map((value, index) => (
            <Table.Th
              key={index}
              ta={value.textAlign as "left" | "center" | "right" | "center"}
              tt={"uppercase"}
              style={{
                textWrap: "nowrap",
                border: "1px solid gray",
              }}
              colSpan={value.colSpan ?? 0}
              rowSpan={value.rowSpan ?? 0}>
              {value.name}
            </Table.Th>
          ))}
        </Table.Tr>
      ) : null}
    </Table.Thead>
  );

  return (
    <Grid w={"100%"} align="center">
      <Grid.Col span={12}>
        <Table.ScrollContainer
          minWidth={minWidth}
          maxHeight={maxHeight}
          type="native"
          styles={{
            scrollContainer: {
              scrollBehavior: "smooth",
            },
          }}>
          <Table
            striped
            highlightOnHover
            withColumnBorders
            withTableBorder
            stripedColor={"white"}
            stickyHeader
            styles={{
              td: {
                height: 35,
                maxHeight: 35,
                minHeight: 35,
                paddingBlock: 3,
                paddingInline: 5,
              },
              th: {
                fontSize: 12,
                height: 35,
                maxHeight: 35,
                minHeight: 35,
                paddingBlock: 3,
                paddingInline: 5,
                color: "white",
                backgroundColor: theme.colors.default[9],
              },
            }}>
            {typeHeader === "basic" && basicHeader}
            {typeHeader === "dynamic" && dynamicHeader}

            <Table.Tbody>
              {children !== null ? (
                children
              ) : loading && children === null ? (
                <TableLoadingComponent />
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={mainHeader.length} ta={"center"}>
                    <Text size="xs"> Nothing found..</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Grid.Col>

      {totalPage !== 0 && activePage !== 0 ? (
        <Grid.Col
          span={12}
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            display: "flex",
          }}>
          <Pagination
            total={totalPage}
            size="xs"
            radius="sm"
            autoContrast
            siblings={1}
            color={theme.colors.primary[9]}
            visibleFrom="xs"
            // hideWithOnePage={true}
            value={activePage}
            onChange={setActivePage}
            styles={{
              control: {
                padding: 3,
                minWidth: 20,
                height: 20,
                fontSize: 12,
              },
            }}
          />
          {totalData !== null ? <Text size="xs">{message}</Text> : null}
          <Pagination
            total={totalPage}
            size="xs"
            radius="sm"
            autoContrast
            siblings={1}
            color={theme.colors.primary[9]}
            hiddenFrom="xs"
            hideWithOnePage={true}
            withPages={false}
            value={activePage}
            onChange={setActivePage}
            styles={{
              control: {
                padding: 3,
                minWidth: 20,
                height: 20,
                fontSize: 12,
              },
            }}
          />
        </Grid.Col>
      ) : null}
    </Grid>
  );
};
