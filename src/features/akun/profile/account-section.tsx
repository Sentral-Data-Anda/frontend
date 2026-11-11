import { useWatch } from "react-hook-form";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { isUsernameChanged } from "../model";

import { type ProfileForm } from "./form-options";

interface PropTypes {
  form: ProfileForm;
  isDisabled: boolean;
}

export const AccountSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const [username, savedUsername] = useWatch({
    control: form.control,
    name: ["username", "savedUsername"],
  });
  const isChanged = isUsernameChanged({ username, savedUsername });

  return (
    <FormSection
      legend="Akun"
      note="Username dipakai untuk masuk. Bawaannya kode induk Anda."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="username"
        label="Username"
        isRequired
        isHintWarning={isChanged}
        hint={
          isChanged
            ? "Sesudah disimpan, masuk dengan username baru. Perangkat lain akan keluar."
            : "4–30 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung."
        }
      >
        {(field) => (
          <Input
            {...field}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
          />
        )}
      </ControlField>
    </FormSection>
  );
};
