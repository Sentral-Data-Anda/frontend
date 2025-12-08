import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class galleryService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/gallery" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/gallery/${code}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/gallery`, data);

    return response.data;
  };

  static update = async (code: string, data: any) => {
    const response = await instanceAxios.put(`/gallery/${code}`, data);

    return response.data;
  };

  static delete = async (code: string) => {
    const response = await instanceAxios.delete(`/gallery/${code}`);

    return response.data;
  };
}
