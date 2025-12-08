import { FloatingPosition, Menu } from "@mantine/core";
import React, { ReactNode } from "react";

interface PropTypes {
  button: ReactNode;
  position?: FloatingPosition;
  width?: number;
}

export const MenuNotification = ({ button, position, width }: PropTypes) => {
  return (
    <Menu
      shadow="sm"
      width={width}
      position={position}
      withOverlay={false}
      styles={{
        itemLabel: {
          fontSize: 12,
        },
        itemSection: {
          padding: 0,
        },
        item: {
          paddingBlock: 7,
        },
      }}>
      <Menu.Target>{button}</Menu.Target>

      <Menu.Dropdown>
        <Menu.Item>Dashboard</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
