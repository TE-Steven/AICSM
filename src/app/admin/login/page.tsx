import { Logo } from "@/components/Logo";
import { IconAlertTriangle } from "@/components/icons";
import { btn, inputClass } from "@/components/ui/button";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-slate-900">登入後台</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">請輸入帳號與密碼</p>

          {error && (
            <p className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
              <IconAlertTriangle className="h-4 w-4 shrink-0" />
              帳號或密碼錯誤
            </p>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">帳號</label>
              <input name="username" autoComplete="username" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">密碼</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
              />
            </div>
            <button type="submit" className={`${btn("primary")} w-full`}>
              登入
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
