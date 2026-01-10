import { useBoolean } from "@/hooks";
import { FormAgenda } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { loanRoomService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeAgenda: string;
  handleGetAll: () => void;
  withEditButton: boolean;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeAgenda, handleGetAll, withEditButton } = props;

  const isLoading = useBoolean();

  const isEditing = useBoolean();

  const [formAgenda, setFormAgenda] = useState<FormAgenda>({
    date: null,
    startTime: "",
    endTime: "",
    purpose: "",
    jemaatId: null,
    roomId: null,
    bapelId: null,
  });

  async function handleGetDetail(codeAgenda: string) {
    isLoading.onTrue();

    try {
      const response = await loanRoomService.getOne(codeAgenda);

      setFormAgenda({
        ...response.data,
        roomId: String(response.data.room.id),
        bapelId: String(response.data.bapel.id),
        jemaatId: String(response.data.jemaat.id),
      });

      isLoading.onFalse();
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      }).then(() => {
        isLoading.onFalse();
      });
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(codeAgenda);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await loanRoomService.update(codeAgenda, formAgenda);

      if (response && response.status === 200) {
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
      title={`${isEditing.value ? "Edit" : "Detail"} Agenda`}
      withEditButton={withEditButton}
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
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
        isDisable={!isEditing.value || isLoading.value}
        formAgenda={formAgenda}
        setFormAgenda={setFormAgenda}
        onSubmit={handleUpdate}
        button={
          isEditing.value ? (
            <ButtonGroupComponent
              nameSubmit="Update"
              disableSubmit={isLoading.value}
              disableCancel={isLoading.value}
              onCancel={() => isEditing.onFalse()}
            />
          ) : null
        }
      />
    </ModalComponent>
  );
};

export default ModalDetail;
