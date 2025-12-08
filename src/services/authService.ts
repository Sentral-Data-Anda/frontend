import { instanceAxios } from "@/utils/instanceAxios";

export class authService {
  static login = async (data: any) => {
    const response = await instanceAxios.post("/auth/login", data);

    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/auth/${code}`);

    return response.data;
  };

  static update = async (params: string, data: any) => {
    const response = await instanceAxios.put(`/auth/update/${params}`, data);

    return response.data;
  };

  static verifyUpdate = async (params: string, data: any) => {
    const response = await instanceAxios.put(
      `/auth/verify-otp/${params}`,
      data,
    );

    return response.data;
  };

  static refreshToken = async () => {
    const response = await instanceAxios.get(`/auth/refresh-token`);

    return response.data;
  };

  static sendOTPWhatsapp = async (params: string) => {
    const response = await instanceAxios.get(
      `/auth/sendotpbywhatsapp/${params}`,
    );

    return response.data;
  };

  static sendOTPEmail = async (params: string) => {
    const response = await instanceAxios.get(`/auth/sendotpbyemail/${params}`);

    return response.data;
  };

  static sendOTPManual = async (params: string) => {
    const response = await instanceAxios.get(`/auth/sendotpmanual/${params}`);

    return response.data;
  };

  static logout = async () => {
    const response = await instanceAxios.delete(`/auth/logout`);

    return response.data;
  };
}
