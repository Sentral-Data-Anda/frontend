import { AuthCard } from "@/components/common/brand";

import { AuthHandoffDone } from "./auth-handoff";
import { FirstLoginForm } from "./first-login-form";

interface PropTypes {
  code: string;
}

export const FirstLoginScreen = (props: PropTypes) => {
  const { code } = props;

  return (
    <AuthCard>
      <FirstLoginForm code={code} />
      <AuthHandoffDone />
    </AuthCard>
  );
};
