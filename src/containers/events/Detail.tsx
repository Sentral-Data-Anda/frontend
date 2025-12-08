import { CardPhotoMoreComponent } from "@/components";
import { Events } from "@/types";
import { formatNumber } from "@/utils";
import { Divider, Flex, Table, Text } from "@mantine/core";
import dayjs from "dayjs";

interface PropTypes {
  data: Events | null;
}

const Detail = (props: PropTypes) => {
  const { data } = props;

  if (data) {
    return (
      <Flex gap="xs" direction={"column"}>
        <CardPhotoMoreComponent mainImage={data?.image.path ?? ""} />
        <Divider />

        <Table w={"100%"} withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td ta={"start"} w={"1%"} px={2} py={5}>
                <Text size="xs">Nama</Text>
              </Table.Td>
              <Table.Td ta={"center"} px={2} py={5}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs">{data?.name ?? "-"}</Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td ta={"start"} w={"1%"} px={2} py={5}>
                <Text size="xs">Jumlah</Text>
              </Table.Td>
              <Table.Td ta={"center"} px={2} py={5}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs">{formatNumber(data?.capacity ?? 0)}</Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Deskripsi</Text>
              </Table.Td>
              <Table.Td
                ta={"center"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs" ta={"justify"}>
                  {data?.description ?? "-"}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Tgl Mulai</Text>
              </Table.Td>
              <Table.Td
                ta={"center"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs" ta={"start"}>
                  {data?.startDate
                    ? dayjs(data.startDate).format("DD MMMM YYYY HH:mm")
                    : "-"}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Tgl Selesai</Text>
              </Table.Td>
              <Table.Td
                ta={"center"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs" ta={"start"}>
                  {data?.endDate
                    ? dayjs(data.endDate).format("DD MMMM YYYY HH:mm")
                    : "-"}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Pemilik</Text>
              </Table.Td>
              <Table.Td
                ta={"center"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs" ta={"start"}>
                  {data?.bapel.name ?? "-"}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Lokasi</Text>
              </Table.Td>
              <Table.Td
                ta={"center"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs" ta={"start"}>
                  {data.isIndoor ? data?.room.name : data.location}
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Flex>
    );
  }
};

export default Detail;
