"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Loader2, Trash2, RefreshCw, ChevronDown, ChevronUp, Plus, Play } from "lucide-react";
import { listProjects, generateOntology, buildGraph, deleteProject, getTask } from "@/lib/api";
import type { Project, Task } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

const inputCls = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";
const btnPrimary = "flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-cyan-400 disabled:opacity-40 transition-colors";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [simRequirement, setSimRequirement] = useState("");
  const [taskStatus, setTaskStatus] = useState<Record<string, Task>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await listProjects();
      setProjects(r?.projects ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pollTask = async (taskId: string) => {
    let done = false;
    while (!done) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const r = await getTask(taskId);
        setTaskStatus((p) => ({ ...p, [taskId]: r.task }));
        if (r.task.status === "completed" || r.task.status === "failed") {
          done = true;
          load();
        }
      } catch { done = true; }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || files.length === 0) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", projectName);
      fd.append("simulation_requirement", simRequirement);
      files.forEach((f) => fd.append("files", f));
      const r = await generateOntology(fd);
      await load();
      pollTask(r.task_id);
      setProjectName(""); setFiles([]); setSimRequirement(""); setExpanded(null);
    } catch (err) { alert(String(err)); } finally { setCreating(false); }
  };

  const handleBuild = async (projectId: string) => {
    try {
      const r = await buildGraph({ project_id: projectId });
      pollTask(r.task_id);
      await load();
    } catch (err) { alert(String(err)); }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Delete this project?")) return;
    await deleteProject(projectId);
    load();
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Upload files to build knowledge graphs for simulation.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Create form */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-6">
        <button
          className="flex items-center gap-2 font-semibold text-slate-100 w-full text-left"
          onClick={() => setExpanded(expanded === "new" ? null : "new")}
        >
          <Plus size={16} className="text-cyan-400" />
          New Project
          {expanded === "new" ? <ChevronUp size={14} className="ml-auto text-slate-400" /> : <ChevronDown size={14} className="ml-auto text-slate-400" />}
        </button>
        {expanded === "new" && (
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Project Name *</label>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} required className={inputCls} placeholder="e.g. Market Trend Analysis" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Simulation Requirement</label>
              <textarea value={simRequirement} onChange={(e) => setSimRequirement(e.target.value)} rows={2} className={inputCls} placeholder="What do you want to predict or simulate?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Files (PDF, MD, TXT) *</label>
              <div
                className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={20} className="mx-auto text-slate-500 mb-1" />
                <span className="text-sm text-slate-400">
                  {files.length > 0 ? files.map((f) => f.name).join(", ") : "Click to select files"}
                </span>
              </div>
              <input ref={fileRef} type="file" multiple accept=".pdf,.md,.txt" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </div>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              Create & Generate Ontology
            </button>
          </form>
        )}
      </div>

      {/* Project list */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="animate-spin" size={18} />Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No projects yet. Create one above.</div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.project_id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-100">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-2">
                  {p.status === "ontology_generated" && (
                    <button onClick={() => handleBuild(p.project_id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 transition-colors">
                      <Play size={11} />Build Graph
                    </button>
                  )}
                  <button onClick={() => handleDelete(p.project_id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 flex gap-3 flex-wrap">
                <span className="font-mono">{p.project_id.slice(0, 12)}…</span>
                {p.files?.length > 0 && <span>{p.files.length} file(s)</span>}
                {p.total_text_length && <span>{p.total_text_length.toLocaleString()} chars</span>}
                {p.graph_id && <span>graph: {p.graph_id.slice(0, 8)}…</span>}
              </div>
              {p.error && <p className="mt-2 text-xs text-red-400">{p.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
