import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    signup?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Access your dashboard"
      description="Use your Supabase admin credentials to open the client management workspace."
      accentLabel="Admin Access"
      card={
        <LoginForm
          signupState={resolvedSearchParams.signup}
          signupEmail={resolvedSearchParams.email}
        />
      }
      footerPrompt="Need an account?"
      footerLinkHref="/signup"
      footerLinkLabel="Create one"
    />
  );
}
