"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Plus, Download, ChevronDown, ChevronUp } from "lucide-react";
import { listReports, listSimulations, generateReport, getReport, getReportProgress } from "@/lib/api";
import type { Report, Simulation } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

const selectCls = "flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fullReport, setFullReport] = useState<Record<string, Report>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [simId, setSimId] = useState("");
  const [generating, setGenerating] = useState(false);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  const load = async () => {
    setLoading(true);
    try {
      const [rr, sr] = await Promise.all([listReports(), listSimulations()]);
      setReports(rr.reports);
      setSimulations(sr.simulations);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pollProgress = async (reportId: string) => {
    let done = false;
    while (!done) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const r = await getReportProgress(reportId);
        setProgress((p) => ({ ...p, [reportId]: r.progress }));
        if (r.progress >= 100) { done = true; load(); }
      } catch { done = true; }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simId) return;
    setGenerating(true);
    try {
      const r = await generateReport({ simulation_id: simId });
      setSimId("");
      await load();
      pollProgress(r.report_id);
    } catch (err) { alert(String(err)); } finally { setGenerating(false); }
  };

  const handleExpand = async (reportId: string) => {
    if (expanded === reportId) { setExpanded(null); return; }
    setExpanded(reportId);
    if (!fullReport[reportId]) {
      try {
        const r = await getReport(reportId);
        setFullReport((p) => ({ ...p, [reportId]: r.report }));
      } catch {}
    }
  };

  const completedSims = simulations.filter((s) => s.status === "completed" || s.status === "stopped");

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Generate and browse AI prediction reports.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-slate-100 mb-3">Generate Report</h2>
        <form onSubmit={handleGenerate} className="flex gap-3">
          <select value={simId} onChange={(e) => setSimId(e.target.value)} required className={selectCls}>
            <option value="">Select completed simulation…</option>
            {completedSims.map((s) => (
              <option key={s.simulation_id} value={s.simulation_id}>{s.name}</option>
            ))}
          </select>
          <button type="submit" disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-cyan-400 disabled:opacity-40 transition-colors shrink-0">
            {generating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            Generate
          </button>
        </form>
        {completedSims.length === 0 && <p className="text-xs text-amber-400 mt-2">No completed simulations found. Run a simulation first.</p>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="animate-spin" size={18} />Loading…</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No reports yet.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isOpen = expanded === report.report_id;
            const prog = progress[report.report_id];
            const full = fullReport[report.report_id];
            return (
              <div key={report.report_id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">{report.title || `Report ${report.report_id.slice(0, 8)}`}</span>
                      <StatusBadge status={report.status || "unknown"} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">{report.report_id.slice(0, 12)}… · sim {report.simulation_id.slice(0, 8)}…</div>
                    {prog !== undefined && prog < 100 && (
                      <div className="mt-2 h-1.5 bg-slate-700 rounded-full w-48">
                        <div className="h-1.5 bg-cyan-500 rounded-full transition-all" style={{ width: `${prog}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`${BACKEND}/api/report/${report.report_id}/download`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 transition-colors">
                      <Download size={12} />MD
                    </a>
                    <button onClick={() => handleExpand(report.report_id)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-700/50 px-4 pb-4 pt-3">
                    {full ? (
                      full.sections && full.sections.length > 0 ? (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {full.sections.map((sec) => (
                            <div key={sec.index}>
                              <h3 className="font-semibold text-slate-200 mb-1">{sec.title}</h3>
                              <p className="text-sm text-slate-400 whitespace-pre-wrap">{sec.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 whitespace-pre-wrap max-h-[600px] overflow-y-auto">{full.content || "No content available."}</p>
                      )
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={14} />Loading report…</div>
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
