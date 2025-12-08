import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class userService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/user" + generateSearchParams(params),
    );
    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/user/${code}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/user`, data);

    return response.data;
  };

  static update = async (code: string, data: any) => {
    const response = await instanceAxios.put(`/user/${code}`, data);

    return response.data;
  };

  static delete = async (code: string) => {
    const response = await instanceAxios.delete(`/user/${code}`);

    return response.data;
  };

  static reset = async (code: string, data: any) => {
    const response = await instanceAxios.put(`/user/reset/${code}`, data);

    return response.data;
  };
}
