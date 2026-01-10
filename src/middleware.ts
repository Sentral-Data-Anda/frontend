import { jwtDecode, JwtPayload } from "jwt-decode";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface ExtendedJwtPayload extends JwtPayload {
  type?: string;
  data?: {
    id: number;
    code: string;
    roleUser: {
      name: string;
      isAdmin: boolean;
      access: {
        id: number;
        name: string;
      }[];
    };
    lastLogin: string;
  };
}

const menuAccessMap: Record<string, string> = {
  "/ruangan": "Open Menu Room",

  "/barang": "Open Menu Barang",
  "/barang/daftar-barang": "Open Menu Barang",
  "/barang/tipe-barang": "Open Menu Tipe Barang",

  "/events": "Open Menu Event",

  "/gallery": "Open Menu Gallery",

  "/jemaat": "Open Menu Jemaat",
  "/jemaat/daftar-jemaat": "Open Menu Jemaat",
  "/jemaat/role-jemaat": "Open Menu Role Jemaat",

  "/jemaat/bapel": "Open Menu Bapel",

  "/pelayan": "Open Menu Pelayan",
  "/pelayan/daftar-pelayan": "Open Menu Pelayan",
  "/pelayan/jadwal-pelayan": "Open Menu Jadwal Pelayan",
  "/pelayan/template-jadwal": "Open Menu Template Jadwal",
  "/pelayan/role-pelayan": "Open Menu Role Pelayan",

  "/agenda": "Open Menu Agenda",

  "/report": "Open Menu Report",
  "/report/report-jemaat": "Open Menu Report Jemaat",

  "/administrator": "Open Menu Administrator",
  "/administrator/user": "Open Menu User",
  "/administrator/role-user": "Open Menu Role User",
  "/administrator/access-right": "Open Menu Access Right",
  "/administrator/activity-logs": "Open Menu Activity Logs",
};

export function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;

  const authPaths = ["/login"];

  const refreshToken = request.cookies.get("refreshToken")?.value;
  const token = request.cookies.get("accessToken")?.value;
  const signFirstLogin = request.cookies.get("isFirstLogin")?.value;

  const isLoggedIn = Boolean(refreshToken);

  const isFirstLoggedIn = Boolean(signFirstLogin);

  const isAuthPage = authPaths.includes(currentPath);

  let detailUser = null;
  let userAccess: string[] = [];
  let isAdmin = false;

  const requiredAccess = Object.entries(menuAccessMap).find(
    ([route]) => currentPath === route,
  )?.[1];

  if (isFirstLoggedIn) {
    if (currentPath !== "/authentication") {
      return NextResponse.redirect(new URL("/authentication", request.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (!isAuthPage && currentPath !== "/authentication") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (isLoggedIn && !token && currentPath !== "/authentication") {
    return NextResponse.redirect(new URL("/authentication", request.url));
  }

  if (isLoggedIn && token && isAuthPage) {
    return NextResponse.redirect(new URL("/authentication", request.url));
  }

  if (token) {
    detailUser = jwtDecode<ExtendedJwtPayload>(token);
  }

  if (detailUser) {
    isAdmin = detailUser.data?.roleUser?.isAdmin || false;
    const accessList = detailUser.data?.roleUser?.access || [];
    userAccess = accessList.map((a: any) => a.name);
  }

  if (isAdmin) {
    return NextResponse.next();
  }

  if (!requiredAccess) {
    return NextResponse.next();
  }

  if (!userAccess.includes(requiredAccess)) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|bad-gateway|offline|.*\\..*$|.*manifest.*).*)"],
};
