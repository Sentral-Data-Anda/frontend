import { Flex, Table } from "@mantine/core";

export const TableLoadingComponent = () => {
  return (
    <Table.Tr>
      <Table.Td colSpan={7} ta={"center"}>
        <Flex justify={"center"}>
          <div className="loader-table"></div>
        </Flex>
      </Table.Td>
    </Table.Tr>
  );
};
