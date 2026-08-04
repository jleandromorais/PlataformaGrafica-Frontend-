import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Briefcase, Coins, FileText, Receipt, RefreshCw, Scale, Search } from "lucide-react";
import { Select } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { brl, brlCompact } from "../../utils/format";
import { getDashboard, getTrimestresCivis } from "../../api";
import type { KpiMensal } from "../../types";

const TODOS_OS_ANOS = "Todos os anos";

const KPI_CAMPOS: { chave: keyof KpiMensal; label: string; Icon: typeof Search; accent: string }[] = [
  { chave: "cgr", label: "CGR", Icon: Search, accent: "#3987e5" },
  { chave: "ret", label: "RET", Icon: Receipt, accent: "#f59e0b" },
  { chave: "cgf", label: "CGF", Icon: FileText, accent: "#16a085" },
  { chave: "rp", label: "RP", Icon: Coins, accent: "#9085e9" },
  { chave: "rpv", label: "RPV", Icon: Scale, accent: "#ec4899" },
  { chave: "scg", label: "SCG", Icon: Briefcase, accent: "#22c55e" },
];

// Paleta categórica validada no dashboard original (Tkinter).
const COR_CGR = "#3987e5";
const COR_RET = "#f59e0b";
const COR_RP = "#9085e9";
const COR_RPV = "#ec4899";
const COR_PMPV = "#3987e5";
const COR_SCG = "#22c55e";
const COR_CGF = "#16a085";
const COR_NEG = "#ef4444";

function pct(v: number): string {
  const sinal = v >= 0 ? "+" : "";
  return `${sinal}${v.toFixed(1)}%`.replace(".", ",");
}

function variacao(atual: number, anterior: number | undefined): number | null {
  if (anterior === undefined || anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

function agruparTrimestres(
  historico: KpiMensal[],
  trimestresCivis: { label: string; meses: string[] }[]
) {
  const porMes = new Map(historico.map((h) => [h.periodo, h]));
  const anos = [...new Set(historico.map((h) => Number(h.periodo.split("/")[1])))].sort(
    (a, b) => a - b
  );
  const resultado: { trimestre: string; cgr: number; ret: number; rp: number; rpv: number; total: number }[] = [];
  for (const ano of anos) {
    for (const tri of trimestresCivis) {
      const periodosTri = tri.meses.map((m) => `${m}/${ano}`);
      const itens = periodosTri.map((p) => porMes.get(p)).filter(Boolean) as KpiMensal[];
      if (!itens.length) continue;
      const cgr = itens.reduce((s, i) => s + i.cgr, 0);
      const ret = itens.reduce((s, i) => s + i.ret, 0);
      const rp = itens.reduce((s, i) => s + i.rp, 0);
      const rpv = itens.reduce((s, i) => s + i.rpv, 0);
      resultado.push({ trimestre: `${tri.label} ${ano}`, cgr, ret, rp, rpv, total: cgr + ret + rp + rpv });
    }
  }
  return resultado;
}

const TooltipBRL = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#141414] px-3.5 py-2.5 text-xs shadow-2xl">
      <p className="mb-1 font-medium text-zinc-500">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color ?? p.fill }}>
          {p.name}: {brl(p.value)}
        </p>
      ))}
    </div>
  );
};

