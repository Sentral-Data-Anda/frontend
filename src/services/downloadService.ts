import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

class downloadService {
  static image = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      `/image` + generateSearchParams(params),
    );

    return response.data;
  };
}

export default downloadService;
