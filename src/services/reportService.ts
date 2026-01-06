import { instanceAxios } from "@/utils/instanceAxios";

export class reportService {
  static jemaatByTypeAndGender = async () => {
    const response = await instanceAxios.get("/report/jemaat/type-gender");

    return response.data;
  };

  static jemaatBirthByMonth = async (month: string) => {
    const response = await instanceAxios.get(`/report/jemaat/birth/${month}`);

    return response.data;
  };
}
