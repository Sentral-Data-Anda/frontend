import { Group } from "@mantine/core";
import { ButtonComponent } from "./ButtonComponent";
import { ButtonSubmitComponent } from "./ButtonSubmit";

interface PropTypes {
  disableCancel: boolean;
  disableSubmit: boolean;
  nameSubmit: string;
  onCancel: () => void;
}

export const ButtonGroupComponent = (props: PropTypes) => {
  const { nameSubmit, disableSubmit, disableCancel, onCancel } = props;

  return (
    <Group grow py={10}>
      <ButtonComponent
        variant="light"
        color="red"
        name="Cancel"
        onClick={onCancel}
        disabled={disableCancel}
      />
      <ButtonSubmitComponent name={nameSubmit} loading={disableSubmit} />
    </Group>
  );
};
