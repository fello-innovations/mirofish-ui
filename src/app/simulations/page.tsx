"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Play,
  Square,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  listSimulations,
  listProjects,
  createSimulation,
  prepareSimulation,
  startSimulation,
  stopSimulation,
  getRunStatus,
  getTimeline,
} from "@/lib/api";
import type { Simulation, Project, RunStatus, TimelineEntry } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runStatuses, setRunStatuses] = useState<Record<string, RunStatus>>({});
  const [timelines, setTimelines] = useState<Record<string, TimelineEntry[]>>({});

  // New sim form
  const [formProjectId, setFormProjectId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [numAgents, setNumAgents] = useState(10);
  const [numRounds, setNumRounds] = useState(5);

  const load = async () => {
    setLoading(true);
    try {
      const [sr, pr] = await Promise.all([listSimulations(), listProjects()]);
      setSimulations(sr.simulations);
      setProjects(pr.projects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fetchRunStatus = async (simId: string) => {
    try {
      const s = await getRunStatus(simId);
      setRunStatuses((p) => ({ ...p, [simId]: s }));
    } catch {}
    try {
      const t = await getTimeline(simId);
      setTimelines((p) => ({ ...p, [simId]: t.timeline }));
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createSimulation({
        project_id: formProjectId,
        name: formName,
        description: formDesc,
      });
      setFormName("");
      setFormDesc("");
      setFormProjectId("");
      setExpanded(null);
      await load();
    } catch (err) {
      alert(String(err));
    } finally {
      setCreating(false);
    }
  };

  const handlePrepare = async (simId: string) => {
    try {
      await prepareSimulation({ simulation_id: simId });
      await load();
    } catch (err) {
      alert(String(err));
    }
  };

  const handleStart = async (simId: string) => {
    try {
      await startSimulation({
        simulation_id: simId,
        num_agents: numAgents,
        num_rounds: numRounds,
      });
      await load();
      // Poll status
      let running = true;
      while (running) {
        await new Promise((r) => setTimeout(r, 3000));
        await fetchRunStatus(simId);
        const s = runStatuses[simId];
        if (s && (s.status === "completed" || s.status === "stopped" || s.status === "failed")) {
          running = false;
          await load();
        }
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const handleStop = async (simId: string) => {
    try {
      await stopSimulation({ simulation_id: simId });
      await load();
    } catch (err) {
      alert(String(err));
    }
  };

  const readyProjects = projects.filter((p) => p.status === "graph_completed");

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Simulations</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and run multi-agent swarm simulations.
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
          New Simulation
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
                Project (must have graph_completed status) *
              </label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select a project…</option>
                {readyProjects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name} ({p.project_id})
                  </option>
                ))}
              </select>
              {readyProjects.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  No projects with completed graphs found. Build a graph first.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Simulation Name *
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g. Public Opinion Sim"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Plus size={14} />
              )}
              Create Simulation
            </button>
          </form>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-8">
          <Loader2 className="animate-spin" size={18} />
          Loading…
        </div>
      ) : simulations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No simulations yet. Create one above.
        </div>
      ) : (
        <div className="space-y-3">
          {simulations.map((sim) => {
            const rs = runStatuses[sim.simulation_id];
            const tl = timelines[sim.simulation_id] || [];
            const isOpen = expanded === sim.simulation_id;
            return (
              <div key={sim.simulation_id} className="bg-white border rounded-xl">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sim.name}</span>
                      <StatusBadge status={sim.status} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {sim.simulation_id} · project {sim.project_id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sim.status === "created" && (
                      <button
                        onClick={() => handlePrepare(sim.simulation_id)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
                      >
                        Prepare
                      </button>
                    )}
                    {sim.status === "ready" && (
                      <button
                        onClick={() => handleStart(sim.simulation_id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                      >
                        <Play size={12} />
                        Start
                      </button>
                    )}
                    {sim.status === "running" && (
                      <button
                        onClick={() => handleStop(sim.simulation_id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                      >
                        <Square size={12} />
                        Stop
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setExpanded(isOpen ? null : sim.simulation_id);
                        if (!isOpen) fetchRunStatus(sim.simulation_id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t px-4 pb-4 pt-3">
                    {/* Config */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500">Agents</label>
                        <input
                          type="number"
                          value={numAgents}
                          min={1}
                          onChange={(e) => setNumAgents(Number(e.target.value))}
                          className="w-full border rounded px-2 py-1 text-sm mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Rounds</label>
                        <input
                          type="number"
                          value={numRounds}
                          min={1}
                          onChange={(e) => setNumRounds(Number(e.target.value))}
                          className="w-full border rounded px-2 py-1 text-sm mt-0.5"
                        />
                      </div>
                    </div>
                    {/* Run status */}
                    {rs && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                        <div className="flex justify-between text-gray-700 mb-1">
                          <span>Round {rs.current_round} / {rs.total_rounds}</span>
                          <span>{rs.agent_count} agents</span>
                          <StatusBadge status={rs.status} />
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-cyan-500 rounded-full transition-all"
                            style={{
                              width: rs.total_rounds
                                ? `${(rs.current_round / rs.total_rounds) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {/* Timeline */}
                    {tl.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Timeline
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {tl.map((entry) => (
                            <div
                              key={entry.round}
                              className="flex gap-3 text-sm"
                            >
                              <span className="text-gray-400 shrink-0">
                                R{entry.round}
                              </span>
                              <span className="text-gray-700">{entry.summary}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
