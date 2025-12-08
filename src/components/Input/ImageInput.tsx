"use client";

import {
  ActionIcon,
  FileInput,
  Flex,
  Image,
  LoadingOverlay,
  Slider,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconLibraryPhoto, IconTrash } from "@tabler/icons-react";
import { useBoolean } from "@/hooks";

import Cropper, { Area, Point } from "react-easy-crop";
import { useState } from "react";
import getCroppedImg, { base64ToBlob } from "@/utils/cropImage";
import { customNotification } from "@/utils/notification";
import { ButtonComponent } from "../Button/ButtonComponent";
import { ModalComponent } from "../Modal";
import { convertImageService } from "@/services/convertImage";
import { extractErrorMessage } from "@/utils";

interface PropTypes {
  name: string;
  value: File | undefined | null;
  require?: boolean;
  disabled?: boolean;
  onChange?: (_value: File | undefined | null) => void;
  readOnly?: boolean;
}

export const ImageInputComponent = (props: PropTypes) => {
  const { name, value, onChange, require = false, disabled = false } = props;

  const icon = <IconLibraryPhoto size={18} stroke={1.5} />;

  const isOpenModalCrop = useBoolean();

  const isOpenModalResult = useBoolean();

  const isDetailImage = useBoolean();

  const isLoadingConvert = useBoolean();

  const [file, setFile] = useState<File | undefined>(undefined);

  const [image, setImage] = useState<string>("");

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });

  const [zoom, setZoom] = useState<number>(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const onSelectFile = (file: File) => {
    if (!file) return;

    const blob = new Blob([file], { type: "image/webp" });
    const objectUrl = URL.createObjectURL(blob);

    setImage(objectUrl);
  };

  async function handleConvertImage(file: File) {
    isLoadingConvert.onTrue();
    try {
      const payload = new FormData();

      payload.append("mainImage", file);

      const response = await convertImageService.create(payload);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            const blob = base64ToBlob(response.data, "image/webp");
            const objectUrl = URL.createObjectURL(blob);
            setImage(objectUrl);
            isOpenModalCrop.onTrue();
            isLoadingConvert.onFalse();
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      }).then(() => {
        isLoadingConvert.onFalse();
      });
    }
  }

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, 0);
      setCroppedImage(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  const blobToFile = (theBlob: Blob, fileName: string): File => {
    return new File([theBlob], fileName, {
      type: theBlob.type,
    });
  };

  const handleUpload = async () => {
    if (croppedImage) {
      const croppedBlob = await fetch(croppedImage).then((res) => res.blob());

      const croppedFile = blobToFile(
        croppedBlob,
        file?.name ?? "cropped-image",
      );

      onChange?.(croppedFile);
    }
  };

  function detailImage(file: File): string {
    const url = URL.createObjectURL(file);
    return url;
  }

  const resetState = () => {
    setImage("");
    setFile(undefined);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels({ x: 0, y: 0, width: 0, height: 0 });
    setCroppedImage(null);
  };

  return (
    <>
      <LoadingOverlay
        visible={isLoadingConvert.value}
        loaderProps={{ children: "Processing Image..." }}
      />

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
                height: 32,
                minHeight: 32,
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
              isDetailImage.onTrue();
              isOpenModalResult.onTrue();
              setFile(value);
              setCroppedImage(detailImage(value));
            }}
          />

          <ActionIcon
            size={32}
            variant="light"
            color="red"
            aria-label="Erase"
            disabled={disabled}
            onClick={() => onChange?.(null)}>
            <IconTrash style={{ width: "60%", height: "60%" }} stroke={1.5} />
          </ActionIcon>
        </Flex>
      ) : (
        <FileInput
          size="xs"
          radius="md"
          leftSection={icon}
          w={"100%"}
          label={name}
          placeholder={`Upload`}
          withAsterisk={require}
          disabled={disabled}
          readOnly={disabled}
          value={value}
          onChange={(value) => {
            if (value) {
              if (
                "image/png,image/jpeg,image/jpg,image/heic"
                  .split(",")
                  .includes(value.type)
              ) {
                setFile(value);

                if (value.type === "image/heic") {
                  handleConvertImage(value);
                } else {
                  onSelectFile(value);
                  isOpenModalCrop.onTrue();
                }
              } else {
                onChange?.(null);
                customNotification({
                  type: "Warning",
                  text: "Type File Not Supported",
                });
              }
            }
          }}
          accept={"image/png,image/jpeg,image/jpg,image/heic"}
          styles={{
            input: {
              height: 32,
              minHeight: 32,
            },
          }}
        />
      )}

      <ModalComponent
        opened={isOpenModalCrop.value}
        loading={false}
        title={"Crop Image"}
        close={() => {
          isOpenModalCrop.onFalse();
          onChange?.(null);
          resetState();
        }}>
        <>
          <Cropper
            style={{
              containerStyle: {
                position: "relative",
                minHeight: "75vh",
                width: "100%",
              },
            }}
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />

          <Flex gap={10} direction={"column"} bg={"white"} my={15}>
            <Slider
              value={zoom}
              min={1}
              max={5}
              step={0.1}
              onChange={(value) => setZoom(value)}
            />

            <ButtonComponent
              variant="filled"
              name="Crop"
              onClick={() => {
                showCroppedImage();
                isOpenModalResult.onTrue();
              }}
            />
          </Flex>
        </>
      </ModalComponent>

      <ModalComponent
        opened={isOpenModalResult.value}
        loading={false}
        title={file?.name ?? ""}
        close={() => {
          if (isDetailImage.value) {
            isOpenModalResult.onFalse();
            isDetailImage.onFalse();
            setFile(undefined);
            setCroppedImage(null);
          } else {
            isOpenModalResult.onFalse();
            isOpenModalCrop.onTrue();
          }
        }}>
        <Stack>
          <Image fit="contain" src={croppedImage} alt="Image Result Crop" />
          {!isDetailImage.value ? (
            <ButtonComponent
              variant="filled"
              name="Upload"
              onClick={() => {
                isOpenModalCrop.onFalse();
                isOpenModalResult.onFalse();
                handleUpload();
                resetState();
              }}
            />
          ) : null}
        </Stack>
      </ModalComponent>
    </>
  );
};
