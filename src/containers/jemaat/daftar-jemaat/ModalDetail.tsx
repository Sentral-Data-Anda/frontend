import { useBoolean } from "@/hooks";
import { FormDaftarJemaat } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { jemaatService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeJemaat: string;
  handleGetAll: () => void;
  formName: string;
  withEditButton: boolean;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeJemaat, handleGetAll, formName, withEditButton } =
    props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

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

  async function handleGetDetail(code: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await jemaatService.getOne(code);

      delete response.data.code;

      setFormDaftarJemaat({
        ...response.data,
        professionId:
          response.data.professionId !== null
            ? String(response.data.professionId)
            : null,
        etnicGroupId:
          response.data.etnicGroupId !== null
            ? String(response.data.etnicGroupId)
            : null,
        zoneChurchId:
          response.data.zoneChurchId !== null
            ? String(response.data.zoneChurchId)
            : null,
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
        ...formDaftarJemaat,
        email:
          formDaftarJemaat.email !== "" && formDaftarJemaat.email !== null
            ? formDaftarJemaat.email
            : null,
        phone:
          formDaftarJemaat.phone !== "" && formDaftarJemaat.phone !== null
            ? formDaftarJemaat.phone
            : null,
        typeJemaat: "ANGGOTA",
        statusJemaat: formDaftarJemaat.additional.find(
          (item) =>
            item.type === "MENINGGAL/WAFAT" || item.type === "ATESTASI KELUAR",
        )
          ? "TIDAK_AKTIF"
          : "AKTIF",
      };

      const response = await jemaatService.update(codeJemaat, payload);

      if (response && response.status === 200) {
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
      title={`${isEditing.value ? "Edit" : "Detail"} Data ${formName}`}
      withEditButton={withEditButton}
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
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
