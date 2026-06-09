import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { isPlatformAdmin } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = data.user;

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
          <section className="rounded-lg bg-slate-950 p-8 text-white">
            <div className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase text-slate-950">
              /admin
            </div>
            <h2 className="mt-5 text-4xl font-black">Controlled operations, not a public admin page.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              The admin panel is protected with Supabase Auth. Only platform admins can manage pricing, media,
              dealers, SEO pages and leads.
            </p>
          </section>
          <AdminLoginForm />
        </div>
      </main>
    );
  }

  if (!isPlatformAdmin(user)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="max-w-lg rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase text-amber-700">Access blocked</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">This user is not a platform admin.</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with an account that has app_metadata.role set to platform_admin.
          </p>
        </div>
      </main>
    );
  }

  return <AdminShell userEmail={user.email}>{children}</AdminShell>;
}
