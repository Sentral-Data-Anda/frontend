import { AuthContainer as Container } from "@/containers";
import { cookies } from "next/headers";

export default async function AuthenticationPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  return <Container token={token} />;
}
