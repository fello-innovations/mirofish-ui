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
    <aside className="w-56 shrink-0 bg-gray-950 text-gray-300 flex flex-col border-r border-gray-800 min-h-screen">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <FishIcon className="text-cyan-400" size={22} />
        <span className="font-bold text-white text-lg tracking-tight">
          MiroFish
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-cyan-600 text-white"
                  : "hover:bg-gray-800 text-gray-400 hover:text-gray-100"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-600">
        Swarm Intelligence Engine
      </div>
    </aside>
  );
}
