import {
  DropdownJemaat,
  DropdownRoleUser,
  TextInputComponent,
} from "@/components";
import { FormUser } from "@/types";
import { Grid } from "@mantine/core";
import { ReactNode } from "react";

interface PropTypes {
  formUser: FormUser;
  setFormUser: (_value: FormUser) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
  isEdit?: boolean;
  nameJemaat?: string;
}

const Form = (props: PropTypes) => {
  const {
    formUser,
    setFormUser,
    isDisable,
    onSubmit,
    button,
    isEdit = false,
    nameJemaat,
  } = props;

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
          {isEdit ? (
            <TextInputComponent
              name="Jemaat"
              value={nameJemaat}
              require
              disabled
            />
          ) : (
            <DropdownJemaat
              status="0"
              type={["ANGGOTA"]}
              withLabel
              withinPortal={false}
              require
              value={formUser.jemaatId}
              onChange={(value) => {
                setFormUser({
                  ...formUser,
                  jemaatId: value,
                });
              }}
              disabled={isDisable}
            />
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <DropdownRoleUser
            pick={formUser.roleUserId}
            setPick={(value) => {
              setFormUser({
                ...formUser,
                roleUserId: value,
              });
            }}
            withLabel
            withinPortal={false}
            require
            disabled={isDisable}
          />
        </Grid.Col>
      </Grid>

      {button}
    </form>
  );
};

export default Form;
