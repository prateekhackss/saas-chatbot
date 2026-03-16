import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Sign up"
      title="Create your dashboard account"
      description="Start your NexusChat workspace, create client portals, and manage branded AI deployments from one place."
      accentLabel="New Account"
      card={<SignupForm />}
      footerPrompt="Already have access?"
      footerLinkHref="/login"
      footerLinkLabel="Sign in"
    />
  );
}
