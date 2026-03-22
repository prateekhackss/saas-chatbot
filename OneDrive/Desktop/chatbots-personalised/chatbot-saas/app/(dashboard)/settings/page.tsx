import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeleteAccountForm } from "@/components/dashboard/delete-account-form";
import { Shield, User } from "lucide-react";

export const metadata = {
  title: "Settings | NexusChat",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const db = supabase as any;
  const { data: profile } = await db
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage your account preferences and security settings.
        </p>
      </div>

      {/* Account Info */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
            <User className="h-5 w-5 text-stone-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Account Information
            </h2>
            <p className="text-xs text-stone-400">
              Your account details
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
              Email
            </div>
            <div className="mt-1 text-sm font-medium text-stone-900">
              {user.email}
            </div>
          </div>
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
              Name
            </div>
            <div className="mt-1 text-sm font-medium text-stone-900">
              {profile?.full_name || "Not set"}
            </div>
          </div>
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
              Account ID
            </div>
            <div className="mt-1 font-mono text-xs text-stone-500">
              {user.id}
            </div>
          </div>
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
              Role
            </div>
            <div className="mt-1 text-sm font-medium text-stone-900 capitalize">
              {profile?.role || "user"}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
            <Shield className="h-5 w-5 text-stone-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Security
            </h2>
            <p className="text-xs text-stone-400">
              Manage your account security
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-stone-900">
                Password
              </div>
              <div className="text-xs text-stone-400">
                Change your account password via email reset
              </div>
            </div>
            <a
              href="/forgot-password"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
            >
              Reset Password
            </a>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-red-200" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
            Danger Zone
          </span>
          <div className="h-px flex-1 bg-red-200" />
        </div>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
