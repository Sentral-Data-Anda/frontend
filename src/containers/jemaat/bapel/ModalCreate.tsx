import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { useBoolean } from "@/hooks";
import { FormBapel } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import FormBadanPelayanan from "./Form";
import { useState } from "react";
import { bapelService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formBapel, setFormBapel] = useState<FormBapel>({
    name: "",
    haveRules: false,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await bapelService.create(formBapel);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormBapel({
              name: "",
              haveRules: false,
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
      title={"Create New Bapel"}
      close={() => {
        isOpenModal.onFalse();
        setTimeout(() => {
          setFormBapel({
            name: "",
            haveRules: false,
          });
        }, 500);
      }}>
      <FormBadanPelayanan
        isDisable={isLoading.value}
        formBapel={formBapel}
        setFormBapel={setFormBapel}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
