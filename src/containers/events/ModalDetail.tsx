import { useBoolean } from "@/hooks";
import { FormEvents, Events } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { eventService } from "@/services";
import {
  customNotification,
  extractErrorMessage,
  urlImageToFile,
} from "@/utils";
import Detail from "./Detail";
import dayjs from "dayjs";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeEvent: string;
  withEditButton: boolean;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeEvent, withEditButton, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [data, setData] = useState<Events | null>(null);

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

  async function handleGetDetail(codeEvent: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await eventService.getOne(codeEvent);

      setData(response.data);

      let basicImage: File = {} as File;

      if (response.data.image) {
        basicImage = await urlImageToFile(
          response.data.image.path,
          response.data.image.originalName,
          response.data.image.mimeType,
        );
      }

      setFormEvents({
        name: response.data.name,
        description: response.data.description,
        isIndoor: response.data.isIndoor ? "true" : "false",
        location: response.data.isIndoor ? "" : response.data.location,
        capacity: response.data.capacity,
        isPaid: response.data.isPaid ? "true" : "false",
        price: response.data.isPaid ? response.data.price : "",
        startDate: response.data.startDate
          ? dayjs(response.data.startDate).format("YYYY-MM-DD")
          : null,
        endDate: response.data.endDate
          ? dayjs(response.data.endDate).format("YYYY-MM-DD")
          : null,
        startTime: response.data.startDate
          ? dayjs(response.data.startDate).format("HH:mm")
          : undefined,
        endTime: response.data.endDate
          ? dayjs(response.data.endDate).format("HH:mm")
          : undefined,
        image: basicImage,
        urlForm: response.data.urlForm ?? "",
        isPublish: response.data.isPublish ? "1" : "0",
        bapelId: String(response.data.bapel.id),
        roomId: response.data.isIndoor ? String(response.data.room.id) : null,
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
      handleGetDetail(codeEvent);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
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

      const response = await eventService.update(codeEvent, payload);

      if (response && response.status === 200) {
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
            isEditing.onFalse();
            isLoading.onFalse();
            setData(null);
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
      title={`${isEditing.value ? "Edit" : "Detail"} Data Events`}
      withEditButton={withEditButton}
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setData(null);
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
      {isEditing.value ? (
        <Form
          isDisable={!isEditing.value || isLoading.value}
          formEvents={formEvents}
          setFormEvents={setFormEvents}
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
      ) : (
        <Detail data={data} />
      )}
    </ModalComponent>
  );
};

export default ModalDetail;
