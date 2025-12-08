import { CardPhotoMoreComponent } from "@/components";
import { Barang } from "@/types";
import { formatNumber } from "@/utils";
import { Divider, Flex, Table, Text } from "@mantine/core";
import dayjs from "dayjs";

interface PropTypes {
  data: Barang | null;
}

const Detail = (props: PropTypes) => {
  const { data } = props;

  if (data) {
    return (
      <Flex gap="xs" direction={"column"}>
        <CardPhotoMoreComponent
          mainImage={data?.mainImage.path ?? ""}
          detailImage={data?.detailImage?.map((item) => item.path)}
        />
        <Divider />

        <Table w={"100%"} withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td ta={"start"} w={"1%"} px={2} py={5}>
                <Text size="xs">Tipe</Text>
              </Table.Td>
              <Table.Td ta={"center"} px={2} py={5}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs">{data?.type?.name ?? "-"}</Text>
              </Table.Td>
            </Table.Tr>

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
                <Text size="xs">{formatNumber(data?.quantity ?? 0)}</Text>
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
                <Text size="xs">Tgl Pembelian</Text>
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
                  {data?.purchaseDate
                    ? dayjs(data.purchaseDate).format("DD MMMM YYYY")
                    : "-"}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td ta={"start"} w={"1%"} px={2} py={5}>
                <Text size="xs">Harga Pembelian</Text>
              </Table.Td>
              <Table.Td ta={"center"} px={2} py={5}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} px={2} py={5}>
                <Text size="xs">
                  {formatNumber(data?.purchasePrice ? +data.purchasePrice : 0)}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Lama Garansi</Text>
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
                  {data?.guaranty ?? "-"}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Tgl Terakhir Service</Text>
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
                  {data?.maintainceDate
                    ? dayjs(data?.maintainceDate).format("DD MMMM YYYY")
                    : ""}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td
                w={"1%"}
                px={2}
                py={3}
                style={{ textWrap: "nowrap", alignContent: "start" }}>
                <Text size="xs">Interval Service</Text>
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
                  {data?.maintainceInterval ?? "-"}{" "}
                  {data?.maintenancePeriod
                    ? data.maintenancePeriod === "day"
                      ? "Hari"
                      : data.maintenancePeriod === "week"
                      ? "Minggu"
                      : data.maintenancePeriod === "month"
                      ? "Bulan"
                      : data.maintenancePeriod === "year"
                      ? "Tahun"
                      : "-"
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
                <Text size="xs">Ruang</Text>
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
                  {data?.room.name ?? "-"}
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
