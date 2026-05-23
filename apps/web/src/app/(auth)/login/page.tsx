import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic    = "force-dynamic";
export const revalidate = false;

export default function LoginPage() {
  return <LoginForm />;
}