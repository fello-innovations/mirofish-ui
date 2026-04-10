interface Props {
  status: string;
  className?: string;
}

const colors: Record<string, string> = {
  created: "bg-slate-700/50 text-slate-300 border-slate-600",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  processing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  running: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  ontology_generated: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  graph_building: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  graph_completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ready: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  stopped: "bg-orange-500/15 text-orange-300 border-orange-500/30",
};

export default function StatusBadge({ status, className = "" }: Props) {
  const color = colors[status?.toLowerCase()] ?? "bg-slate-700/50 text-slate-400 border-slate-600";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color} ${className}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}
