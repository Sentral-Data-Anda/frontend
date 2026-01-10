import { useBoolean } from "@/hooks";
import { FormJadwalPelayan } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { jadwalPelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
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
        makeTemplate: formJadwalPelayan.makeTemplate,
        detail: customDetail,
      };

      const response = await jadwalPelayanService.create(payload);

      if (response && response.status === 201) {
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
      title="Create Jadwal Pelayan"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
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
              isLoadingPelayan: false,
              pelayanId: null,
            },
          ],
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formJadwalPelayan={formJadwalPelayan}
        setFormJadwalPelayan={setFormJadwalPelayan}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
