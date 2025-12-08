"use client";

import { customNotification } from "@/utils/notification";
import { ActionIcon, FileInput, Flex, TextInput } from "@mantine/core";
import { IconFile, IconTrash } from "@tabler/icons-react";
import { useBoolean } from "@/hooks";
import { useState } from "react";
import { ModalViewPdf } from "../Modal";

interface PropTypes {
  name: string;
  value: File | undefined | null;
  require?: boolean;
  disabled?: boolean;
  onChange?: (_value: File | undefined | null) => void;
  readOnly?: boolean;
}

export const FileInputComponent = (props: PropTypes) => {
  const { name, value, onChange, require = false, disabled = false } = props;

  const icon = <IconFile size={18} stroke={1.5} />;

  const isOpenViewPdf = useBoolean();

  const [nameFile, setNameFile] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);

  function handleViewDocument(file: File) {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    isOpenViewPdf.onTrue();
    setNameFile(file.name);
  }

  return (
    <>
      {value !== null && value !== undefined ? (
        <Flex align={"end"} gap={10} w={"100%"}>
          <TextInput
            leftSection={icon}
            styles={{
              input: {
                color: "blue",
                textDecoration: "underline",
                cursor: "pointer",
                border: "1px solid #ced4da",
                minHeight: 32,
                height: 32,
              },
            }}
            label={name}
            size="xs"
            radius="md"
            w={"100%"}
            withAsterisk={require}
            readOnly={true}
            value={value.name}
            onClick={() => {
              handleViewDocument(value);
            }}
          />

          <ActionIcon
            variant="light"
            color="red"
            aria-label="Erase"
            mb={2}
            onClick={() => onChange?.(null)}>
            <IconTrash style={{ width: "70%", height: "70%" }} stroke={1.5} />
          </ActionIcon>
        </Flex>
      ) : (
        <FileInput
          leftSection={icon}
          size="xs"
          radius="md"
          w={"100%"}
          label={name}
          placeholder={`Upload`}
          withAsterisk={require}
          disabled={disabled}
          readOnly={disabled}
          value={value}
          onChange={(value) => {
            if (value) {
              if (value.type.includes("application/pdf")) {
                onChange?.(value);
              } else {
                onChange?.(null);
                customNotification({
                  type: "Warning",
                  text: "Type File Not Supported",
                });
              }
            }
          }}
          accept={"application/pdf"}
          styles={{
            input: {
              minHeight: 32,
              height: 32,
            },
          }}
        />
      )}

      <ModalViewPdf
        isOpenModal={isOpenViewPdf.value}
        titleModal={nameFile}
        pdfUrl={fileUrl}
        onClose={() => {
          isOpenViewPdf.onFalse();
          setFileUrl(undefined);
          setNameFile("");
        }}
      />
    </>
  );
};
