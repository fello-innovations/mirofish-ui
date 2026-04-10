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
    listProjects()
      .then((r) => setProjects(r.projects))
      .catch(() => {});
    listSimulations()
      .then((r) => setSimulations(r.simulations))
      .catch(() => {});
    listReports()
      .then((r) => setReports(r.reports))
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: "Projects",
      value: projects.length,
      href: "/projects",
      icon: FolderOpen,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: "Simulations",
      value: simulations.length,
      href: "/simulations",
      icon: PlayCircle,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Reports",
      value: reports.length,
      href: "/reports",
      icon: FileText,
      color: "bg-green-50 text-green-700",
    },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">MiroFish Swarm Intelligence Engine</p>
      </div>

      {/* Health */}
      <div className="mb-8 flex items-center gap-3 px-4 py-3 rounded-xl border bg-white w-fit">
        {health === "loading" ? (
          <Loader2 className="animate-spin text-gray-400" size={18} />
        ) : health === "ok" ? (
          <CheckCircle className="text-green-500" size={18} />
        ) : (
          <XCircle className="text-red-500" size={18} />
        )}
        <span className="text-sm font-medium">
          Backend:{" "}
          <span
            className={
              health === "ok"
                ? "text-green-600"
                : health === "error"
                ? "text-red-600"
                : "text-gray-500"
            }
          >
            {health === "loading" ? "checking…" : health === "ok" ? "connected" : "unreachable"}
          </span>
        </span>
        <span className="text-xs text-gray-400">
          ({process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"})
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {cards.map(({ label, value, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      {/* Workflow guide */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Getting Started</h2>
        <ol className="space-y-3">
          {[
            { step: 1, title: "Create a Project", desc: "Upload PDF/markdown/text files and generate a knowledge graph.", href: "/projects" },
            { step: 2, title: "Run a Simulation", desc: "Configure agents and start a multi-agent swarm simulation.", href: "/simulations" },
            { step: 3, title: "Generate a Report", desc: "Produce an AI-authored prediction report from simulation data.", href: "/reports" },
            { step: 4, title: "Chat with Agents", desc: "Interview simulated agents and explore scenarios interactively.", href: "/chat" },
          ].map(({ step, title, desc, href }) => (
            <li key={step} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                {step}
              </span>
              <div>
                <Link href={href} className="font-medium text-gray-900 hover:text-cyan-600 transition-colors">
                  {title}
                </Link>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
