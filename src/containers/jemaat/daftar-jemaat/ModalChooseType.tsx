import { useBoolean } from "@/hooks";
import { ButtonComponent, ModalComponent } from "@/components";
import { Flex } from "@mantine/core";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleSelect: (_value: string) => void;
}

const ModalChooseType = (props: PropTypes) => {
  const { isOpenModal, handleSelect } = props;

  const listType = ["ANGGOTA", "SIMPATISAN", "ANAK"];

  return (
    <ModalComponent
      minHeight="fit-content"
      size="xs"
      opened={isOpenModal.value}
      title="Choose Type"
      withCloseButton
      close={isOpenModal.onFalse}>
      <Flex direction={"column"} gap={"xs"}>
        {listType.map((item, index) => {
          return (
            <ButtonComponent
              variant="outline"
              key={index}
              name={item}
              onClick={() => handleSelect(item)}
            />
          );
        })}
      </Flex>
    </ModalComponent>
  );
};

export default ModalChooseType;
