// import { jwtDecode, JwtPayload } from "jwt-decode";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// interface ExtendedJwtPayload extends JwtPayload {
//   type?: string;
//   data?: {
//     id: number;
//     code: string;
//     roleUser: {
//       name: string;
//       isAdmin: boolean;
//       access: {
//         id: number;
//         name: string;
//       }[];
//     };
//     lastLogin: string;
//   };
// }

// const menuAccessMap: Record<string, string> = {
//   "/asset-management/ruangan": "Open Menu Room",
//   "/asset-management/barang": "Open Menu Item",
//   "/events": "Open Menu Event",
//   "/gallery": "Open Menu Gallery",
//   "/user-management/pelayan": "Open Menu Pelayan",
//   "/user-management/user": "Open Menu User",
//   "/administrator": "Open Menu Administrator",
//   "/administrator/role-user": "Open Menu Role User",
//   "/administrator/bapel": "Open Menu Bapel",
//   "/administrator/activity-logs": "Open Menu Activity Logs",
// };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(request: NextRequest) {
  // const currentPath = request.nextUrl.pathname;

  // const authPaths = ["/login"];

  // const token = request.cookies.get("accessToken")?.value;

  // const isLoggedIn = Boolean(token);

  // const isAuthPage = authPaths.includes(currentPath);

  // if (!isLoggedIn && !isAuthPage) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  // if (isLoggedIn && isAuthPage) {
  //   return NextResponse.redirect(new URL("/authentication", request.url));
  // }

  // let detailUser = null;

  // if (token) {
  //   detailUser = jwtDecode<ExtendedJwtPayload>(token);
  // }

  // let userAccess: string[] = [];
  // let isAdmin = false;

  // if (detailUser) {
  //   isAdmin = detailUser.data?.roleUser?.isAdmin || false;
  //   const accessList = detailUser.data?.roleUser?.access || [];
  //   userAccess = accessList.map((a: any) => a.name);
  // }

  // if (isAdmin) return NextResponse.next();

  // const requiredAccess = Object.entries(menuAccessMap).find(
  //   ([route]) => currentPath === route,
  // )?.[1];

  // if (!requiredAccess) {
  //   return NextResponse.next();
  // }

  // if (!userAccess.includes(requiredAccess)) {
  //   return NextResponse.redirect(new URL("/404", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  // matcher: ["/((?!_next/|api/|.*\\.png$|.*\\.ico$|.*manifest.*).*)"],
};
