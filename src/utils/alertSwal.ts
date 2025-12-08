import { TypeConfirmSwal } from "@/types/utils";
import Swal from "sweetalert2";

export const confirmSwal = async (params: TypeConfirmSwal) => {
  const result = await Swal.fire({
    icon: "warning",
    title: params.title,
    showCancelButton: true,
    confirmButtonText: params.labelConfirm,
    allowOutsideClick: false,
    didOpen: () => {
      const cancelButton = Swal.getCancelButton();
      const confirmButton = Swal.getConfirmButton();
      const iconElement = Swal.getIcon();
      const iconContentElement = Swal.getIconContent();
      const titleElement = Swal.getTitle();
      const actionButton = Swal.getActions();

      if (actionButton) {
        actionButton.style.flexDirection = "row-reverse";
        actionButton.style.margin = "2px";
      }

      if (confirmButton) {
        confirmButton.style.backgroundColor = "green";
        confirmButton.style.color = "white";
        confirmButton.style.border = "none";
        confirmButton.style.borderRadius = "12px";
        confirmButton.style.width = "100px";
        confirmButton.style.fontSize = "12px";
      }

      if (cancelButton) {
        cancelButton.style.backgroundColor = "red";
        cancelButton.style.color = "white";
        cancelButton.style.border = "none";
        cancelButton.style.borderRadius = "12px";
        cancelButton.style.width = "100px";
        cancelButton.style.fontSize = "12px";
      }

      if (iconElement) {
        iconElement.style.width = "50px";
        iconElement.style.height = "50px";
        iconElement.style.strokeWidth = "2";
      }

      if (iconContentElement) {
        iconContentElement.style.fontSize = "40px";
      }

      if (titleElement) {
        titleElement.style.padding = "10px";
        titleElement.style.fontSize = "18px";
        titleElement.style.fontWeight = "400";
      }
    },
  });
  if (result.isConfirmed) {
    params.onConfirm();
  }
};
