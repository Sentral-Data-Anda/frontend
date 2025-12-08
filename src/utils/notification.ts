import { NotifProps } from "@/types";
import { notifications } from "@mantine/notifications";

export const customNotification = (params: NotifProps): Promise<void> => {
  notifications.show({
    color:
      params.type === "Success"
        ? "green"
        : params.type === "Error"
        ? "red"
        : params.type === "Warning"
        ? "yellow"
        : "blue",
    title: params.type,
    message: params.text,
    loading: false,
    autoClose: 3000,
    withCloseButton: false,
    position: "top-center",
  });

  return new Promise((resolve) => {
    setTimeout(() => resolve(), 3000);
  });
};
