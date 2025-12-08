import { instanceAxios } from "@/utils/instanceAxios";

export class convertImageService {
  static create = async (data: any) => {
    const response = await instanceAxios.post(`/convert-image`, data);

    console.log("RESPONSE", response);

    return response.data;
  };
}
