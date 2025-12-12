"use client";

import { jwtDecode, JwtPayload } from "jwt-decode";

import { Box } from "@mantine/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormOTP from "./otp/FormOTP";
import FormFirstUpdate from "./firstUpdate/FormUpdate";
import Cookies from "js-cookie";
import { customNotification } from "@/utils/notification";
import { useZustandStore } from "@/hooks";
import { authService } from "@/services";
import { extractErrorMessage } from "@/utils";

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
  codeUser: string | undefined;
}

const Container = (props: ContainerAuthProps) => {
  const { token, codeUser } = props;

  const otpExpires = Cookies.get("OTPExpired");

  const router = useRouter();

  const [decodeToken, setDecodeToken] = useState<
    ExtendedJwtPayload | undefined
  >(undefined);

  const [firstLogin, setFirstLogin] = useState<boolean>(false);

  const [verifyFirstLogin, setVerifyFirstLogin] = useState<boolean>(false);

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

  useEffect(() => {
    if (detailUser) {
      if (detailUser.status === 0) {
        if (otpExpires) {
          setVerifyFirstLogin(true);
        }

        Cookies.set("isFirstLogin", "true");
        setFirstLogin(true);
      } else {
        if (codeUser === undefined) {
          Cookies.set("codeUser", detailUser.code);
        }

        const pathRedirect: string = redirect ?? "/dashboard";
        setTimeout(() => {
          router.replace(pathRedirect);
        }, 1000);
      }
    }
  }, [detailUser, redirect]);

  return (
    <Box
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: firstLogin ? "#F4F6FF" : "#cacbd5",
      }}>
      {firstLogin ? (
        verifyFirstLogin ? (
          <FormOTP codeUser={decodeToken?.data?.code ?? ""} />
        ) : (
          <FormFirstUpdate
            codeUser={decodeToken?.data?.code ?? ""}
            // onVerify={() => setVerifyFirstLogin(true)}
          />
        )
      ) : (
        <div className="loader"></div>
      )}
    </Box>
  );
};

export default Container;
