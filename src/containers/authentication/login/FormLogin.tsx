"use client";

import { Flex, PasswordInput, TextInput } from "@mantine/core";

import { ButtonSubmitComponent } from "@/components";

import { FormLoginTypes } from "@/types";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useBoolean } from "@/hooks";

import { customNotification } from "@/utils/notification";
import { IconPassword, IconUser } from "@tabler/icons-react";
import { extractErrorMessage } from "@/utils/general";
import { authService } from "@/services";
import { useDisclosure } from "@mantine/hooks";

const FormLogin = () => {
  const router = useRouter();

  const isLoading = useBoolean();

  const [visible, { toggle }] = useDisclosure(false);

  const [formLogin, setFormLogin] = useState<FormLoginTypes>({
    username: "",
    password: "",
  });

  const handleChange = (name: string, value: string) => {
    setFormLogin((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    isLoading.onTrue();

    try {
      const response = await authService.login(formLogin);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            router.push("/authentication");
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
    <form
      onSubmit={handleLogin}
      style={{
        rowGap: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "17rem",
      }}>
      <Flex w="100%" direction={"column"} rowGap={20}>
        <TextInput
          size="xs"
          radius="md"
          w={"100%"}
          leftSection={<IconUser size={16} />}
          placeholder="Username"
          value={formLogin?.username}
          onChange={(e) => handleChange("username", e.target.value)}
          styles={{
            input: {
              minHeight: 32,
              height: 32,
            },
          }}
          readOnly={isLoading.value}
        />

        <PasswordInput
          leftSection={<IconPassword size={16} />}
          size="xs"
          radius="md"
          placeholder="Password"
          value={formLogin?.password}
          onChange={(e) => handleChange("password", e.target.value)}
          visible={visible}
          onVisibilityChange={toggle}
          styles={{
            input: {
              minHeight: 32,
              height: 32,
            },
          }}
          readOnly={isLoading.value}
        />
      </Flex>

      <ButtonSubmitComponent name={"Login"} loading={isLoading.value} />
    </form>
  );
};

export default FormLogin;
