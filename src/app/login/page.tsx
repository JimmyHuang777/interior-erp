import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session) redirect(params.callbackUrl || "/dashboard");

  async function login(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: callbackUrl,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw err;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">後台登入</h1>
        <p className="text-sm text-slate-500 mb-6">室內設計案件管理系統</p>

        {params.error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            帳號或密碼錯誤，請再試一次。
          </div>
        )}

        <form action={login} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl || "/dashboard"} />
          <div>
            <label className="block text-sm text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              defaultValue="admin@example.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">密碼</label>
            <input
              type="password"
              name="password"
              required
              defaultValue="password123"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition"
          >
            登入
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400">
          測試帳號：admin@example.com / designer@example.com / site@example.com / hr@example.com（密碼皆為 password123）
        </p>
      </div>
    </div>
  );
}
