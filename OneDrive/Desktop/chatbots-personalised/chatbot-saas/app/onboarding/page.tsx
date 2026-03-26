import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If user already has a tenant, skip onboarding
  const { count } = await db
    .from("tenant_members")
    .select("tenant_id", { count: "exact", head: true })
    .eq("profile_id", user.id);

  if ((count || 0) > 0) {
    redirect("/dashboard");
  }

  // Get user's profile for pre-filling the form
  const { data: profile } = await db
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#DC2626]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create your workspace
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Set up your organization to start building AI chatbots with{" "}
            <span className="text-white">
              Nexus<span className="text-[#EF4444]">Chat</span>
            </span>
          </p>
        </div>

        {/* Form Card */}
        <OnboardingForm
          defaultName={profile?.company_name || ""}
          userEmail={user.email || ""}
        />
      </div>
    </div>
  );
}
