import { FormAlert } from "@/components/common/form";

import { VARIANCE_HINT, VARIANCE_NORMAL, type Variance } from "../model";

interface PropTypes {
  variance: Variance;
}

export const VarianceStrip = (props: PropTypes) => {
  const { variance } = props;

  return (
    <FormAlert
      tone={variance.isLarge ? "warning" : "info"}
      title={variance.text}
      message={variance.isLarge ? VARIANCE_NORMAL : VARIANCE_HINT}
    />
  );
};
