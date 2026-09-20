import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "總覽", roles: ["ADMIN", "DESIGNER", "SITE", "HR"] },
  { href: "/dashboard/cloud-storage", label: "☁️ 雲端資料庫", roles: ["ADMIN", "DESIGNER", "SITE", "HR"] },
  { href: "/dashboard/design", label: "設計管理", roles: ["ADMIN", "DESIGNER"] },
  { href: "/dashboard/construction", label: "工程管理", roles: ["ADMIN", "DESIGNER", "SITE", "HR"] },
  { href: "/dashboard/value-engineering", label: "價值工程", roles: ["ADMIN", "DESIGNER", "SITE"] },
  { href: "/dashboard/vendors", label: "廠商清冊", roles: ["ADMIN", "DESIGNER", "SITE"] },
  { href: "/dashboard/materials", label: "材料資料庫", roles: ["ADMIN", "DESIGNER", "SITE"] },
  { href: "/dashboard/contracts", label: "合約工程", roles: ["ADMIN", "DESIGNER", "HR"] },
  { href: "/dashboard/hr", label: "🔒 人事表單", roles: ["ADMIN", "HR"] },
  { href: "/dashboard/customers", label: "🔒 客戶清單", roles: ["ADMIN"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role || "DESIGNER";
  const visibleNav = NAV.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="font-semibold text-white">室內設計 ERP</div>
          <div className="text-xs text-slate-400 mt-0.5">案件管理後台</div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm hover:bg-slate-800 hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 text-xs">
          <div className="text-slate-300">{session.user.name}</div>
          <div className="text-slate-500 mb-2">{role}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-slate-400 hover:text-white transition">登出</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
