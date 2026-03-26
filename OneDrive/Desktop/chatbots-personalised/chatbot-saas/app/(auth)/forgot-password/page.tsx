import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Reset your password"
      description="Enter the email address associated with your account and we'll send you a secure link to reset your password."
      card={<ForgotPasswordForm />}
      footerPrompt="Remember your password?"
      footerLinkHref="/login"
      footerLinkLabel="Sign in"
      accentLabel="Password Recovery"
    />
  );
}
