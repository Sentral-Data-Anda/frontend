import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const titleMap: Record<string, string> = {
  administrator: "Administrator",

  user: "User",
  edit: "Detail User",
  "role-user": "Role User",

  bapel: "Badan Pelayanan",

  "access-right": "Hak Akses User",

  "type-item": "Tipe Barang",
  barang: "Barang",
  "daftar-barang": "Daftar Barang",
  "tipe-barang": "Tipe Barang",

  events: "Event",
  gallery: "Galeri",
  "activity-logs": "Activity Logs",

  pelayan: "Pelayan",
  "daftar-pelayan": "Daftar Pelayan",
  "role-pelayan": "Role Pelayan",
  "jadwal-pelayan": "Jadwal Pelayan",
  "template-pelayan": "Template Jadwal",

  jemaat: "Jemaat",
  "daftar-jemaat": "Daftar Jemaat",
  "role-jemaat": "Role Jemaat",

  ruangan: "Ruangan",
  agenda: "Agenda Ruangan",

  report: "Report",
  "report-jemaat": "Report Jemaat",

  "[id]": "Detail",
};

export function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);

  if (!lastSegment) return "";

  const isDynamicId = /^[A-Z]{2}[A-Za-z0-9-]{4,}$/.test(lastSegment);

  if (isDynamicId) {
    return titleMap["[id]"] + segments.at(-2) || "Detail";
  }

  return titleMap[lastSegment];
}

export const formatDateToISO = (data: any) => {
  const [day, month, year] = data.split("/");
  const date = new Date(year, month - 1, day);
  return date;
};

export const urlImageToFile = async (
  url: string,
  originalName: string,
  mimeType: string,
): Promise<File> => {
  const urlImage = process.env.NEXT_PUBLIC_FILE_URL;

  const response = await fetch(`${urlImage}/${url}`);

  const blob = await response.blob();

  return new File([blob], originalName, { type: mimeType });
};

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  const isSameDate = start.isSame(end, "day");
  const isSameMonth = start.isSame(end, "month");
  const isSameYear = start.isSame(end, "year");

  if (isSameDate) {
    return start.format("DD MMMM YYYY");
  }

  if (isSameMonth && isSameYear) {
    return `${start.format("DD")} - ${end.format("DD MMMM YYYY")}`;
  }

  if (isSameYear) {
    return `${start.format("DD MMMM")} - ${end.format("DD MMMM YYYY")}`;
  }

  return `${start.format("DD MMMM YYYY")} - ${end.format("DD MMMM YYYY")}`;
};

export const formatYearRange = (startPeriode: string, endPeriode: string) => {
  const start = dayjs(startPeriode).year();
  const end = dayjs(endPeriode).year();

  if (start === end) {
    return `${start}`;
  } else {
    return `${start} - ${end}`;
  }
};

export function listYears(startYear?: number) {
  startYear = 2025;

  const currentYear = dayjs().year();

  const years = [];

  for (let year = startYear; year <= currentYear; year++) {
    years.push({
      label: String(year),
      value: String(year),
    });
  }

  return years;
}

export function listMonths() {
  const templateData = [
    { label: "All ", value: "" },
    {
      label: "Januari",
      value: "1",
    },
    {
      label: "Februari",
      value: "2",
    },
    {
      label: "Maret",
      value: "3",
    },
    {
      label: "April",
      value: "4",
    },
    {
      label: "Mei",
      value: "5",
    },
    {
      label: "Juni",
      value: "6",
    },
    {
      label: "Juli",
      value: "7",
    },
    {
      label: "Agustus",
      value: "8",
    },
    {
      label: "September",
      value: "9",
    },
    {
      label: "Oktober",
      value: "10",
    },
    {
      label: "November",
      value: "11",
    },
    {
      label: "Desember",
      value: "12",
    },
  ];

  return templateData;
}

export function listDays() {
  const templateData = [
    {
      label: "Minggu",
      value: "0",
    },
    {
      label: "Senin",
      value: "1",
    },
    {
      label: "Selasa",
      value: "2",
    },
    {
      label: "Rabu",
      value: "3",
    },
    {
      label: "Kamis",
      value: "4",
    },
    {
      label: "Jumat",
      value: "5",
    },
    {
      label: "Sabtu",
      value: "6",
    },
  ];

  return templateData;
}

export function listRuleBapel() {
  const templateData: string[] = ["NO_WEEK", "NO_DAY", "NO_DATE", "NO_TIME"];

  return templateData;
}

export function listWeekOfMonth() {
  const templateData: string[] = [
    "Minggu ke 1",
    "Minggu ke 2",
    "Minggu ke 3",
    "Minggu ke 4",
    "Minggu ke 5",
    "Minggu Terakhir",
  ];

  return templateData;
}

export function listPeriodService() {
  const templateData: any[] = [
    {
      label: "Hari",
      value: "day",
    },
    {
      label: "Minggu",
      value: "week",
    },
    {
      label: "Bulan",
      value: "month",
    },
    {
      label: "Tahun",
      value: "year",
    },
  ];

  return templateData;
}

export function extractErrorMessage(error: any): string {
  if (typeof error === "string") return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return "Something went wrong";
}

export function listGender() {
  const templateData = [
    {
      label: "Laki-laki",
      value: "L",
    },
    {
      label: "Perempuan",
      value: "P",
    },
  ];

  return templateData;
}

export function listStatusJemaat() {
  const templateData = [
    {
      label: "Aktif",
      value: "AKTIF",
    },
    {
      label: "Tidak Aktif",
      value: "TIDAK_AKTIF",
    },
  ];

  return templateData;
}

export function getTimeRange(
  start: string,
  end: string,
  intervalMinutes: number,
) {
  const startDate = new Date(`1970-01-01T${start}:00`);
  const endDate = new Date(`1970-01-01T${end}:00`);
  const times: string[] = [];

  while (startDate <= endDate) {
    const timeString = startDate.toTimeString().slice(0, 5);
    times.push(timeString);
    startDate.setMinutes(startDate.getMinutes() + intervalMinutes);
  }

  return times;
}

export function listTypePelayan() {
  const templateData: string[] = ["INDIVIDUAL", "GROUP"];

  return templateData;
}

export function listCategoryRolePelayan() {
  const templateData: string[] = [
    "MUSIK",
    "MULTIMEDIA",
    "MIMBAR",
    "GROUP",
    "LAIN-NYA",
  ];

  return templateData;
}

export const formatNumber = (number: number) => {
  const formatter = new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(number) || "-";
};

export function listEducation() {
  const templateData: string[] = [
    "SD/MI",
    "SMP/MTs",
    "SMA/SMK/MA",
    "D1",
    "D2",
    "D3",
    "S1/Sarjana",
    "S2/Magister",
    "S3/Doktor",
  ];

  return templateData;
}

export function listBloodType() {
  const templateData: string[] = ["A", "B", "O", "AB"];

  return templateData;
}

export function listStatusMartial() {
  const templateData = [
    {
      label: "Belum Menikah",
      value: "BM",
    },
    {
      label: "Sudah Menikah",
      value: "SM",
    },
    {
      label: "Cerai Mati",
      value: "CM",
    },
    {
      label: "Cerai Hidup",
      value: "CH",
    },
  ];

  return templateData;
}
