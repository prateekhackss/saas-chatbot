import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Sign in"
      title="Access your dashboard"
      description="Use your Supabase admin credentials to open the client management workspace."
      accentLabel="Admin Access"
      card={<LoginForm />}
      footerPrompt="Need an account?"
      footerLinkHref="/signup"
      footerLinkLabel="Create one"
    />
  );
}
