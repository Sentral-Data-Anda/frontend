import {
  DateInputComponent,
  DropdownBapel,
  DropdownComponent,
  DropdownCreateComponent,
  DropdownRoom,
  ImageInputComponent,
  NumberInputComponent,
  TextAreaInputComponent,
  TextInputComponent,
} from "@/components";
import { useBoolean, useZustandStore } from "@/hooks";
import { tipeBarangService } from "@/services";
import { FormBarang } from "@/types";
import {
  customNotification,
  extractErrorMessage,
  listPeriodService,
} from "@/utils";
import { ActionIcon, Flex, Grid } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { ReactNode } from "react";

interface PropTypes {
  formBarang: FormBarang;
  setFormBarang: (_value: FormBarang) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formBarang, setFormBarang, isDisable, onSubmit, button } = props;

  const isLoading = useBoolean();

  const { selectTypeItem, fetchDropdownTypeItem } = useZustandStore();

  async function handleCreateType(params: string) {
    isLoading.onTrue();
    try {
      const response = await tipeBarangService.create({ name: params });

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            fetchDropdownTypeItem();
            setFormBarang({ ...formBarang, typeId: String(response.data.id) });
            isLoading.onFalse();
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
  }

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
          <DropdownCreateComponent
            placeholder="Tipe Barang"
            data={selectTypeItem}
            withLabel
            value={formBarang.typeId ?? null}
            onChange={(value) =>
              setFormBarang({ ...formBarang, typeId: value })
            }
            onCreate={(val) => handleCreateType(val)}
            require
            withinPortal={false}
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInputComponent
            name="Nama"
            require
            value={formBarang?.name}
            onChange={(e) =>
              setFormBarang({ ...formBarang, name: e.target.value })
            }
            disabled={isDisable}
            description={true}
            maxChar={150}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextAreaInputComponent
            name="Deskripsi"
            require
            value={formBarang?.description}
            onChange={(e) =>
              setFormBarang({ ...formBarang, description: e.target.value })
            }
            disabled={isDisable}
            resize="vertical"
            description={true}
            maxChar={250}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <DateInputComponent
            label="Tanggal Pembelian"
            value={formBarang?.purchaseDate ?? null}
            onChange={(value) => {
              setFormBarang({
                ...formBarang,
                purchaseDate: value,
              });
            }}
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <NumberInputComponent
            name="Harga"
            value={formBarang?.purchasePrice}
            onChange={(value) =>
              setFormBarang({ ...formBarang, purchasePrice: value })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <TextInputComponent
            name="Lama Garansi"
            value={formBarang?.guaranty ?? ""}
            onChange={(e) =>
              setFormBarang({ ...formBarang, guaranty: e.target.value })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <NumberInputComponent
            name="Jumlah"
            require
            value={formBarang?.quantity}
            onChange={(value) =>
              setFormBarang({ ...formBarang, quantity: value })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <DateInputComponent
            label="Tanggal Terakhir Service"
            value={formBarang?.maintainceDate ?? null}
            onChange={(value) => {
              setFormBarang({
                ...formBarang,
                maintainceDate: value,
              });
            }}
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <Grid w={"100%"} gutter={"xs"}>
            <Grid.Col span={6}>
              <NumberInputComponent
                name="Interval Service"
                value={formBarang?.maintainceInterval}
                onChange={(value) =>
                  setFormBarang({ ...formBarang, maintainceInterval: value })
                }
                disabled={isDisable}
                require
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DropdownComponent
                placeholder={"Periode Service"}
                data={listPeriodService()}
                value={formBarang?.maintenancePeriod}
                onChange={(value) =>
                  setFormBarang({ ...formBarang, maintenancePeriod: value })
                }
                withLabel
                require
                disabled={isDisable}
                withinPortal={false}
                disableSearch
              />
            </Grid.Col>
          </Grid>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <DropdownBapel
            value={formBarang?.bapelId}
            onChange={(value) =>
              setFormBarang({ ...formBarang, bapelId: value })
            }
            withLabel
            require
            disabled={isDisable}
            withinPortal={false}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <DropdownRoom
            value={formBarang?.roomId}
            onChange={(value) =>
              setFormBarang({ ...formBarang, roomId: value })
            }
            withLabel
            require
            disabled={isDisable}
            withinPortal={false}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <ImageInputComponent
            name="Main Image"
            require
            value={formBarang?.mainImage}
            onChange={(value) =>
              setFormBarang({ ...formBarang, mainImage: value })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        {formBarang.image?.map(
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
                      setFormBarang({
                        ...formBarang,
                        image: formBarang.image.map((img, i) =>
                          i === index ? value : img,
                        ),
                      })
                    }
                    disabled={isDisable}
                  />
                  {index === formBarang.image.length - 1 &&
                  formBarang.image[index] !== undefined &&
                  formBarang.image[index] !== null &&
                  formBarang.image.length < 4 ? (
                    <ActionIcon
                      size={32}
                      variant="light"
                      color="blue"
                      aria-label="Tambah Detail"
                      disabled={isDisable}
                      onClick={() => {
                        setFormBarang({
                          ...formBarang,
                          image: [...formBarang.image, undefined],
                        });
                      }}>
                      <IconPlus
                        style={{ width: "60%", height: "60%" }}
                        stroke={1.5}
                      />
                    </ActionIcon>
                  ) : null}
                  {(formBarang.image[index] === undefined ||
                    formBarang.image[index] === null) &&
                  formBarang.image.length > 1 ? (
                    <ActionIcon
                      size={32}
                      variant="light"
                      color="red"
                      aria-label="Erase Detail"
                      onClick={() => {
                        const newImages = formBarang.image.filter(
                          (_, i) => i !== index,
                        );

                        setFormBarang({
                          ...formBarang,
                          image: newImages,
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
      </Grid>
      {button}
    </form>
  );
};

export default Form;
