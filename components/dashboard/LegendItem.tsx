interface LegendItemProps {
  color: "emerald" | "rose" | "amber" | "blue" | "violet" | "indigo";
  label: string;
  value: number;
}

export function LegendItem({ color, label, value }: LegendItemProps) {
  const colorMap: Record<string, string> = {
    emerald: "bg-green",
    rose: "bg-red",
    amber: "bg-amber",
    blue: "bg-blue",
    violet: "bg-violet",
    indigo: "bg-violet",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3.5 h-3.5 rounded-full ${colorMap[color] || "bg-text-4"}`} />
      <div>
        <p className="font-semibold text-xs text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}