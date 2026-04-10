"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { listReports, listSimulations, chatWithReport, interviewAll } from "@/lib/api";
import type { Report, Simulation, AgentResponse } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const selectCls = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";

export default function ChatPage() {
  const [mode, setMode] = useState<"report" | "agents">("report");
  const [reports, setReports] = useState<Report[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedReport, setSelectedReport] = useState("");
  const [selectedSim, setSelectedSim] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listReports().then((r) => setReports(r?.reports ?? [])).catch(() => {});
    listSimulations().then((r) => setSimulations(r?.simulations ?? [])).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (mode === "report" && !selectedReport) { alert("Select a report first."); return; }
    if (mode === "agents" && !selectedSim) { alert("Select a simulation first."); return; }

    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setSending(true);

    try {
      if (mode === "report") {
        const r = await chatWithReport({ report_id: selectedReport, message: userMsg, session_id: sessionId });
        setSessionId(r.session_id);
        setMessages((m) => [...m, { role: "assistant", content: r.response }]);
      } else {
        const r = await interviewAll({ simulation_id: selectedSim, question: userMsg });
        const formatted = r.responses.map((a: AgentResponse) => `**${a.agent_name}**: ${a.response}`).join("\n\n");
        setMessages((m) => [...m, { role: "assistant", content: formatted || "No agent responses returned." }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "system", content: `Error: ${String(err)}` }]);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => { setMessages([]); setSessionId(undefined); };

  return (
    <div className="p-8 max-w-3xl flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Agent Chat</h1>
        <p className="text-slate-400 text-sm mt-1">Chat with the Report Agent or interview simulation agents.</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4">
        {(["report", "agents"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); clearChat(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? "bg-cyan-500 text-slate-950" : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            {m === "report" ? "Chat with Report" : "Interview Agents"}
          </button>
        ))}
      </div>

      {/* Target selector */}
      <div className="mb-4">
        {mode === "report" ? (
          <select value={selectedReport} onChange={(e) => { setSelectedReport(e.target.value); clearChat(); }} className={selectCls}>
            <option value="">Select a report…</option>
            {reports.map((r) => (
              <option key={r.report_id} value={r.report_id}>{r.title || r.report_id}</option>
            ))}
          </select>
        ) : (
          <select value={selectedSim} onChange={(e) => { setSelectedSim(e.target.value); clearChat(); }} className={selectCls}>
            <option value="">Select a simulation…</option>
            {simulations.map((s) => (
              <option key={s.simulation_id} value={s.simulation_id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-y-auto p-4 space-y-4 mb-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MessageSquare size={32} className="mb-2 opacity-40" />
            <p className="text-sm text-center">
              {mode === "report" ? "Ask the Report Agent anything about the simulation findings." : "Ask all agents the same question and see their responses."}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user" ? "bg-cyan-500 text-slate-950 rounded-br-sm font-medium" :
                msg.role === "system" ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                "bg-slate-700/60 text-slate-200 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-700/60 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="animate-spin" size={14} />Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={mode === "report" ? "Ask about the report… (Enter to send)" : "Ask all agents a question… (Enter to send)"}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
        <button onClick={handleSend} disabled={sending || !input.trim()} className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-xl hover:bg-cyan-400 disabled:opacity-40 self-end transition-colors">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
