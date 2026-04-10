interface Props {
  status: string;
  className?: string;
}

const colors: Record<string, string> = {
  created: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  running: "bg-blue-100 text-blue-700",
  ontology_generated: "bg-purple-100 text-purple-700",
  graph_building: "bg-indigo-100 text-indigo-700",
  graph_completed: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  ready: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  stopped: "bg-orange-100 text-orange-700",
};

export default function StatusBadge({ status, className = "" }: Props) {
  const color = colors[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}
