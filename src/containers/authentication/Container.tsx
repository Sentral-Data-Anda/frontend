"use client";

import { jwtDecode, JwtPayload } from "jwt-decode";

import { Box, useMantineTheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormFirstUpdate from "./firstUpdate/FormUpdate";
import Cookies from "js-cookie";
import { customNotification } from "@/utils/notification";
import { useZustandStore } from "@/hooks";
import { authService } from "@/services";
import { extractErrorMessage } from "@/utils";
import Image from "next/image";
import gitLogo from "../../assets/gif/logo.gif";

interface ExtendedJwtPayload extends JwtPayload {
  type?: string;
  data?: {
    id: number;
    code: string;
    roleUser: {
      name: string;
      isAdmin: boolean;
      access: {
        id: number;
        name: string;
      }[];
    };
    lastLogin: string;
  };
}

interface ContainerAuthProps {
  token: string | undefined;
}

const Container = (props: ContainerAuthProps) => {
  const { token } = props;

  const theme = useMantineTheme();

  // const otpExpires = Cookies.get("OTPExpired");
  const [codeUser, setCodeUser] = useState<string | null>(null);

  const router = useRouter();

  const [decodeToken, setDecodeToken] = useState<
    ExtendedJwtPayload | undefined
  >(undefined);

  const [firstLogin, setFirstLogin] = useState<boolean>(false);

  // const [verifyFirstLogin, setVerifyFirstLogin] = useState<boolean>(false);

  const [redirect, setRedirect] = useState<string | null>(null);

  const { detailUser, setDetailUser } = useZustandStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect");
    if (redirectParam) {
      setRedirect(decodeURIComponent(redirectParam));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("code-user");
      setCodeUser(stored);
    }
  }, []);

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      setDecodeToken(decoded);
    } else {
      router.replace("/auth/login");
    }
  }, [token]);

  async function handleGetDetailUser(code: string) {
    try {
      const response = await authService.getOne(code);

      if (response.status === 200) {
        setDetailUser(response.data);

        if (response.data.status === 0) {
          Cookies.set("isFirstLogin", "true");
          setFirstLogin(true);
        }

        if (response.data.status === 1) {
          if (codeUser === null) {
            localStorage.setItem("code-user", response.data.code);
          }

          const pathRedirect: string = redirect ?? "/dashboard";
          setTimeout(() => {
            router.replace(pathRedirect);
          }, 500);
        }

        if (response.data.status === -1) {
          setTimeout(() => {
            router.push("/login");
          }, 500);
        }
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
    }
  }

  useEffect(() => {
    if (detailUser === undefined && decodeToken && decodeToken.data) {
      handleGetDetailUser(decodeToken.data.code);
    }
  }, [detailUser, decodeToken]);

  useEffect(() => {
    if (token === undefined && codeUser) {
      handleGetDetailUser(codeUser);
    }
  }, [token, codeUser]);

  return (
    <Box
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: firstLogin ? "#F4F6FF" : theme.colors.default[9],
      }}>
      {firstLogin ? (
        // verifyFirstLogin ? (
        //   <FormOTP codeUser={decodeToken?.data?.code ?? ""} />
        // ) : (
        //   <FormFirstUpdate
        //     codeUser={decodeToken?.data?.code ?? ""}
        //     // onVerify={() => setVerifyFirstLogin(true)}
        //   />
        // )
        <FormFirstUpdate
          codeUser={decodeToken?.data?.code ?? ""}
          // onVerify={() => setVerifyFirstLogin(true)}
        />
      ) : (
        // <div className="loader"></div>
        <Image
          fetchPriority="high"
          src={gitLogo}
          alt="Logo-pp"
          width={200}
          height={200}
        />
      )}
    </Box>
  );
};

export default Container;
