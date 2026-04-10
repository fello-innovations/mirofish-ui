"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Play,
} from "lucide-react";
import {
  listProjects,
  generateOntology,
  buildGraph,
  getProject,
  deleteProject,
  getTask,
} from "@/lib/api";
import type { Project, Task } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // New project form
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [simRequirement, setSimRequirement] = useState("");
  const [taskStatus, setTaskStatus] = useState<Record<string, Task>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await listProjects();
      setProjects(r.projects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      } catch {
        done = true;
      }
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
      setProjectName("");
      setFiles([]);
      setSimRequirement("");
      setExpanded(null);
    } catch (err) {
      alert(String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleBuild = async (projectId: string) => {
    try {
      const r = await buildGraph({ project_id: projectId });
      pollTask(r.task_id);
      await load();
    } catch (err) {
      alert(String(err));
    }
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
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload files to build knowledge graphs for simulation.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-100"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Create form */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <button
          className="flex items-center gap-2 font-semibold text-gray-800 w-full text-left"
          onClick={() => setExpanded(expanded === "new" ? null : "new")}
        >
          <Plus size={16} />
          New Project
          {expanded === "new" ? (
            <ChevronUp size={14} className="ml-auto" />
          ) : (
            <ChevronDown size={14} className="ml-auto" />
          )}
        </button>
        {expanded === "new" && (
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Project Name *
              </label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g. Market Trend Analysis"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Simulation Requirement
              </label>
              <textarea
                value={simRequirement}
                onChange={(e) => setSimRequirement(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="What do you want to predict or simulate?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Files (PDF, MD, TXT) *
              </label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-cyan-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">
                  {files.length > 0
                    ? files.map((f) => f.name).join(", ")
                    : "Click to select files"}
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.md,.txt"
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50"
            >
              {creating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              Create & Generate Ontology
            </button>
          </form>
        )}
      </div>

      {/* Project list */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-8">
          <Loader2 className="animate-spin" size={18} />
          Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No projects yet. Create one above.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.project_id}
              className="bg-white border rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-2">
                  {p.status === "ontology_generated" && (
                    <button
                      onClick={() => handleBuild(p.project_id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                    >
                      <Play size={12} />
                      Build Graph
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.project_id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400 space-x-3">
                <span>ID: {p.project_id}</span>
                {p.files?.length > 0 && (
                  <span>{p.files.length} file(s)</span>
                )}
                {p.total_text_length && (
                  <span>{p.total_text_length.toLocaleString()} chars</span>
                )}
                {p.graph_id && <span>Graph: {p.graph_id}</span>}
              </div>
              {p.error && (
                <p className="mt-2 text-xs text-red-500">{p.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
