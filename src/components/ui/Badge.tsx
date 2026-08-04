type BadgeVariant = "blue" | "green" | "red" | "yellow" | "purple" | "gray";

const styles: Record<BadgeVariant, string> = {
  blue:   "bg-sky-500/10 text-sky-400 border border-sky-500/25",
  green:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  red:    "bg-red-500/10 text-red-400 border border-red-500/25",
  yellow: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  purple: "bg-violet-500/10 text-violet-400 border border-violet-500/25",
  gray:   "bg-white/[0.05] text-zinc-400 border border-white/[0.1]",
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
