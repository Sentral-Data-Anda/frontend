import { useBoolean } from "@/hooks";
import { FormDaftarJemaat } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { jemaatService } from "@/services";
import {
  customNotification,
  extractErrorMessage,
  formatDateToISO,
} from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeJemaat: string;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeJemaat, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [formDaftarJemaat, setFormDaftarJemaat] = useState<FormDaftarJemaat>({
    name: "",
    birthDate: null,
    gender: null,
    address: "",
    email: null,
    phone: null,
    status: null,
  });

  async function handleGetDetail(code: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await jemaatService.getOne(code);

      setFormDaftarJemaat({
        ...response.data,
        birthDate: String(formatDateToISO(response.data.birthDate)),
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
    } finally {
      isLoadingDetail.onFalse();
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(codeJemaat);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = {
        name: formDaftarJemaat.name,
        birthDate: formDaftarJemaat.birthDate,
        gender: formDaftarJemaat.gender,
        address: formDaftarJemaat.address,
        status: formDaftarJemaat.status,
        email:
          formDaftarJemaat.email !== "" && formDaftarJemaat.email !== null
            ? formDaftarJemaat.email
            : null,
        phone:
          formDaftarJemaat.phone !== "" && formDaftarJemaat.phone !== null
            ? formDaftarJemaat.phone
            : null,
      };

      const response = await jemaatService.update(codeJemaat, payload);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormDaftarJemaat({
              name: "",
              birthDate: null,
              gender: null,
              address: "",
              email: "",
              phone: "",
              status: null,
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
      loading={isLoadingDetail.value}
      opened={isOpenModal.value}
      title={`${isEditing.value ? "Edit" : "Detail"} Data Jemaat`}
      withEditButton
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setFormDaftarJemaat({
          name: "",
          birthDate: null,
          gender: null,
          address: "",
          email: "",
          phone: "",
          status: null,
        });
      }}>
      <Form
        isDisable={!isEditing.value || isLoading.value}
        formDaftarJemaat={formDaftarJemaat}
        setFormDaftarJemaat={setFormDaftarJemaat}
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
