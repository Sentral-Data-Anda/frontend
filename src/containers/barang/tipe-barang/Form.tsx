import { TextInputComponent } from "@/components";
import { FormTipeBarang } from "@/types";
import { Grid } from "@mantine/core";
import { ReactNode } from "react";

interface PropTypes {
  formTipeBarang: FormTipeBarang;
  setFormTipeBarang: (_value: FormTipeBarang) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formTipeBarang, setFormTipeBarang, isDisable, onSubmit, button } =
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
            name="Nama"
            require
            value={formTipeBarang.name}
            onChange={(e) =>
              setFormTipeBarang({ ...formTipeBarang, name: e.target.value })
            }
            description={true}
            maxChar={50}
            disabled={isDisable}
          />
        </Grid.Col>
      </Grid>

      {button}
    </form>
  );
};

export default Form;
