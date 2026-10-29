interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: string;
  valueColor?: string;
  bg?: string;
  children?: React.ReactNode;
}

export function MetricCard({
  title,
  subtitle,
  value,
  valueColor = "text-white",
  bg = "rounded-xl border border-white/[0.07] bg-panel",
  children,
}: MetricCardProps) {
  return (
    <div className={`${bg} p-5 flex flex-col gap-2`}>
      <div>
        <p className="text-xs font-semibold text-zinc-500">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
