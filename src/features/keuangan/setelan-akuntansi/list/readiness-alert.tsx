import { FormAlert } from "@/components/common/form";

import { readinessAlertOf } from "../model";
import type { AccountingSetting } from "../types";

interface PropTypes {
  settings: AccountingSetting[];
}

export const ReadinessAlert = (props: PropTypes) => {
  const { settings } = props;

  const alert = readinessAlertOf(settings);

  if (!alert) return null;

  return (
    <div className="px-gutter pb-4">
      <FormAlert tone="warning" title={alert.title} message={alert.message} />
    </div>
  );
};
