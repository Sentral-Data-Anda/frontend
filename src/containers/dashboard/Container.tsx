"use client";

import { Container as ContainerMantine } from "@mantine/core";

import "swiper/css";
import "swiper/css/pagination";

import ManageMenu from "./ManageMenu";
import ManageComingSoon from "./ManageComingSoon";

const Container = () => {
  return (
    <ContainerMantine
      fluid
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 15,
        // paddingInline: 0
        maxWidth: 550,
      }}>
      <ManageMenu />

      <ManageComingSoon />
    </ContainerMantine>
  );
};

export default Container;
