import { useBoolean } from "@/hooks";
import { FormRoleJemaat } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { roleJemaatService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formRoleJemaat, setFormRoleJemaat] = useState<FormRoleJemaat>({
    name: "",
    startPeriode: null,
    endPeriode: null,
    jemaatId: null,
    bapelId: null,
    status: false,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await roleJemaatService.create(formRoleJemaat);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormRoleJemaat({
              name: "",
              startPeriode: null,
              endPeriode: null,
              jemaatId: null,
              bapelId: null,
              status: false,
            });
            isOpenModal.onFalse();
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
    <ModalComponent
      opened={isOpenModal.value}
      title="Create Role Jemaat"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormRoleJemaat({
          name: "",
          startPeriode: null,
          endPeriode: null,
          jemaatId: null,
          bapelId: null,
          status: false,
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formRoleJemaat={formRoleJemaat}
        setFormRoleJemaat={setFormRoleJemaat}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
