import { Lock } from "lucide-react";

import { Input } from "@/components/common/control";
import { FormField } from "@/components/common/form";

interface PropTypes {
  id: string;
  label: string;
  value: string;
  hint?: string;
}

export const LockedField = (props: PropTypes) => {
  const { id, label, value, hint } = props;

  return (
    <FormField htmlFor={id} label={label} hint={hint}>
      <Input
        readOnly
        variant="filled"
        value={value}
        icon={<Lock />}
        className="cursor-default"
      />
    </FormField>
  );
};
