const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

/* ------------------------------------------------------------------ */
/* The MiroFish backend wraps every response in:                      */
/*   { success: bool, data: <payload>, error?: string }               */
/* This helper unwraps it, throwing on failure.                       */
/* ------------------------------------------------------------------ */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  count?: number;
}

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
  const json: ApiResponse<T> = await res.json();
  if (json.success === false) {
    throw new Error(json.error || `API ${path} returned success=false`);
  }
  return json.data;
}

// ── Health ─────────────────────────────────────────────────────────────────
export const checkHealth = () =>
  fetch(`${BACKEND}/health`).then((r) => {
    if (!r.ok) throw new Error("unhealthy");
    return r.json() as Promise<{ status: string }>;
  });

// ── Projects / Graph ───────────────────────────────────────────────────────
export const listProjects = () =>
  request<Project[]>("/api/graph/project/list");

export const getProject = (id: string) =>
  request<Project>(`/api/graph/project/${id}`);

export const deleteProject = (id: string) =>
  fetch(`${BACKEND}/api/graph/project/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error("delete failed");
  });

export const generateOntology = (formData: FormData) =>
  fetch(`${BACKEND}/api/graph/ontology/generate`, {
    method: "POST",
    body: formData,
  }).then(async (r) => {
    const json = await r.json();
    if (!r.ok || json.success === false)
      throw new Error(json.error || `ontology/generate failed (${r.status})`);
    return json.data as { project_id: string; project_name: string };
  });

export const buildGraph = (body: { project_id: string }) =>
  request<{ task_id: string }>("/api/graph/build", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getTask = (id: string) =>
  request<Task>(`/api/graph/task/${id}`);

export const getGraphData = (graphId: string) =>
  request<GraphData>(`/api/graph/data/${graphId}`);

// ── Simulations ────────────────────────────────────────────────────────────
export const listSimulations = () =>
  request<Simulation[]>("/api/simulation/list");

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
  request<Simulation>(`/api/simulation/${id}`);

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
  request<TimelineEntry[]>(`/api/simulation/${id}/timeline`);

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
  request<Report[]>("/api/report/list");

export const generateReport = (body: { simulation_id: string }) =>
  request<{ report_id: string; task_id: string }>("/api/report/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getReport = (id: string) =>
  request<Report>(`/api/report/${id}`);

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
  files: { filename: string; size: number }[];
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
