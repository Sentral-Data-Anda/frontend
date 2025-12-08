import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class tipeBarangService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/type-item" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/type-item/${code}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/type-item`, data);

    return response.data;
  };

  static update = async (code: string, data: any) => {
    const response = await instanceAxios.put(`/type-item/${code}`, data);

    return response.data;
  };

  static delete = async (code: string) => {
    const response = await instanceAxios.delete(`/type-item/${code}`);

    return response.data;
  };
}
