import { useBoolean } from "@/hooks";
import { FormJadwalPelayan } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { jadwalPelayanService, pelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeJadwal: string;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeJadwal, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [formJadwalPelayan, setFormJadwalPelayan] = useState<FormJadwalPelayan>(
    {
      bapelId: null,
      date: null,
      name: "",
      startTime: null,
      endTime: null,
      makeTemplate: false,
      detail: [
        {
          order: 1,
          rolePelayanId: null,
          isLoadingPelayan: false,
          pelayanId: null,
        },
      ],
    },
  );

  async function handleGetDetail(codeJadwal: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await jadwalPelayanService.getOne(codeJadwal);

      setFormJadwalPelayan({
        bapelId: String(response.data.bapel.id),
        date: response.data.date,
        name: response.data.name,
        startTime: response.data.startTime,
        endTime: response.data.endTime,
        makeTemplate: false,
        detail: response.data.detail,
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
      isLoadingDetail.onFalse();
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(codeJadwal);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const customDetail = formJadwalPelayan.detail.map((item) => {
        const rawPelayanId = item.pelayanId?.split("-");

        const isIndividu = rawPelayanId?.[1] === "I";

        const isGroup = rawPelayanId?.[1] === "G";

        const pelayanId = rawPelayanId ? +rawPelayanId[0] : null;

        const skillMusikId = rawPelayanId ? +rawPelayanId[1] : null;

        return {
          order: item.order,
          rolePelayanId: item.rolePelayanId ? +item.rolePelayanId : null,
          pelayanId: isGroup ? null : pelayanId,
          groupPelayanId: isGroup ? pelayanId : null,
          musikSkillId: isIndividu && !isGroup ? null : skillMusikId,
        };
      });

      const payload = {
        bapelId: formJadwalPelayan.bapelId,
        date: formJadwalPelayan.date,
        name: formJadwalPelayan.name,
        startTime: formJadwalPelayan.startTime,
        endTime: formJadwalPelayan.endTime,
        makeTemplate: false,
        detail: customDetail,
      };

      const response = await pelayanService.update(codeJadwal, payload);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormJadwalPelayan({
              bapelId: null,
              date: null,
              name: "",
              startTime: null,
              endTime: null,
              makeTemplate: false,
              detail: [
                {
                  order: 1,
                  rolePelayanId: null,
                  pelayanId: null,
                  isLoadingPelayan: false,
                },
              ],
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
        setFormJadwalPelayan({
          bapelId: null,
          date: null,
          name: "",
          startTime: null,
          endTime: null,
          makeTemplate: false,
          detail: [
            {
              order: 1,
              rolePelayanId: null,
              pelayanId: null,
              isLoadingPelayan: false,
            },
          ],
        });
      }}>
      <Form
        isDisable={!isEditing.value || isLoading.value}
        isEditing={true}
        isLoadingDetail={isLoadingDetail}
        formJadwalPelayan={formJadwalPelayan}
        setFormJadwalPelayan={setFormJadwalPelayan}
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
