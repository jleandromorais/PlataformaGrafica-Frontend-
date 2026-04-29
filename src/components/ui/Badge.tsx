type BadgeVariant = "blue" | "green" | "red" | "yellow" | "purple" | "gray";

const styles: Record<BadgeVariant, string> = {
  blue:   "bg-blue-900/50 text-blue-300 border border-blue-700",
  green:  "bg-emerald-900/50 text-emerald-300 border border-emerald-700",
  red:    "bg-red-900/50 text-red-300 border border-red-700",
  yellow: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
  purple: "bg-violet-900/50 text-violet-300 border border-violet-700",
  gray:   "bg-slate-700 text-slate-300 border border-slate-600",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}
