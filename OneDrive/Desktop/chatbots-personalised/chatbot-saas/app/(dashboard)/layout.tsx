import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { ToastProvider } from "@/components/ui/toast-provider";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const db = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user role from profiles
  let isAdmin = false;
  if (user) {
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  return (
    <ToastProvider>
      <DashboardChrome
        userEmail={user?.email || "Signed in"}
        isAdmin={isAdmin}
      >
        {children}
      </DashboardChrome>
    </ToastProvider>
  );
}
