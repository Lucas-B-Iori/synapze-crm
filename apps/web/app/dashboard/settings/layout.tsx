"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsTabs = [
  { href: "/dashboard/settings/channels", label: "Canais", icon: MessageSquare },
  { href: "/dashboard/settings/members", label: "Membros", icon: Users },
  { href: "/dashboard/settings/workspace", label: "Workspace", icon: Building2 },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800/60 bg-zinc-950/40 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Configurações</h1>
        <p className="text-sm text-zinc-500">Gerencie canais, membros e preferências do workspace.</p>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-auto p-6 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <nav className="flex flex-col gap-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-zinc-800/80 text-indigo-300"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-1 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
