import axios, { AxiosResponse } from "axios";
import Cookies from "js-cookie";
import { customNotification } from "./notification";

const baseURL = process.env.NEXT_PUBLIC_API_URL;
const nodeENV = process.env.NODE_ENV;

const fetchData = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    validateStatus: (status) => status >= 200 && status < 300,
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;

      const status = error?.response?.status;

      if (nodeENV === "production") {
        if (
          error.code === "ECONNABORTED" ||
          error.message === "Network Error"
        ) {
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.href = "/bad-gateway";
            }, 500);
          }
          return Promise.reject(error.response ? error.response : error);
        }

        if (status === 502 || status === 503 || status === 504) {
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.href = "/bad-gateway";
            }, 500);
          }
          return Promise.reject(error.response ? error.response : error);
        }
      }

      if (status === 401) {
        originalRequest._retry = true;

        try {
          await axios.get(`${baseURL}/auth/refresh-token`, {
            withCredentials: true,
          });

          console.log("MINTA REFRESH TOKEN");
          return instance(originalRequest);
        } catch (refreshError: any) {
          customNotification({
            type: "Warning",
            text: "Session telah berakhir. Silahkan Login kembali!",
          }).then(() => {
            setTimeout(() => {
              if (typeof window !== "undefined") {
                Cookies.remove("detail-user-store");
                Cookies.remove("accessToken");
                Cookies.remove("refreshToken");
                Cookies.remove("codeUser");
                window.location.reload();
              }
            }, 500);
          });

          if (
            refreshError.response.data.error &&
            typeof refreshError.response.data.error === "string"
          ) {
            return Promise.reject(refreshError.response.data.error);
          } else {
            return Promise.reject(refreshError);
          }
        }
      }

      if (error.response && error.status < 500 && error.status !== 401) {
        return Promise.reject(error.response.data.error);
      }
      return Promise.reject(error.response ? error.response : error);
    },
  );

  return instance;
};

export const instanceAxios = fetchData(baseURL ?? "");
