import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class rolePelayanService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/role-pelayan" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (id: number) => {
    const response = await instanceAxios.get(`/role-pelayan/${id}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/role-pelayan`, data);

    return response.data;
  };

  static update = async (id: number, data: any) => {
    const response = await instanceAxios.put(`/role-pelayan/${id}`, data);

    return response.data;
  };

  static delete = async (id: number) => {
    const response = await instanceAxios.delete(`/role-pelayan/${id}`);

    return response.data;
  };
}
