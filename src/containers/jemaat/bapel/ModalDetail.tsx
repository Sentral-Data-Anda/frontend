import { ButtonGroupComponent, ModalComponent } from "@/components";
import { useBoolean } from "@/hooks";
import { FormBapel } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import FormBadanPelayanan from "./Form";
import { useEffect, useState } from "react";
import { bapelService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeBapel: string;
  handleGetAll: () => void;
  withEditButton: boolean;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeBapel, handleGetAll, withEditButton } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [formBapel, setFormBapel] = useState<FormBapel>({
    name: "",
    haveRules: false,
  });

  async function handleGetDetail(code: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await bapelService.getOne(code);

      setFormBapel({
        name: response.data.name,
        haveRules: response.data.haveRules,
        ruleType: response.data.ruleType,
        date: response.data.date,
        dayOfWeek:
          response.data.dayOfWeek !== null
            ? String(response.data.dayOfWeek)
            : undefined,
        startTime: response.data.startTime,
        endTime: response.data.endTime,
        weekOfMonth: response.data.weekOfMonth,
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
    } finally {
      isLoadingDetail.onFalse();
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(codeBapel);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await bapelService.update(codeBapel, formBapel);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormBapel({
              name: "",
              haveRules: false,
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
      opened={isOpenModal.value}
      loading={isLoadingDetail.value}
      withEditButton={withEditButton}
      isEditing={isEditing}
      title={`${isEditing.value ? "Edit" : "Detail"} Bapel`}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setTimeout(() => {
          setFormBapel({
            name: "",
            haveRules: false,
          });
        }, 500);
      }}>
      <FormBadanPelayanan
        isDisable={!isEditing.value || isLoading.value}
        formBapel={formBapel}
        setFormBapel={setFormBapel}
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
