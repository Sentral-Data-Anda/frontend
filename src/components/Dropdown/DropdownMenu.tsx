import { FloatingPosition, Menu } from "@mantine/core";
import React, { ReactElement } from "react";

interface ItemMenu {
  label: string;
  menu: {
    name: string;
    color?: string;
    icon: ReactElement;
    onClick: () => void;
  }[];
}

interface PropTypes {
  button: ReactElement;
  itemMenu?: ItemMenu[];
  position?: FloatingPosition | undefined;
  width?: number;
}

export const DropdownMenuComponent = (props: PropTypes) => {
  const { button, itemMenu, position, width } = props;

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
        {itemMenu && itemMenu.length > 0
          ? itemMenu.map((value, index) => (
              <React.Fragment key={index}>
                {value.label !== "" ? (
                  <Menu.Label>{value.label}</Menu.Label>
                ) : null}
                {value.menu && value.menu.length > 0
                  ? value.menu.map((valueChild, indexChild) => (
                      <Menu.Item
                        key={indexChild}
                        leftSection={valueChild.icon}
                        color={valueChild.color}
                        onClick={valueChild.onClick}>
                        {valueChild.name}
                      </Menu.Item>
                    ))
                  : null}
              </React.Fragment>
            ))
          : null}
      </Menu.Dropdown>
    </Menu>
  );
};
