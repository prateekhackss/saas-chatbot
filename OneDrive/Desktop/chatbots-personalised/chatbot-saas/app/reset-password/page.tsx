import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(28,25,23,0.12),_transparent_40%),linear-gradient(180deg,_#FAFAF9_0%,_#F5F5F4_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg items-center justify-center">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
              Account Recovery
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              Set a new password
            </h1>
            <p className="text-sm text-stone-500">
              Choose a strong password for your NexusChat account.
            </p>
          </div>

          <div className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-200/60 sm:p-8">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
