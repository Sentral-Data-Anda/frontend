import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class roleService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/role" + generateSearchParams(params),
    );
    return response.data;
  };

  static getOne = async (id: number) => {
    const response = await instanceAxios.get(`/role/${id}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/role`, data);

    return response.data;
  };

  static update = async (id: number, data: any) => {
    const response = await instanceAxios.put(`/role/${id}`, data);

    return response.data;
  };

  static delete = async (id: number) => {
    const response = await instanceAxios.delete(`/role/${id}`);

    return response.data;
  };
}
