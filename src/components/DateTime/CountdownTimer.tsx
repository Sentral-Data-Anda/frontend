"use client";

import { Button, Text, useMantineTheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { IconReload } from "@tabler/icons-react";
import Cookies from "js-cookie";
import { notifications } from "@mantine/notifications";

interface CountdownTimerProps {
  timestamp: string;
  onResend: () => void;
  loading: boolean;
}

export const CountdownTimer = ({
  timestamp,
  onResend,
  loading,
}: CountdownTimerProps) => {
  const theme = useMantineTheme();

  const calculateTimeLeft = () => {
    const target = new Date(timestamp).getTime();
    const now = Date.now();
    const diff = Math.floor((target - now) / 1000);
    return diff > 0 ? diff : 0;
  };

  const [timeLeft, setTimeLeft] = useState<number>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      Cookies.remove("OTPExpired");
      Cookies.remove("isSendOTP");
      notifications.clean();
    }
  }, [timeLeft]);

  const handleResend = async () => {
    await onResend();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <>
      {timeLeft > 0 ? (
        <Text size="lg" lts={5}>
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </Text>
      ) : (
        <Button
          loading={loading}
          bg={theme.colors.default[9]}
          c={"white"}
          leftSection={<IconReload size={18} stroke={1.5} />}
          onClick={handleResend}>
          Kirim Ulang Kode OTP
        </Button>
      )}
    </>
  );
};
