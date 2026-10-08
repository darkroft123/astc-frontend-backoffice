interface LegendItemProps {
  color: "emerald" | "rose" | "amber" | "blue" | "violet" | "indigo";
  label: string;
  value: number;
}

export function LegendItem({ color, label, value }: LegendItemProps) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    blue: "bg-blue-600",
    violet: "bg-purple-600",
    indigo: "bg-indigo-600",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3.5 h-3.5 rounded-full ${colorMap[color] || "bg-zinc-400"}`} />
      <div>
        <p className="font-semibold text-xs text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}