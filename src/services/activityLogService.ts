import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class activityLogService {
  static getAll = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/activity-log" + generateSearchParams(params),
    );

    return response.data;
  };

  static getOne = async (code: string) => {
    const response = await instanceAxios.get(`/activity-log/${code}`);

    return response.data;
  };
}
