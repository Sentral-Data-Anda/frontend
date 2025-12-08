import {
  ImageInputComponent,
  NumberInputComponent,
  TextInputComponent,
} from "@/components";
import { FormRuangan } from "@/types";
import { ActionIcon, Flex, Grid } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { ReactNode } from "react";

interface PropTypes {
  formRuangan: FormRuangan;
  setFormRuangan: (_value: FormRuangan) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formRuangan, setFormRuangan, isDisable, onSubmit, button } = props;

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
          <TextInputComponent
            name="Nama"
            require
            value={formRuangan?.name}
            onChange={(e) =>
              setFormRuangan({ ...formRuangan, name: e.target.value })
            }
            disabled={isDisable}
            description={true}
            maxChar={100}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <NumberInputComponent
            name="Capacity"
            require
            value={formRuangan?.capacity}
            onChange={(value) =>
              setFormRuangan({ ...formRuangan, capacity: value })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <ImageInputComponent
            name="Main Image"
            require
            value={formRuangan?.mainImage}
            onChange={(value) =>
              setFormRuangan({ ...formRuangan, mainImage: value })
            }
            disabled={isDisable}
          />
        </Grid.Col>

        {formRuangan.image?.map(
          (item: File | undefined | null, index: number) => {
            return (
              <Grid.Col span={{ base: 12 }} key={index}>
                <Flex gap={10} align={"end"}>
                  <ImageInputComponent
                    name={`${
                      index > 0 ? `Detail Image ${index + 1}` : "Detail Image"
                    }`}
                    require
                    value={item}
                    onChange={(value) =>
                      setFormRuangan({
                        ...formRuangan,
                        image: formRuangan.image.map((img, i) =>
                          i === index ? value : img,
                        ),
                      })
                    }
                    disabled={isDisable}
                  />
                  {index === formRuangan.image.length - 1 &&
                  formRuangan.image[index] !== undefined &&
                  formRuangan.image[index] !== null &&
                  formRuangan.image.length < 4 ? (
                    <ActionIcon
                      size={32}
                      variant="light"
                      color="blue"
                      aria-label="Tambah Detail"
                      disabled={isDisable}
                      onClick={() => {
                        setFormRuangan({
                          ...formRuangan,
                          image: [...formRuangan.image, undefined],
                        });
                      }}>
                      <IconPlus
                        style={{ width: "70%", height: "70%" }}
                        stroke={1.5}
                      />
                    </ActionIcon>
                  ) : null}
                  {(formRuangan.image[index] === undefined ||
                    formRuangan.image[index] === null) &&
                  formRuangan.image.length > 1 ? (
                    <ActionIcon
                      size={32}
                      variant="light"
                      color="red"
                      aria-label="Erase Detail"
                      disabled={isDisable}
                      onClick={() => {
                        const newImages = formRuangan.image.filter(
                          (_, i) => i !== index,
                        );

                        setFormRuangan({
                          ...formRuangan,
                          image: newImages,
                        });
                      }}>
                      <IconMinus
                        style={{ width: "70%", height: "70%" }}
                        stroke={1.5}
                      />
                    </ActionIcon>
                  ) : null}
                </Flex>
              </Grid.Col>
            );
          },
        )}
      </Grid>

      {button}
    </form>
  );
};

export default Form;
