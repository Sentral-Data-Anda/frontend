import {
  DateTimeInputComponent,
  DropdownBapel,
  DropdownRoom,
  ImageInputComponent,
  NumberInputComponent,
  RadioInputComponent,
  TextAreaInputComponent,
  TextInputComponent,
} from "@/components";
import { FormEvents } from "@/types";
import { Grid, Group, Radio } from "@mantine/core";
import dayjs from "dayjs";
import { ReactNode } from "react";

interface PropTypes {
  formEvents: FormEvents;
  setFormEvents: (_value: FormEvents) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formEvents, setFormEvents, isDisable, onSubmit, button } = props;

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
            value={formEvents?.bapelId}
            onChange={(value) =>
              setFormEvents({ ...formEvents, bapelId: value })
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
            value={formEvents?.name}
            onChange={(e) =>
              setFormEvents({ ...formEvents, name: e.target.value })
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
            value={formEvents?.description}
            onChange={(e) =>
              setFormEvents({ ...formEvents, description: e.target.value })
            }
            disabled={isDisable}
            resize="vertical"
            description={true}
            maxChar={250}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <NumberInputComponent
            name="Jumlah Peserta"
            require
            value={formEvents?.capacity}
            onChange={(value) =>
              setFormEvents({ ...formEvents, capacity: value })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <DateTimeInputComponent
            excludeDate={(date) => dayjs(date).isBefore(dayjs(), "day")}
            label="Tanggal Mulai"
            value={formEvents?.startDate ?? null}
            onChange={(value) => {
              setFormEvents({
                ...formEvents,
                startDate: value,
              });
            }}
            disabled={isDisable}
            require
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <DateTimeInputComponent
            excludeDate={(date) =>
              dayjs(date).isBefore(dayjs(), "day") ||
              new Date(date) < new Date(formEvents?.startDate ?? "")
            }
            label="Tanggal Berakhir"
            value={formEvents?.endDate ?? null}
            onChange={(value) => {
              setFormEvents({
                ...formEvents,
                endDate: value,
              });
            }}
            disabled={isDisable}
            require
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <Radio.Group
            label="Lokasi"
            name="lokasiEvents"
            withAsterisk
            value={formEvents?.isIndoor}
            onChange={(value) => {
              setFormEvents({
                ...formEvents,
                isIndoor: value,
              });
            }}
            styles={{
              label: {
                fontSize: 12,
              },
            }}>
            <Group mt="xs">
              <RadioInputComponent
                name="Dalam Gereja"
                value={"true"}
                disabled={isDisable}
              />
              <RadioInputComponent
                name="Luar Gereja"
                value={"false"}
                disabled={isDisable}
              />
            </Group>
          </Radio.Group>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          {formEvents?.isIndoor === "true" ? (
            <DropdownRoom
              value={formEvents?.roomId}
              onChange={(value) =>
                setFormEvents({ ...formEvents, roomId: value })
              }
              withLabel
              require
              disabled={isDisable}
              withinPortal={false}
            />
          ) : null}
          {formEvents?.isIndoor === "false" ? (
            <TextInputComponent
              name="Lokasi Luar Gereja"
              value={formEvents?.location ?? ""}
              onChange={(e) =>
                setFormEvents({ ...formEvents, location: e.target.value })
              }
              disabled={isDisable}
              require
            />
          ) : null}
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <Radio.Group
            label="Biaya"
            name="biayaEvents"
            withAsterisk
            value={formEvents?.isPaid}
            onChange={(value) =>
              setFormEvents({
                ...formEvents,
                isPaid: value,
              })
            }
            styles={{
              label: {
                fontSize: 12,
              },
            }}>
            <Group mt="xs">
              <RadioInputComponent
                name="Gratis"
                value={"false"}
                onChange={(value) =>
                  setFormEvents({
                    ...formEvents,
                    isPaid: value,
                  })
                }
                disabled={isDisable}
              />
              <RadioInputComponent
                name="Berbayar"
                value={"true"}
                disabled={isDisable}
              />
            </Group>
          </Radio.Group>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          {formEvents?.isPaid === "true" ? (
            <NumberInputComponent
              name="Jumlah"
              require
              value={formEvents?.price}
              onChange={(value) =>
                setFormEvents({ ...formEvents, price: value })
              }
              disabled={isDisable}
            />
          ) : null}
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <ImageInputComponent
            name="Thumbnail"
            require
            value={formEvents?.image}
            onChange={(value) => setFormEvents({ ...formEvents, image: value })}
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInputComponent
            name="URL Form"
            value={formEvents?.urlForm}
            onChange={(e) =>
              setFormEvents({ ...formEvents, urlForm: e.target.value })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }} my={5}>
          <Radio.Group
            label="Publish"
            name="publishEvent"
            withAsterisk
            value={formEvents?.isPublish}
            onChange={(value) => {
              setFormEvents({
                ...formEvents,
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
