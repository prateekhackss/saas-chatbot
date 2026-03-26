import { AnimatedAuth } from "@/components/auth/animated-auth";

type LoginPageProps = {
  searchParams: Promise<{
    signup?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <AnimatedAuth
      initialMode="login"
      signupState={resolvedSearchParams.signup}
      signupEmail={resolvedSearchParams.email}
    />
  );
}
