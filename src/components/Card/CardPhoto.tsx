"use client";

import { ActionIcon, Card, Flex, Group, Image, Menu } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import { ReactNode } from "react";

interface ButtonDetail {
  label: string;
  color: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface PropTypes {
  title: ReactNode;
  description?: ReactNode;
  buttonDetail: boolean;
  listButtonDetail?: ButtonDetail[];
  mainImage: string;
}

const urlImage = process.env.NEXT_PUBLIC_FILE_URL;

export const CardPhotoComponent = (props: PropTypes) => {
  const { title, description, buttonDetail, listButtonDetail, mainImage } =
    props;

  return (
    <Card withBorder shadow="sm" radius="md">
      <Card.Section>
        <Image
          src={`${urlImage}${mainImage}`}
          alt="main-image"
          fallbackSrc="https://placehold.co/1280x720?text=Loading"
        />
      </Card.Section>

      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Flex direction={"column"} gap={3}>
            {title}
          </Flex>

          {buttonDetail ? (
            <Menu withinPortal position="bottom-end" shadow="sm">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown
                styles={{
                  dropdown: {
                    minWidth: 130,
                  },
                }}>
                {listButtonDetail
                  ?.filter((item) => !item.disabled)
                  .map((value: ButtonDetail, index: number) => (
                    <Menu.Item
                      key={index}
                      leftSection={value.icon}
                      color={value.color}
                      onClick={value.onClick}
                      disabled={value.disabled ?? false}>
                      {value.label}
                    </Menu.Item>
                  ))}
              </Menu.Dropdown>
            </Menu>
          ) : null}
        </Group>
      </Card.Section>

      {description}
    </Card>
  );
};
