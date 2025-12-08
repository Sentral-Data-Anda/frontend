import { useBoolean } from "@/hooks";
import { FormRoleJemaat } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { roleJemaatService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  idRole: number;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, idRole, handleGetAll } = props;

  const isLoading = useBoolean();

  const isEditing = useBoolean();

  const [formRoleJemaat, setFormRoleJemaat] = useState<FormRoleJemaat>({
    name: "",
    startPeriode: null,
    endPeriode: null,
    jemaatId: null,
    bapelId: null,
    status: false,
  });

  async function handleGetDetail(id: number) {
    isLoading.onTrue();

    try {
      const response = await roleJemaatService.getOne(id);

      setFormRoleJemaat({
        name: response.data.name,
        startPeriode: response.data.startPeriode,
        endPeriode: response.data.endPeriode,
        status: response.data.status,
        jemaatId: String(response.data.jemaat.id),
        bapelId: response.data.bapel ? String(response.data.bapel.id) : null,
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(idRole);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await roleJemaatService.update(idRole, formRoleJemaat);

      if (response && response.status === 200) {
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
            isEditing.onFalse();
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
      title={`${isEditing.value ? "Edit" : "Detail"} Role Jemaat`}
      withEditButton
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
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
        isDisable={!isEditing.value || isLoading.value}
        formRoleJemaat={formRoleJemaat}
        setFormRoleJemaat={setFormRoleJemaat}
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
