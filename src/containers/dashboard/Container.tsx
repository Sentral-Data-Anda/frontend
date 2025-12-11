"use client";

import { Stack } from "@mantine/core";
import dynamic from "next/dynamic";

const ManageMenu = dynamic(() => import("./ManageMenu"), {
  ssr: false,
});

const ManageComingSoon = dynamic(() => import("./ManageComingSoon"), {
  ssr: false,
});

const Container = () => {
  return (
    <Stack
      w={"100%"}
      h={"100%"}
      gap={15}
      maw={550}
      pt={20}
      px={20}
      pb={5}
      justify="start"
      style={{
        justifySelf: "center",
      }}>
      <ManageMenu />
      <ManageComingSoon />
    </Stack>
  );
};

export default Container;
