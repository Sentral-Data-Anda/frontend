import { useBoolean } from "@/hooks";
import { FormAgenda } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { loanRoomService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  chooseDate: string;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, chooseDate, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formAgenda, setFormAgenda] = useState<FormAgenda>({
    date: null,
    startTime: "",
    endTime: "",
    purpose: "",
    jemaatId: null,
    roomId: null,
    bapelId: null,
  });

  useEffect(() => {
    if (isOpenModal.value) {
      setFormAgenda({
        ...formAgenda,
        date: chooseDate,
      });
    }
  }, [isOpenModal.value]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await loanRoomService.create(formAgenda);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormAgenda({
              date: null,
              startTime: "",
              endTime: "",
              purpose: "",
              jemaatId: null,
              roomId: null,
              bapelId: null,
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
      loading={isLoading.value}
      opened={isOpenModal.value}
      title="Create New Agenda"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormAgenda({
          date: null,
          startTime: "",
          endTime: "",
          purpose: "",
          jemaatId: null,
          roomId: null,
          bapelId: null,
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formAgenda={formAgenda}
        setFormAgenda={setFormAgenda}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
