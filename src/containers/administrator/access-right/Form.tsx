import { TextInputComponent } from "@/components";
import { FormAccess } from "@/types";
import { Grid } from "@mantine/core";
import { ReactNode } from "react";

interface PropTypes {
  formAccess: FormAccess;
  setFormAccess: (_value: FormAccess) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formAccess, setFormAccess, isDisable, onSubmit, button } = props;

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
            value={formAccess.name}
            onChange={(e) => setFormAccess({ name: e.target.value })}
            disabled={isDisable}
            description={true}
            maxChar={50}
          />
        </Grid.Col>
      </Grid>

      {button}
    </form>
  );
};

export default Form;
