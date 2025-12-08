import { useBoolean, useZustandStore } from "@/hooks";
import { FormDaftarPelayan } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { pelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codePelayan: string;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codePelayan, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const { selectRolePelayan } = useZustandStore();

  const valuePemusik = selectRolePelayan?.find(
    (item) => item.label === "Pemusik",
  )?.value;

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

  async function handleGetDetail(codePelayan: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await pelayanService.getOne(codePelayan);

      const resIsPemusik = response?.data?.rolePelayan?.includes(valuePemusik);

      setFormDaftarPelayan({
        bapelId: response.data.bapelId,
        typePelayan: response.data.typePelayan,
        jemaatId: response.data.jemaatId,
        name: response.data.name,
        phone: response.data.phone,
        status: response.data.status ? "1" : "0",
        members: response.data.members,
        isPemusik: resIsPemusik,
        musikSkill: response.data.musikSkill,
        rolePelayan: response.data.rolePelayan,
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
      handleGetDetail(codePelayan);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = {
        ...formDaftarPelayan,
        phone: formDaftarPelayan?.phone?.toString(),
        status: +formDaftarPelayan.status === 1 ? true : false,
      };

      const response = await pelayanService.update(codePelayan, payload);

      if (response && response.status === 200) {
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
      title={`${isEditing.value ? "Edit" : "Detail"} Pelayan`}
      withEditButton
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
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
        isDisable={!isEditing.value || isLoading.value}
        isEditing={true}
        formDaftarPelayan={formDaftarPelayan}
        setFormDaftarPelayan={setFormDaftarPelayan}
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
