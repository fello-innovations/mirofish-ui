const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Health ─────────────────────────────────────────────────────────────────
export const checkHealth = () => request<{ status: string }>("/health");

// ── Projects / Graph ───────────────────────────────────────────────────────
export const listProjects = () =>
  request<{ projects: Project[] }>("/api/graph/project/list");

export const getProject = (id: string) =>
  request<{ project: Project }>(`/api/graph/project/${id}`);

export const deleteProject = (id: string) =>
  request<void>(`/api/graph/project/${id}`, { method: "DELETE" });

export const generateOntology = (formData: FormData) =>
  fetch(`${BACKEND}/api/graph/ontology/generate`, {
    method: "POST",
    body: formData,
  }).then((r) => {
    if (!r.ok) throw new Error(`ontology/generate failed (${r.status})`);
    return r.json() as Promise<{ project_id: string; task_id: string }>;
  });

export const buildGraph = (body: { project_id: string }) =>
  request<{ task_id: string }>("/api/graph/build", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getTask = (id: string) =>
  request<{ task: Task }>(`/api/graph/task/${id}`);

export const getGraphData = (graphId: string) =>
  request<GraphData>(`/api/graph/data/${graphId}`);

// ── Simulations ────────────────────────────────────────────────────────────
export const listSimulations = () =>
  request<{ simulations: Simulation[] }>("/api/simulation/list");

export const createSimulation = (body: {
  project_id: string;
  name: string;
  description?: string;
}) =>
  request<{ simulation_id: string }>("/api/simulation/create", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getSimulation = (id: string) =>
  request<{ simulation: Simulation }>(`/api/simulation/${id}`);

export const prepareSimulation = (body: { simulation_id: string }) =>
  request<{ task_id: string }>("/api/simulation/prepare", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const startSimulation = (body: {
  simulation_id: string;
  num_agents?: number;
  num_rounds?: number;
}) =>
  request<{ message: string }>("/api/simulation/start", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const stopSimulation = (body: { simulation_id: string }) =>
  request<{ message: string }>("/api/simulation/stop", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getRunStatus = (id: string) =>
  request<RunStatus>(`/api/simulation/${id}/run-status`);

export const getTimeline = (id: string) =>
  request<{ timeline: TimelineEntry[] }>(`/api/simulation/${id}/timeline`);

export const interviewAll = (body: {
  simulation_id: string;
  question: string;
}) =>
  request<{ responses: AgentResponse[] }>("/api/simulation/interview/all", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ── Reports ────────────────────────────────────────────────────────────────
export const listReports = () =>
  request<{ reports: Report[] }>("/api/report/list");

export const generateReport = (body: { simulation_id: string }) =>
  request<{ report_id: string; task_id: string }>("/api/report/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getReport = (id: string) =>
  request<{ report: Report }>(`/api/report/${id}`);

export const getReportProgress = (id: string) =>
  request<{ progress: number; message: string }>(
    `/api/report/${id}/progress`
  );

export const chatWithReport = (body: {
  report_id: string;
  message: string;
  session_id?: string;
}) =>
  request<{ response: string; session_id: string }>("/api/report/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ── Types ──────────────────────────────────────────────────────────────────
export interface Project {
  project_id: string;
  name: string;
  status: string;
  files: string[];
  total_text_length?: number;
  graph_id?: string;
  error?: string;
  created_at?: string;
}

export interface Task {
  task_id: string;
  task_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  error?: string;
  result?: Record<string, unknown>;
}

export interface GraphData {
  nodes: { id: string; type: string; label: string }[];
  edges: { source: string; target: string; label?: string }[];
}

export interface Simulation {
  simulation_id: string;
  name: string;
  status: string;
  project_id: string;
  description?: string;
  created_at?: string;
}

export interface RunStatus {
  status: string;
  current_round: number;
  total_rounds: number;
  agent_count: number;
  message?: string;
}

export interface TimelineEntry {
  round: number;
  summary: string;
  timestamp?: string;
}

export interface AgentResponse {
  agent_id: string;
  agent_name: string;
  response: string;
}

export interface Report {
  report_id: string;
  simulation_id: string;
  title?: string;
  content?: string;
  sections?: ReportSection[];
  created_at?: string;
  status?: string;
}

export interface ReportSection {
  title: string;
  content: string;
  index: number;
}
