import { useBoolean } from "@/hooks";
import { FormDaftarPelayan } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { pelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formDaftarPelayan, setFormDaftarPelayan] = useState<FormDaftarPelayan>(
    {
      bapelId: null,
      typePelayan: null,
      jemaatId: null,
      name: "",
      phone: "",
      status: "",
      members: [],
      isPemusik: false,
      musikSkill: [],
      rolePelayan: [],
    },
  );

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = {
        ...formDaftarPelayan,
        phone: formDaftarPelayan?.phone?.toString(),
        status: +formDaftarPelayan.status === 1 ? true : false,
      };

      const response = await pelayanService.create(payload);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormDaftarPelayan({
              bapelId: null,
              typePelayan: null,
              jemaatId: null,
              name: "",
              phone: "",
              status: "",
              members: [],
              isPemusik: false,
              musikSkill: [],
              rolePelayan: [],
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
      title="Create Pelayan"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormDaftarPelayan({
          bapelId: null,
          typePelayan: null,
          jemaatId: null,
          name: "",
          phone: "",
          status: "",
          members: [],
          isPemusik: false,
          musikSkill: [],
          rolePelayan: [],
        });
      }}>
      <Form
        isDisable={isLoading.value}
        isEditing={false}
        formDaftarPelayan={formDaftarPelayan}
        setFormDaftarPelayan={setFormDaftarPelayan}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
