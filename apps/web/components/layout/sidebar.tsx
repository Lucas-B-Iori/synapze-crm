"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Columns,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/contacts", label: "Contatos", icon: Users },
  { href: "/dashboard/kanban", label: "Kanban", icon: Columns },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-zinc-700/50 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center border-b border-zinc-700/50 px-4">
          <div
            className={cn(
              "flex items-center gap-2 overflow-hidden transition-all",
              collapsed ? "w-full justify-center" : "w-full"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
              <span className="text-sm font-bold">S</span>
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="whitespace-nowrap text-lg font-semibold tracking-tight text-zinc-100"
              >
                Synapze
              </motion.span>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-[52px] flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-900 text-zinc-400 shadow-sm transition-colors hover:border-zinc-600 hover:text-zinc-200"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-zinc-800/80 text-indigo-300"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
                  collapsed && "justify-center px-2"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center transition-colors",
                    isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="active-pill"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500"
                  />
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <div>{linkContent}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="border-zinc-700 bg-zinc-900 text-zinc-100">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-zinc-700/50 p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100",
                  collapsed && "justify-center px-2"
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">Sair</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="border-zinc-700 bg-zinc-900 text-zinc-100">
                Sair
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
