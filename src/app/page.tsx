"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  PlayCircle,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { checkHealth, listProjects, listSimulations, listReports } from "@/lib/api";
import type { Project, Simulation, Report } from "@/lib/api";

export default function Dashboard() {
  const [health, setHealth] = useState<"ok" | "error" | "loading">("loading");
  const [projects, setProjects] = useState<Project[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    checkHealth()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("error"));
    listProjects().then((r) => setProjects(r.projects)).catch(() => {});
    listSimulations().then((r) => setSimulations(r.simulations)).catch(() => {});
    listReports().then((r) => setReports(r.reports)).catch(() => {});
  }, []);

  const cards = [
    { label: "Projects", value: projects.length, href: "/projects", icon: FolderOpen, accent: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Simulations", value: simulations.length, href: "/simulations", icon: PlayCircle, accent: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Reports", value: reports.length, href: "/reports", icon: FileText, accent: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">MiroFish Swarm Intelligence Engine</p>
      </div>

      {/* Health */}
      <div className={`mb-8 flex items-center gap-3 px-4 py-3 rounded-xl border w-fit text-sm ${
        health === "ok"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : health === "error"
          ? "bg-red-500/10 border-red-500/30 text-red-300"
          : "bg-slate-800 border-slate-700 text-slate-400"
      }`}>
        {health === "loading" ? (
          <Loader2 className="animate-spin" size={16} />
        ) : health === "ok" ? (
          <CheckCircle size={16} />
        ) : (
          <XCircle size={16} />
        )}
        <span className="font-medium">
          Backend:{" "}
          {health === "loading" ? "checking…" : health === "ok" ? "connected" : "unreachable"}
        </span>
        <span className="text-xs opacity-60">
          {process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, href, icon: Icon, accent, bg }) => (
          <Link
            key={href}
            href={href}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-800 transition-all"
          >
            <div className={`inline-flex p-2 rounded-lg mb-3 border ${bg}`}>
              <Icon size={18} className={accent} />
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-slate-400 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      {/* Workflow guide */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
        <h2 className="font-semibold text-slate-100 mb-5">Getting Started</h2>
        <ol className="space-y-4">
          {[
            { step: 1, title: "Create a Project", desc: "Upload PDF/markdown/text files and generate a knowledge graph.", href: "/projects" },
            { step: 2, title: "Run a Simulation", desc: "Configure agents and start a multi-agent swarm simulation.", href: "/simulations" },
            { step: 3, title: "Generate a Report", desc: "Produce an AI-authored prediction report from simulation data.", href: "/reports" },
            { step: 4, title: "Chat with Agents", desc: "Interview simulated agents and explore scenarios interactively.", href: "/chat" },
          ].map(({ step, title, desc, href }) => (
            <li key={step} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                {step}
              </span>
              <div>
                <Link href={href} className="font-medium text-slate-100 hover:text-cyan-400 transition-colors">
                  {title}
                </Link>
                <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
