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

  static jemaatByBloodType = async () => {
    const response = await instanceAxios.get("/report/jemaat/blood-type");

    return response.data;
  };

  static jemaatByAge = async () => {
    const response = await instanceAxios.get("/report/jemaat/age");

    return response.data;
  };

  static jemaatByEtnic = async () => {
    const response = await instanceAxios.get("/report/jemaat/etnic");

    return response.data;
  };

  static jemaatByProfession = async () => {
    const response = await instanceAxios.get("/report/jemaat/profession");

    return response.data;
  };
}
