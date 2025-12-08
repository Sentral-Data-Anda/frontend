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
  detailImage?: string[];
}

const urlImage = process.env.NEXT_PUBLIC_FILE_URL;

export const CardPhotoComponent = (props: PropTypes) => {
  const {
    title,
    description,
    buttonDetail,
    listButtonDetail,
    mainImage,
    // detailImage,
  } = props;

  // const [activeImage, setActiveImage] = useState<string>(mainImage);

  // const [thumbnailImages, setThumbnailImages] = useState<string[] | undefined>(
  //   detailImage,
  // );

  // useEffect(() => {
  //   setActiveImage(mainImage);
  //   setThumbnailImages(detailImage);
  // }, [mainImage, detailImage]);

  return (
    <Card withBorder shadow="sm" radius="md">
      <Card.Section>
        <Image
          src={`${urlImage}${mainImage}`}
          alt="main-image"
          fallbackSrc="https://placehold.co/1280x720?text=Loading"
        />
      </Card.Section>

      {/* {thumbnailImages && thumbnailImages.length > 0 ? (
        <Card.Section inheritPadding mt="sm" pb="md">
          <SimpleGrid
            cols={thumbnailImages.length === 1 ? 2 : thumbnailImages.length}>
            {thumbnailImages.map((value: string, index: number) => (
              <Image
                style={{
                  cursor: "pointer",
                  opacity: 0.5,
                }}
                onClick={() => {
                  if (value !== activeImage) {
                    setActiveImage(value);

                    if (thumbnailImages) {
                      const newThumbnails = [...thumbnailImages];
                      const oldActiveIndex = newThumbnails.indexOf(value);
                      if (oldActiveIndex !== -1) {
                        newThumbnails[oldActiveIndex] = activeImage;
                      }
                      setThumbnailImages(newThumbnails);
                    }
                  }
                }}
                src={`${value}`}
                key={index}
                radius="sm"
                alt={`detail-image-${index}`}
                fallbackSrc="https://placehold.co/600x400?text=Loading"
              />
            ))}
          </SimpleGrid>
        </Card.Section>
      ) : null} */}

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
                {/* <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                Delete
              </Menu.Item> */}
              </Menu.Dropdown>
            </Menu>
          ) : null}
        </Group>
      </Card.Section>

      {description}
    </Card>
  );
};
