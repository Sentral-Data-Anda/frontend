import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class loanRoomService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/loan-room" + generateSearchParams(params),
    );

    return response.data;
  };

  static getBooking = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/loan-room/booking" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/loan-room/${code}`);

    return response.data;
  };

  static create = async (data: any) => {
    const response = await instanceAxios.post(`/loan-room`, data);

    return response.data;
  };

  static update = async (code: string, data: any) => {
    const response = await instanceAxios.put(`/loan-room/${code}`, data);

    return response.data;
  };

  static delete = async (code: string) => {
    const response = await instanceAxios.delete(`/loan-room/${code}`);

    return response.data;
  };
}
