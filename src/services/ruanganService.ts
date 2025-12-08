import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class ruanganService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/room" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/room/${code}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/room`, data);

    return response.data;
  };

  static update = async (code: string, data: any) => {
    const response = await instanceAxios.put(`/room/${code}`, data);

    return response.data;
  };

  static delete = async (code: string) => {
    const response = await instanceAxios.delete(`/room/${code}`);

    return response.data;
  };
}
