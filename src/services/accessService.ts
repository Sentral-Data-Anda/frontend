import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class accessService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/accessright" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (id: number) => {
    const response = await instanceAxios.get(`/accessright/${id}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/accessright`, data);

    return response.data;
  };

  static update = async (id: number, data: any) => {
    const response = await instanceAxios.put(`/accessright/${id}`, data);

    return response.data;
  };

  static delete = async (id: number) => {
    const response = await instanceAxios.delete(`/accessright/${id}`);

    return response.data;
  };
}
