import { FormAlert } from "@/components/common/form";

import { overEstimateText, type OverEstimate } from "../model";

interface PropTypes {
  over: OverEstimate | null;
  tail?: string;
}

export const OverEstimateAlert = (props: PropTypes) => {
  const { over, tail } = props;

  if (!over) return null;

  return (
    <FormAlert
      tone="warning"
      title="Melebihi perkiraan permintaan."
      message={
        tail ? `${overEstimateText(over)} ${tail}` : overEstimateText(over)
      }
    />
  );
};
