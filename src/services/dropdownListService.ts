import { TypeParams } from "@/types";
import { instanceAxios } from "@/utils/instanceAxios";
import { generateSearchParams } from "@/utils/params";

export class dropdownListService {
  static getBapel = async () => {
    const response = await instanceAxios.get("/ddl/bapel");
    return response.data;
  };

  static getRoleUser = async () => {
    const response = await instanceAxios.get("/ddl/role-user");
    return response.data;
  };

  static getRoom = async () => {
    const response = await instanceAxios.get("/ddl/room");
    return response.data;
  };

  static getTypeItem = async () => {
    const response = await instanceAxios.get("/ddl/type-item");
    return response.data;
  };

  static getRolePelayan = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/ddl/role-pelayan" + generateSearchParams(params),
    );
    return response.data;
  };

  static getPelayan = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/ddl/pelayan" + generateSearchParams(params),
    );
    return response.data;
  };

  static getSkillMusic = async () => {
    const response = await instanceAxios.get("/ddl/skill-music");
    return response.data;
  };

  static getJemaat = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/ddl/jemaat" + generateSearchParams(params),
    );
    return response.data;
  };

  static getTemplateJadwal = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/ddl/template-jadwal" + generateSearchParams(params),
    );
    return response.data;
  };

  static getProfession = async () => {
    const response = await instanceAxios.get("/ddl/profession");
    return response.data;
  };

  static getEtnicGroup = async () => {
    const response = await instanceAxios.get("/ddl/etnic-group");
    return response.data;
  };

  static getProvinces = async () => {
    const response = await instanceAxios.get("/ddl/provinces");
    return response.data;
  };

  static getRegencies = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/ddl/regencies" + generateSearchParams(params),
    );
    return response.data;
  };

  static getDistricts = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/ddl/districts" + generateSearchParams(params),
    );
    return response.data;
  };

  static getVillages = async (params: TypeParams) => {
    const response = await instanceAxios.get(
      "/ddl/villages" + generateSearchParams(params),
    );
    return response.data;
  };

  static getZoneChurch = async () => {
    const response = await instanceAxios.get("/ddl/zone-church");
    return response.data;
  };
}
