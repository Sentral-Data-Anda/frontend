"use client";

import { useBoolean } from "@/hooks";
import {
  Avatar,
  Button,
  Fieldset,
  Flex,
  Grid,
  useMantineTheme,
} from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useZustandStore } from "@/hooks";
import { confirmSwal } from "@/utils/alertSwal";
import { extractErrorMessage, listGender } from "@/utils/general";
import {
  DateInputComponent,
  DropdownComponent,
  LoadingGlobalComponent,
  PhoneInputComponent,
  TextInputComponent,
} from "@/components";
import { authService } from "@/services";
import { customNotification } from "@/utils";

dayjs.extend(relativeTime);

const Manage = () => {
  const theme = useMantineTheme();

  const isLoading = useBoolean();

  const isEditUser = useBoolean();

  const { detailUser, clearDetailUser } = useZustandStore();

  async function handleLogout() {
    isLoading.onTrue();

    try {
      const response = await authService.logout();

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            clearDetailUser();
            localStorage.removeItem("code-user");
            window.location.href = "/login";
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
      isLoading.onFalse();
    }
  }

  const alertRemove = () => {
    confirmSwal({
      title: "Apakah Anda Ingin Logout ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleLogout();
      },
    });
  };

  if (isLoading.value) {
    return (
      <Flex
        bg={theme.colors.default[9]}
        pos="fixed"
        top={0}
        left={0}
        bottom={0}
        right={0}
        justify={"center"}
        align={"center"}
        style={{
          zIndex: 99999,
        }}>
        <LoadingGlobalComponent />,
      </Flex>
    );
  }

  return (
    <>
      <Flex
        w={"100%"}
        justify={"center"}
        align={"center"}
        direction={"column"}
        gap={"sm"}>
        <Avatar
          name={detailUser?.jemaat?.name ?? ""}
          color={detailUser?.jemaat?.gender === "L" ? "blue" : "red"}
          allowedInitialsColors={["blue", "red"]}
          size={80}
        />
      </Flex>

      <Fieldset legend="Personal Information">
        <Grid w={"100%"} gutter={"xs"} mb={10}>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <TextInputComponent
              name="Name"
              value={detailUser?.jemaat?.name ?? ""}
              disabled
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, xs: 6 }}>
            <DropdownComponent
              placeholder="Gender"
              data={listGender()}
              value={detailUser?.jemaat?.gender ?? ""}
              withLabel
              disabled
              withinPortal={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <DateInputComponent
              label="Date of Birth"
              value={
                detailUser?.jemaat?.birthDate
                  ? detailUser?.jemaat?.birthDate
                  : null
              }
              disabled
              withinPortal={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <TextInputComponent
              name="Email"
              value={detailUser?.jemaat?.email ?? "-"}
              disabled
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <PhoneInputComponent
              name="Phone"
              value={detailUser?.jemaat?.phone ?? "-"}
              disabled
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <TextInputComponent
              name="Username"
              value={detailUser?.username ?? "-"}
              disabled
            />
          </Grid.Col>
        </Grid>
      </Fieldset>
      {!isEditUser.value ? (
        <Button
          fullWidth
          size="xs"
          variant="light"
          color={"red"}
          onClick={alertRemove}>
          Logout
        </Button>
      ) : null}
    </>
  );
};

export default Manage;
