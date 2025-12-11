import { useBoolean } from "@/hooks";
import { FormEvents } from "@/types";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { eventService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formEvents, setFormEvents] = useState<FormEvents>({
    name: "",
    description: "",
    isIndoor: undefined,
    location: "",
    capacity: "",
    isPaid: undefined,
    price: "",
    startDate: null,
    endDate: null,
    startTime: undefined,
    endTime: undefined,
    image: null,
    urlForm: "",
    isPublish: undefined,
    bapelId: null,
    roomId: null,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = new FormData();

      payload.append("name", formEvents.name);
      payload.append("description", formEvents.description);
      payload.append("capacity", String(formEvents.capacity));
      payload.append("price", String(formEvents.price));
      payload.append("bapelId", String(formEvents.bapelId));

      if (formEvents.startDate && formEvents.startTime) {
        payload.append(
          "startDate",
          `${formEvents.startDate} ${formEvents.startTime}`,
        );
      }

      if (formEvents.endDate && formEvents.endTime) {
        payload.append(
          "endDate",
          `${formEvents.endDate} ${formEvents.endTime}`,
        );
      }

      if (formEvents.isIndoor === "true") {
        payload.append("isIndoor", String(1));
        payload.append("roomId", String(formEvents.roomId));
        payload.append("location", "");
      }

      if (formEvents.isIndoor === "false") {
        payload.append("isIndoor", String(0));
        payload.append("roomId", "");
        payload.append("location", String(formEvents.location));
      }

      if (formEvents.isPaid === "true") {
        payload.append("isPaid", String(1));
      }

      if (formEvents.isPaid === "false") {
        payload.append("isPaid", String(0));
      }

      if (formEvents.image) {
        payload.append("mainImage", formEvents.image);
      }

      if (formEvents.urlForm) {
        payload.append("urlForm", formEvents.urlForm);
      }

      if (formEvents.isPublish) {
        payload.append("isPublish", formEvents.isPublish);
      }

      const response = await eventService.create(payload);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormEvents({
              name: "",
              description: "",
              isIndoor: undefined,
              location: "",
              capacity: "",
              isPaid: undefined,
              price: "",
              startDate: null,
              endDate: null,
              startTime: undefined,
              endTime: undefined,
              image: null,
              urlForm: "",
              isPublish: undefined,
              bapelId: null,
              roomId: null,
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
      title="Create New Events"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormEvents({
          name: "",
          description: "",
          isIndoor: undefined,
          location: "",
          capacity: "",
          isPaid: undefined,
          price: "",
          startDate: null,
          endDate: null,
          startTime: undefined,
          endTime: undefined,
          image: null,
          urlForm: "",
          isPublish: undefined,
          bapelId: null,
          roomId: null,
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formEvents={formEvents}
        setFormEvents={setFormEvents}
        onSubmit={handleCreate}
        button={<ButtonSubmitComponent name={"Save"} />}
      />
    </ModalComponent>
  );
};

export default ModalCreate;
