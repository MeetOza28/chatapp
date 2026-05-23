import { RegisterForm } from "@/components/auth/RegisterForm";

export const dynamic    = "force-dynamic";
export const revalidate = false;

export default function RegisterPage() {
  return <RegisterForm />;
}