import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class templatePelayanService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/template-pelayan" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/template-pelayan/${code}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/template-pelayan`, data);

    return response.data;
  };

  static update = async (code: string, data: any) => {
    const response = await instanceAxios.put(`/template-pelayan/${code}`, data);

    return response.data;
  };

  static delete = async (code: string) => {
    const response = await instanceAxios.delete(`/template-pelayan/${code}`);

    return response.data;
  };
}
