"use client";

import { Button, Flex, LoadingOverlay, Text } from "@mantine/core";
import Cookies from "js-cookie";
import { useBoolean } from "@/hooks";
// import { IconBrandWhatsapp, IconMail } from "@tabler/icons-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { customNotification } from "@/utils/notification";
import { CountdownTimer, OTPInputComponent } from "@/components";
import { authService } from "@/services";

const FormOTP = ({ codeUser }: { codeUser: string }) => {
  const isSendOTP = Cookies.get("isSendOTP");
  const otpExpires = Cookies.get("OTPExpired");

  const isLoadingVerify = useBoolean();

  const isLoadingSend = useBoolean();

  const [sendOTP, setSendOTP] = useState<string | undefined>(isSendOTP);

  const handleVerifyUpdate = async (value: string) => {
    isLoadingVerify.onTrue();

    try {
      const response = await authService.verifyUpdate(codeUser, {
        otp: parseInt(value),
      });

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            setTimeout(() => {
              notifications.clean();
            }, 300);

            setTimeout(() => {
              Cookies.remove("OTPExpired");
              Cookies.remove("isSendOTP");
              Cookies.remove("detail-user-store");
              window.location.href = "/login";
            }, 500);
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });

      isLoadingVerify.onFalse();
    }
  };

  // const handleSendOTPWhatsapp = async () => {
  //   isLoadingSend.onTrue();

  //   try {
  //     const response = await authService.sendOTPWhatsapp(codeUser);

  //     if (response && response.status === 200) {
  //       customNotification({ type: "Success", text: response.message }).then(() => {
  //         setSendOTP("1");

  //         Cookies.set("OTPExpired", response.otpExpires, {
  //           expires: new Date(response.otpExpires),
  //         });
  //         Cookies.set("isSendOTP", "1", {
  //           expires: new Date(response.otpExpires),
  //         });
  //       });
  //     }
  //   } catch (error: any) {
  //     customNotification({
  //       type: typeof error === "string" ? "Warning" : "Error",
  //       text: error || "Something went wrong",
  //     });
  //   } finally {
  //     isLoadingSend.onFalse();
  //   }
  // };

  // const handleSendOTPEmail = async () => {
  //   isLoadingSend.onTrue();

  //   try {
  //     const response = await authService.sendOTPEmail(codeUser);

  //     if (response && response.status === 200) {
  //       customNotification({ type: "Success", text: response.message });
  //       setSendOTP("1");

  //       Cookies.set("OTPExpired", response.otpExpires, {
  //         expires: new Date(response.otpExpires),
  //       });
  //       Cookies.set("isSendOTP", "1", {
  //         expires: new Date(response.otpExpires),
  //       });
  //     }
  //   } catch (error: any) {
  //     customNotification({
  //       type: typeof error === "string" ? "Warning" : "Error",
  //       text: error || "Something went wrong",
  //     });
  //   } finally {
  //     isLoadingSend.onFalse();
  //   }
  // };

  const handleSendOTPManual = async () => {
    isLoadingSend.onTrue();

    try {
      const response = await authService.sendOTPManual(codeUser);

      if (response && response.status === 200) {
        setTimeout(() => {
          setSendOTP("1");

          Cookies.set("OTPExpired", response.otpExpires, {
            expires: new Date(response.otpExpires),
          });
          Cookies.set("isSendOTP", "1", {
            expires: new Date(response.otpExpires),
          });

          notifications.show({
            color: "blue",
            title: "Notifikasi",
            message: response.message,
            loading: false,
            autoClose: false,
            withCloseButton: false,
            position: "top-center",
          });
        }, 500);
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
    } finally {
      isLoadingSend.onFalse();
    }
  };

  const handleResend = () => {
    setSendOTP(undefined);
    notifications.clean();
  };

  return (
    <Flex
      w={{ base: "21rem", sm: "30rem" }}
      direction={"column"}
      rowGap={20}
      px={10}
      py={60}
      align={"center"}
      style={{
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255, 0.7)",
      }}>
      <Text size="xl" fw={600} c="black" ta={"center"}>
        Masukan Kode OTP
      </Text>
      <OTPInputComponent
        onComplete={(value) => handleVerifyUpdate(value)}
        disabled={isLoadingVerify.value}
      />
      {sendOTP === "1" ? (
        <CountdownTimer
          timestamp={otpExpires ?? ""}
          loading={isLoadingSend.value}
          onResend={handleResend}
        />
      ) : isLoadingSend.value ? (
        <LoadingOverlay
          visible={isLoadingSend.value}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
        />
      ) : (
        <Button variant="default" onClick={handleSendOTPManual}>
          Request Kode OTP
        </Button>
        // <Flex direction={"column"} gap={10}>
        //   <Button
        //     leftSection={<IconBrandWhatsapp size={14} />}
        //     variant="default"
        //     onClick={handleSendOTPWhatsapp}>
        //     Kirim Kode via WhatsApp
        //   </Button>

        //   <Button
        //     leftSection={<IconMail size={14} />}
        //     variant="default"
        //     onClick={handleSendOTPEmail}>
        //     Kirim Kode via Email
        //   </Button>
        // </Flex>
      )}
    </Flex>
  );
};

export default FormOTP;
