import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { ToastProvider } from "@/components/ui/toast-provider";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ToastProvider>
      <DashboardChrome userEmail={user?.email || "Signed in"}>
        {children}
      </DashboardChrome>
    </ToastProvider>
  );
}
