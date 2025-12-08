import { Flex, Image } from "@mantine/core";

interface PropTypes {
  data: string[];
}

const urlImage = process.env.NEXT_PUBLIC_FILE_URL;

const Detail = (props: PropTypes) => {
  const { data } = props;

  if (data.length > 0) {
    return (
      <Flex gap="xs" direction={"column"}>
        {data.map((item, index) => {
          return (
            <Image
              key={index}
              src={`${urlImage}${item}`}
              alt={`Detail Image ${index}`}
              fallbackSrc="https://placehold.co/1280x720?text=Loading"
            />
          );
        })}
      </Flex>
    );
  }
};

export default Detail;
