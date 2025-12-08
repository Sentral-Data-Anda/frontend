"use client";

import { FormFirstUpdateTypes } from "@/types";
import { Flex, Text } from "@mantine/core";
import { useState } from "react";
import { useBoolean } from "@/hooks";
import { customNotification } from "@/utils/notification";
import { extractErrorMessage } from "@/utils/general";
import Cookies from "js-cookie";
import {
  ButtonSubmitComponent,
  PasswordInputComponent,
  TextInputComponent,
} from "@/components";
import { authService } from "@/services";

const FormFirstUpdate = ({
  codeUser,
  onVerify,
}: {
  codeUser: string;
  onVerify?: () => void;
}) => {
  const isLoading = useBoolean();

  const [formUpdate, setFormUpdate] = useState<FormFirstUpdateTypes>({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (name: string, value: string | number | undefined) => {
    setFormUpdate((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    isLoading.onTrue();

    try {
      const response = await authService.update(codeUser, formUpdate);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            if (onVerify) {
              onVerify();
            } else {
              setTimeout(() => {
                Cookies.remove("detail-user-store");
                window.location.href = "/login";
              }, 500);
            }
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      }).then(() => {
        isLoading.onFalse();
      });
    }
  };

  return (
    <Flex
      w={{ base: "21rem", sm: "30rem" }}
      direction={"column"}
      rowGap={15}
      px={10}
      py={60}
      style={{
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255, 0.7)",
      }}>
      <Text size="xl" fw={600} c="black" ta={"center"}>
        Perbarui Data
      </Text>
      <form
        onSubmit={handleUpdate}
        style={{ rowGap: 20, display: "grid", justifyContent: "center" }}>
        <Flex
          w={{ base: "15rem", sm: "18rem" }}
          direction={"column"}
          rowGap={10}>
          <TextInputComponent
            name={"Username"}
            value={formUpdate.username}
            onChange={(e) => handleChange("username", e.target.value)}
            require
            disabled={isLoading.value}
          />
          {/* <TextInputComponent
            name={"Email"}
            value={formUpdate.email}
            onChange={(e) => handleChange("email", e.target.value)}
            require
          />
          <PhoneInputComponent
            name={"Phone"}
            value={formUpdate.phone}
            onChange={(value) => handleChange("phone", value)}
            require
          /> */}
          <PasswordInputComponent
            name={"New Password"}
            value={formUpdate.newPassword}
            onChange={(e) => handleChange("newPassword", e.target.value)}
            require
            disabled={isLoading.value}
          />
          <PasswordInputComponent
            name={"Confirm Password"}
            value={formUpdate.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={
              formUpdate.confirmPassword !== "" &&
              formUpdate.newPassword !== formUpdate.confirmPassword
            }
            require
            disabled={isLoading.value}
          />
        </Flex>
        <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
      </form>
    </Flex>
  );
};

export default FormFirstUpdate;
