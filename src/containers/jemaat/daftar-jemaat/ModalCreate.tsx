import { useBoolean } from "@/hooks";
import { FormDaftarJemaat } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { jemaatService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
  formName: string;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll, formName } = props;

  const isLoading = useBoolean();

  const [formDaftarJemaat, setFormDaftarJemaat] = useState<FormDaftarJemaat>({
    name: undefined,
    gender: null,
    birthPlace: "",
    birthDate: null,
    email: "",
    phone: "",
    bloodType: null,
    lastEducation: null,
    professionId: null,
    etnicGroupId: null,

    provincesCode: null,
    regenciesCode: null,
    districtsCode: null,
    villagesCode: null,
    address: "",
    zoneChurchId: null,

    statusMartial: null,
    spouseName: "",
    martialPlace: "",
    martialDate: null,
    codeInduk: "",
    additional: [],
  });

  useEffect(() => {
    if (isOpenModal.value && formName === "ANGGOTA") {
      setFormDaftarJemaat({
        ...formDaftarJemaat,
        additional: [
          {
            type: null,
            place: "",
            date: null,
          },
        ],
      });
    }
  }, [isOpenModal, formName]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = {
        ...formDaftarJemaat,
        email:
          formDaftarJemaat.email !== "" && formDaftarJemaat.email !== null
            ? formDaftarJemaat.email
            : null,
        phone:
          formDaftarJemaat.phone !== "" && formDaftarJemaat.phone !== null
            ? formDaftarJemaat.phone
            : null,
        typeJemaat: formName,
        statusJemaat: formName === "SIMPATISAN" ? "TIDAK_AKTIF" : "AKTIF",
      };

      const response = await jemaatService.create(payload);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormDaftarJemaat({
              name: undefined,
              gender: null,
              birthPlace: "",
              birthDate: null,
              email: "",
              phone: "",
              bloodType: null,
              lastEducation: null,
              professionId: null,
              etnicGroupId: null,

              provincesCode: null,
              regenciesCode: null,
              districtsCode: null,
              villagesCode: null,
              address: "",
              zoneChurchId: null,

              statusMartial: null,
              spouseName: "",
              martialPlace: "",
              martialDate: null,
              codeInduk: "",
              additional: [],
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
      title={`Create New ${formName}`}
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormDaftarJemaat({
          name: undefined,
          gender: null,
          birthPlace: "",
          birthDate: null,
          email: "",
          phone: "",
          bloodType: null,
          lastEducation: null,
          professionId: null,
          etnicGroupId: null,

          provincesCode: null,
          regenciesCode: null,
          districtsCode: null,
          villagesCode: null,
          address: "",
          zoneChurchId: null,

          statusMartial: null,
          spouseName: "",
          martialPlace: "",
          martialDate: null,
          codeInduk: "",
          additional: [],
        });
      }}>
      <Form
        formName={formName}
        isDisable={isLoading.value}
        formDaftarJemaat={formDaftarJemaat}
        setFormDaftarJemaat={setFormDaftarJemaat}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
