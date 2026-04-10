"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FishIcon,
  LayoutDashboard,
  FolderOpen,
  PlayCircle,
  FileText,
  MessageSquare,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/simulations", label: "Simulations", icon: PlayCircle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/chat", label: "Agent Chat", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-slate-950 flex flex-col border-r border-slate-800 min-h-screen">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <FishIcon className="text-cyan-400" size={22} />
        <span className="font-bold text-white text-lg tracking-tight">
          MiroFish
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-600">
        Swarm Intelligence Engine
      </div>
    </aside>
  );
}
