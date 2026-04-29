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
  bg = "bg-[#1e293b]",
  children,
}: MetricCardProps) {
  return (
    <div className={`${bg} rounded-xl p-5 flex flex-col gap-2 shadow-lg`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
