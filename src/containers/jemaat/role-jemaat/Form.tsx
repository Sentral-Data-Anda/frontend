import {
  DateInputComponent,
  DropdownBapel,
  DropdownJemaat,
  RadioInputComponent,
  TextInputComponent,
} from "@/components";
import { FormRoleJemaat } from "@/types";
import { Grid, Group, Radio } from "@mantine/core";
import dayjs from "dayjs";
import { ReactNode } from "react";

interface PropTypes {
  formRoleJemaat: FormRoleJemaat;
  setFormRoleJemaat: (_value: FormRoleJemaat) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formRoleJemaat, setFormRoleJemaat, isDisable, onSubmit, button } =
    props;

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
            name="Name"
            value={formRoleJemaat.name}
            onChange={(e) =>
              setFormRoleJemaat({
                ...formRoleJemaat,
                name: e.target.value,
              })
            }
            require
            description={true}
            maxChar={100}
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <DateInputComponent
            label="Start Periode"
            value={formRoleJemaat.startPeriode}
            onChange={(value) => {
              setFormRoleJemaat({
                ...formRoleJemaat,
                startPeriode: value,
                endPeriode: null,
              });
            }}
            disabled={isDisable}
            require
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <DateInputComponent
            excludeDate={(date) =>
              dayjs(date) < dayjs(formRoleJemaat?.startPeriode ?? "")
            }
            label="End Periode"
            value={formRoleJemaat.endPeriode}
            onChange={(value) => {
              setFormRoleJemaat({
                ...formRoleJemaat,
                endPeriode: value,
              });
            }}
            disabled={isDisable || formRoleJemaat.startPeriode === null}
            require
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <DropdownJemaat
            value={formRoleJemaat.jemaatId}
            onChange={(value) => {
              setFormRoleJemaat({
                ...formRoleJemaat,
                jemaatId: value,
              });
            }}
            withinPortal={false}
            withLabel
            require
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <DropdownBapel
            value={formRoleJemaat.bapelId}
            onChange={(value) => {
              setFormRoleJemaat({
                ...formRoleJemaat,
                bapelId: value,
              });
            }}
            withinPortal={false}
            withLabel
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <Radio.Group
            label="Status"
            name="status"
            withAsterisk
            value={formRoleJemaat?.status ? "true" : "false"}
            onChange={(value) => {
              setFormRoleJemaat({
                ...formRoleJemaat,
                status: value === "true",
              });
            }}
            styles={{
              label: {
                fontSize: 12,
              },
            }}>
            <Group mt="xs">
              <RadioInputComponent name="Aktif" value={"true"} />
              <RadioInputComponent name="Tidak Aktif" value={"false"} />
            </Group>
          </Radio.Group>
        </Grid.Col>
      </Grid>

      {button}
    </form>
  );
};

export default Form;
