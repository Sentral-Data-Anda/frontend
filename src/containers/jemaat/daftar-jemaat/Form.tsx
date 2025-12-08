import {
  DateInputComponent,
  DropdownGender,
  DropdownStatusJemaat,
  PhoneInputComponent,
  TextAreaInputComponent,
  TextInputComponent,
} from "@/components";
import { FormDaftarJemaat } from "@/types";
import { Grid } from "@mantine/core";
import { ReactNode } from "react";

interface PropTypes {
  formDaftarJemaat: FormDaftarJemaat;
  setFormDaftarJemaat: (_value: FormDaftarJemaat) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formDaftarJemaat, setFormDaftarJemaat, isDisable, onSubmit, button } =
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
            value={formDaftarJemaat.name}
            onChange={(e) =>
              setFormDaftarJemaat({
                ...formDaftarJemaat,
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
          <DropdownGender
            pick={formDaftarJemaat.gender}
            setPick={(value) => {
              setFormDaftarJemaat({
                ...formDaftarJemaat,
                gender: value !== null ? value : null,
              });
            }}
            withinPortal={false}
            withLabel
            require
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <DateInputComponent
            label="Date of Birth"
            value={formDaftarJemaat.birthDate}
            onChange={(value) => {
              setFormDaftarJemaat({
                ...formDaftarJemaat,
                birthDate: value,
              });
            }}
            disabled={isDisable}
            require
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextAreaInputComponent
            name="Address"
            require
            value={formDaftarJemaat?.address}
            onChange={(e) =>
              setFormDaftarJemaat({
                ...formDaftarJemaat,
                address: e.target.value,
              })
            }
            disabled={isDisable}
            resize="vertical"
            description={true}
            maxChar={250}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInputComponent
            name="Email"
            value={formDaftarJemaat?.email ?? ""}
            onChange={(e) =>
              setFormDaftarJemaat({
                ...formDaftarJemaat,
                email: e.target.value,
              })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <PhoneInputComponent
            name="Phone"
            value={formDaftarJemaat?.phone ?? ""}
            onChange={(value) =>
              setFormDaftarJemaat({
                ...formDaftarJemaat,
                phone: String(value),
              })
            }
            disabled={isDisable}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <DropdownStatusJemaat
            withLabel
            pick={formDaftarJemaat.status}
            setPick={(value) => {
              setFormDaftarJemaat({
                ...formDaftarJemaat,
                status: value,
              });
            }}
            disabled={isDisable}
            withinPortal={false}
            require
          />
        </Grid.Col>
      </Grid>

      {button}
    </form>
  );
};

export default Form;
