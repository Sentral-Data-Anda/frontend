import {
  DropdownBapel,
  ImageInputComponent,
  RadioInputComponent,
  TextInputComponent,
} from "@/components";
import { FormGallery } from "@/types";
import { ActionIcon, Flex, Grid, Group, Radio } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { ReactNode } from "react";

interface PropTypes {
  formGallery: FormGallery;
  setFormGallery: (_value: FormGallery) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formGallery, setFormGallery, isDisable, onSubmit, button } = props;

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
      <Grid w={"100%"} gutter={"xs"}>
        <Grid.Col span={{ base: 12 }}>
          <DropdownBapel
            value={formGallery?.bapelId}
            onChange={(value) =>
              setFormGallery({ ...formGallery, bapelId: value })
            }
            withLabel
            require
            disabled={isDisable}
            withinPortal={false}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInputComponent
            name="Nama"
            require
            value={formGallery?.name}
            onChange={(e) =>
              setFormGallery({ ...formGallery, name: e.target.value })
            }
            disabled={isDisable}
            description={true}
            maxChar={100}
          />
        </Grid.Col>
        {formGallery.listImage?.map(
          (item: File | undefined | null, index: number) => {
            return (
              <Grid.Col span={{ base: 12 }} key={index}>
                <Flex gap={10} align={"end"}>
                  <ImageInputComponent
                    name={`${index > 0 ? `Image ${index + 1}` : "Image"}`}
                    require
                    value={item}
                    onChange={(value) =>
                      setFormGallery({
                        ...formGallery,
                        listImage: formGallery.listImage?.map((img, i) =>
                          i === index ? value : img,
                        ),
                      })
                    }
                    disabled={isDisable}
                  />
                  {index === formGallery.listImage.length - 1 &&
                  formGallery.listImage[index] !== undefined &&
                  formGallery.listImage[index] !== null &&
                  formGallery.listImage.length < 4 ? (
                    <ActionIcon
                      size={32}
                      variant="light"
                      color="blue"
                      disabled={isDisable}
                      aria-label="Tambah Detail"
                      onClick={() => {
                        setFormGallery({
                          ...formGallery,
                          listImage: [...formGallery.listImage, undefined],
                        });
                      }}>
                      <IconPlus
                        style={{ width: "60%", height: "60%" }}
                        stroke={1.5}
                      />
                    </ActionIcon>
                  ) : null}
                  {(formGallery.listImage[index] === undefined ||
                    formGallery.listImage[index] === null) &&
                  formGallery.listImage.length > 1 ? (
                    <ActionIcon
                      size={32}
                      variant="light"
                      color="red"
                      disabled={isDisable}
                      aria-label="Erase Detail"
                      onClick={() => {
                        const newlistImages = formGallery.listImage.filter(
                          (_, i) => i !== index,
                        );

                        setFormGallery({
                          ...formGallery,
                          listImage: newlistImages,
                        });
                      }}>
                      <IconMinus
                        style={{ width: "60%", height: "60%" }}
                        stroke={1.5}
                      />
                    </ActionIcon>
                  ) : null}
                </Flex>
              </Grid.Col>
            );
          },
        )}
        <Grid.Col span={{ base: 12 }} my={5}>
          <Radio.Group
            label="Publish"
            name="publishEvent"
            withAsterisk
            value={formGallery?.isPublish}
            onChange={(value) => {
              setFormGallery({
                ...formGallery,
                isPublish: value,
              });
            }}
            styles={{
              label: {
                fontSize: 12,
              },
            }}>
            <Group mt="xs">
              <RadioInputComponent
                name="Aktif"
                value={"1"}
                disabled={isDisable}
              />
              <RadioInputComponent
                name="Tidak Aktif"
                value={"0"}
                disabled={isDisable}
              />
            </Group>
          </Radio.Group>
        </Grid.Col>
      </Grid>

      {button}
    </form>
  );
};

export default Form;
