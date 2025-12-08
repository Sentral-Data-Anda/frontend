import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class roleJemaatService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/role-jemaat" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (id: number) => {
    const response = await instanceAxios.get(`/role-jemaat/${id}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/role-jemaat`, data);

    return response.data;
  };

  static update = async (id: number, data: any) => {
    const response = await instanceAxios.put(`/role-jemaat/${id}`, data);

    return response.data;
  };

  static delete = async (id: number) => {
    const response = await instanceAxios.delete(`/role-jemaat/${id}`);

    return response.data;
  };
}