function SectionHeading({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function KpiTile({
  label,
  Icon,
  value,
  varPct,
  varLabel,
  accent,
}: {
  label: string;
  Icon: typeof Search;
  value: string;
  varPct: number | null | undefined;
  varLabel?: string;
  accent: string;
}) {
  const isZero = value === brl(0);
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-[#111113] p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-colors hover:border-white/[0.12]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium tracking-wide text-zinc-400">{label}</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}17`, color: accent }}
        >
          <Icon size={16} />
        </span>
      </div>
      <p className={`mt-5 text-[1.75rem] font-bold leading-none tracking-tight ${isZero ? "text-zinc-600" : "text-white"}`}>
        {value}
      </p>
      {varPct !== null && varPct !== undefined ? (
        <p className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${varPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          <span className="flex items-center gap-1">
            <span aria-hidden>{varPct >= 0 ? "↗" : "↘"}</span> {pct(varPct)}
          </span>
          {varLabel && <span className="font-normal text-zinc-600">vs {varLabel}</span>}
        </p>
      ) : (
        <p className="mt-3 text-xs text-zinc-600">Sem comparativo</p>
      )}
    </div>
  );
}

/** Barra de composição em duas metades a partir de um eixo central — evita o
 * bug de `margin-left: auto` dentro de flex estourando o container quando o
 * valor é negativo. Cada linha ocupa no máximo a metade do espaço disponível
 * de cada lado do eixo, proporcional ao maior |valor| do grupo. */
function CompositionRow({
  label,
  value,
  maxAbs,
  color,
}: {
  label: string;
  value: number;
  maxAbs: number;
  color: string;
}) {
  const widthPct = maxAbs > 0 ? Math.min(100, (Math.abs(value) / maxAbs) * 100) : 0;
  const isNeg = value < 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 shrink-0 text-xs font-semibold text-zinc-500">{label}</span>
      <div className="flex h-6 flex-1 items-center">
        <div className="flex h-full flex-1 justify-end overflow-hidden rounded-l bg-white/[0.04]">
          {isNeg && (
            <div
              className="h-full rounded-l transition-all"
              style={{ width: `${widthPct}%`, backgroundColor: COR_NEG }}
            />
          )}
        </div>
        <div className="mx-px h-full w-px bg-white/10" />
        <div className="h-full flex-1 overflow-hidden rounded-r bg-white/[0.04]">
          {!isNeg && (
            <div
              className="h-full rounded-r transition-all"
              style={{ width: `${widthPct}%`, backgroundColor: color }}
            />
          )}
        </div>
      </div>
      <span className={`w-32 shrink-0 text-right text-sm font-semibold tabular-nums ${isNeg ? "text-red-400" : "text-zinc-200"}`}>
        {brl(value)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [historicoCompleto, setHistoricoCompleto] = useState<KpiMensal[]>([]);
  const [ultimoMes, setUltimoMes] = useState<KpiMensal | null>(null);
  const [seriePmpv, setSeriePmpv] = useState<{ periodo: string; valor: number }[]>([]);
  const [serieScg, setSerieScg] = useState<{ periodo: string; valor: number }[]>([]);
  const [trimestresCivis, setTrimestresCivis] = useState<{ label: string; meses: string[] }[]>([]);
  const [ano, setAno] = useState(TODOS_OS_ANOS);
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async (anoFiltro?: string, isCurrent: () => boolean = () => true) => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await getDashboard(anoFiltro);
      if (!isCurrent()) return;
      setHistoricoCompleto(dados.historico);
      setUltimoMes(dados.ultimo_mes);
      setSeriePmpv(dados.serie_pmpv);
      setSerieScg(dados.serie_scg);
      if (!anoFiltro) {
        const anos = [...new Set(dados.historico.map((h) => h.periodo.split("/")[1]))].sort(
          (a, b) => Number(b) - Number(a)
        );
        setAnosDisponiveis(anos);
      }
    } catch {
      if (!isCurrent()) return;
      setErro("Não foi possível carregar o dashboard. Confira se o backend está no ar.");
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    carregar(undefined, () => active);
    getTrimestresCivis().then((dados) => {
      if (active) setTrimestresCivis(dados);
    }).catch(() => {
      if (active) setTrimestresCivis([]);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnoChange = (novoAno: string) => {
    setAno(novoAno);
    carregar(novoAno === TODOS_OS_ANOS ? undefined : novoAno);
  };

  const mesAnterior = historicoCompleto.length >= 2 ? historicoCompleto[historicoCompleto.length - 2] : undefined;

  const composicaoTrimestral = useMemo(
    () => agruparTrimestres(historicoCompleto, trimestresCivis),
    [historicoCompleto, trimestresCivis]
  );

  const ultimoTrimestre = composicaoTrimestral[composicaoTrimestral.length - 1];
  const stageColors: Record<string, string> = { cgr: COR_CGR, ret: COR_RET, rp: COR_RP, rpv: COR_RPV };
  const maxAbsComposicao = ultimoTrimestre
    ? Math.max(Math.abs(ultimoTrimestre.cgr), Math.abs(ultimoTrimestre.ret), Math.abs(ultimoTrimestre.rp), Math.abs(ultimoTrimestre.rpv), 1)
    : 1;

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">Overview</h1>
            {ultimoMes && (
              <p className="mt-1 text-sm text-zinc-500">Período mais recente: {ultimoMes.periodo}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={ano}
              onChange={(e) => handleAnoChange(e.target.value)}
              options={[TODOS_OS_ANOS, ...anosDisponiveis].map((a) => ({ value: a, label: a }))}
            />
            <button
              onClick={() => carregar(ano === TODOS_OS_ANOS ? undefined : ano)}
              className="rounded-xl border border-white/[0.07] bg-[#111113] p-2.5 text-zinc-300 transition-colors hover:bg-white/5"
              title="Recarregar"
              aria-label="Recarregar dashboard"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}

        {/* ── KPIs do último mês ────────────────────────────────────────── */}
        {!ultimoMes ? (
          <EmptyState label="Nenhum período calculado ainda." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {KPI_CAMPOS.map(({ chave, label, Icon, accent }) => {
              const valor = ultimoMes[chave] as number;
              const varPct =
                chave === "scg" ? ultimoMes.variacao_scg_pct : variacao(valor, mesAnterior?.[chave] as number | undefined);
              return (
                <KpiTile
                  key={chave}
                  label={label}
                  Icon={Icon}
                  value={brl(valor)}
                  varPct={varPct}
                  varLabel={mesAnterior?.periodo}
                  accent={accent}
                />
              );
            })}
          </div>
        )}

        {/* ── Gráfico principal + composição ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111113] p-7">
            <SectionHeading
              title="SCG mensal"
              subtitle="Saldo consolidado da conta gráfica"
              right={
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR_SCG }} /> SCG
                </span>
              }
            />
            <div className="mt-7 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieScg} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COR_SCG} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={COR_SCG} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fill: "#52525b", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fill: "#52525b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={brlCompact}
                    width={72}
                    domain={["dataMin - dataMax * 0.15", "dataMax * 1.15"]}
                  />
                  <Tooltip content={<TooltipBRL />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <ReferenceLine y={0} stroke="#27272a" strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    name="SCG"
                    stroke={COR_SCG}
                    strokeWidth={2.5}
                    fill="url(#scgFill)"
                    dot={{ r: 3, fill: COR_SCG, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#111113] p-7">
            <SectionHeading title="Composição do SCG" subtitle={`Por categoria — ${ultimoTrimestre?.trimestre ?? "último trimestre"}`} />
            {!ultimoTrimestre ? (
              <EmptyState label="Sem dados trimestrais ainda." className="py-8" />
            ) : (
              <div className="mt-7 flex flex-col gap-6">
                <div className="space-y-5">
                  {(["cgr", "ret", "rp", "rpv"] as const).map((chave) => (
                    <CompositionRow
                      key={chave}
                      label={chave.toUpperCase()}
                      value={ultimoTrimestre[chave]}
                      maxAbs={maxAbsComposicao}
                      color={stageColors[chave]}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-4">
                  <span className="text-sm font-medium text-zinc-400">Total SCG</span>
                  <span className={`text-2xl font-bold tabular-nums ${ultimoTrimestre.total < 0 ? "text-red-400" : "text-white"}`}>
                    {brl(ultimoTrimestre.total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Gráficos secundários ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111113] p-7">
            <SectionHeading title="PMPV mensal" subtitle="Preço médio ponderado por volume (R$/m³)" />
            <div className="mt-7 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriePmpv} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fill: "#52525b", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fill: "#52525b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v.toFixed(2)}
                    width={48}
                    domain={["dataMin - 0.1", "dataMax + 0.1"]}
                  />
                  <Tooltip content={<TooltipBRL />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <Line type="monotone" dataKey="valor" name="PMPV" stroke={COR_PMPV} strokeWidth={2.5} dot={{ r: 3, fill: COR_PMPV, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#111113] p-7">
            <SectionHeading
              title="CGR vs CGF por período"
              subtitle="Comparativo mensal"
              right={
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR_CGR }} /> CGR
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR_CGF }} /> CGF
                  </span>
                </div>
              }
            />
            <div className="mt-7 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicoCompleto} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fill: "#52525b", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fill: "#52525b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={brlCompact}
                    width={72}
                  />
                  <Tooltip content={<TooltipBRL />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="cgr" name="CGR" fill={COR_CGR} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="cgf" name="CGF" fill={COR_CGF} radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
