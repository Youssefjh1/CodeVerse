import { LoginForm } from "@/components/auth/login-form";
import { isDemoModeEnabled } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm demoModeEnabled={isDemoModeEnabled()} />;
}
