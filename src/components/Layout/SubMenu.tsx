"use client";

import { Button, Flex, Stack, Text } from "@mantine/core";
import Image from "next/image";
import { useRouter } from "next/navigation";

import iconArrow from "../../assets/icons/ic_arrow2.svg";
import { ReactElement } from "react";
import { useZustandStore } from "@/hooks";

interface PropTypes {
  listMenu: {
    label: string;
    description: string;
    href: string;
    icon: ReactElement;
    access: string;
  }[];
}

export const SubMenuComponent = (props: PropTypes) => {
  const { listMenu } = props;

  const router = useRouter();

  const { detailUser } = useZustandStore();

  const isAdmin = detailUser?.roleUser?.name === "Administrator";

  return (
    <Stack h={"100%"} align="stretch" justify="center" gap="sm">
      {listMenu.map((item, index) =>
        detailUser?.roleUser?.access?.some(
          (access) => access.name === item.access,
        ) || isAdmin ? (
          <Button
            size="sm"
            key={index}
            variant="light"
            fullWidth
            style={{
              borderRadius: 12,
              fontSize: "12px",
              height: 60,
            }}
            styles={{
              label: {
                width: "100%",
              },
            }}
            onClick={() => router.push(item.href)}>
            <Flex w={"100%"} justify={"space-between"} align={"center"}>
              <Flex gap={3} align={"center"}>
                {item.icon}
                <Flex direction={"column"} gap={2}>
                  <Text size="sm" ta={"start"} fw={500}>
                    {item.label}
                  </Text>
                  <Text size="xs" ta={"start"} c="#0000008a">
                    {item.description}
                  </Text>
                </Flex>
              </Flex>
              <Image src={iconArrow} alt="iconArrow" height={10} width={15} />
            </Flex>
          </Button>
        ) : null,
      )}
    </Stack>
  );
};
