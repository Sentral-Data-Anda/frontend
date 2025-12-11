import {
  CheckInputComponent,
  SearchComponent,
  TableComponent,
  TextInputComponent,
} from "@/components";
import { useBoolean, useHooksPagination } from "@/hooks";
import { accessService } from "@/services";
import { Access, FormRole } from "@/types";
import { customNotification } from "@/utils/notification";
import { Checkbox, Grid, Table, Text, useMantineTheme } from "@mantine/core";
import { Fragment, ReactNode, useEffect, useState } from "react";

interface PropTypes {
  formRole: FormRole;
  setFormRole: (_value: FormRole) => void;
  isOpenModal: boolean;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const headerTable = [
  {
    name: "Nama",
  },
  { name: "" },
];

const Form = (props: PropTypes) => {
  const { formRole, setFormRole, isDisable, isOpenModal, onSubmit, button } =
    props;

  const theme = useMantineTheme();

  const isLoading = useBoolean();

  const {
    activePage,
    setActivePage,
    totalPage,
    setTotalPage,
    totalData,
    setTotalData,
    searchData,
    setSearchData,
  } = useHooksPagination();

  const [dataAccess, setDataAccess] = useState<Access[]>([]);

  async function handleGetAllAccess() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: 5,
        filter: searchData,
      };

      const response = await accessService.getAll(params);
      setDataAccess(response.data);
      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataAccess([]);
      setTotalData(0);
      setTotalPage(0);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setActivePage(1);
  }, [searchData, isOpenModal]);

  useEffect(() => {
    if (isOpenModal) {
      handleGetAllAccess();
    }
  }, [activePage, searchData, isOpenModal]);

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
      <Grid w={"100%"} gutter={"sm"}>
        <Grid.Col span={{ base: 12 }}>
          <TextInputComponent
            name="Name"
            value={formRole.name}
            onChange={(e) => setFormRole({ ...formRole, name: e.target.value })}
            require
            description={true}
            maxChar={25}
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <CheckInputComponent
            label="Administrator"
            value={formRole.isAdmin}
            onChange={(value) =>
              setFormRole({
                ...formRole,
                isAdmin: value,
              })
            }
            disabled={isDisable}
          />
        </Grid.Col>

        {!formRole.isAdmin ? (
          <>
            <Grid.Col span={12} mt={10}>
              <SearchComponent onChange={setSearchData} />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }} mb={10}>
              <TableComponent
                minWidth={0}
                loading={isLoading.value}
                typeHeader="basic"
                mainHeader={headerTable}
                activePage={activePage}
                totalData={totalData}
                totalPage={totalPage}
                setActivePage={setActivePage}
                limitData={5}>
                {dataAccess && dataAccess.length > 0 ? (
                  <Fragment>
                    {dataAccess.map((data: Access, index) => {
                      return (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <Text size="xs">{data.name}</Text>
                          </Table.Td>
                          <Table.Td ta={"center"} w={50}>
                            <Checkbox
                              size="14px"
                              checked={formRole?.accessRights?.includes(
                                data.id,
                              )}
                              onChange={(event) => {
                                const { checked } = event.currentTarget;
                                const newAccessRights = checked
                                  ? [...formRole.accessRights, data.id]
                                  : formRole.accessRights.filter(
                                      (id) => id !== data.id,
                                    );
                                setFormRole({
                                  ...formRole,
                                  accessRights: newAccessRights,
                                });
                              }}
                              color={theme.colors.success[9]}
                              iconColor={theme.colors.success[1]}
                              w={"100%"}
                              style={{
                                justifyItems: "center",
                              }}
                              disabled={isDisable}
                            />
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Fragment>
                ) : null}
              </TableComponent>
            </Grid.Col>
          </>
        ) : null}
      </Grid>

      {button}
    </form>
  );
};

export default Form;
