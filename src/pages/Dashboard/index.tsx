import { useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowDownRight, ArrowUpRight, Briefcase, Coins, FileText, Receipt, RefreshCw, Scale, Search } from "lucide-react";
import { Select } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { brl, brlCompact } from "../../utils/format";
import { getDashboard, getTrimestresCivis } from "../../api";
import { mensagemDeErro } from "../../api/client";
import type { DashboardResponse, KpiMensal } from "../../types";
import { PaineisExtras } from "./PaineisExtras";

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
      // SCG = RPV + RET + RP. O CGR já está dentro do RPV (CGR − CGF):
      // somá-lo de novo dava um "Total SCG" de R$ 294 mi.
      resultado.push({ trimestre: `${tri.label} ${ano}`, cgr, ret, rp, rpv, total: rpv + ret + rp });
    }
  }
  return resultado;
}

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";
const AXIS_TICK = { fill: "#71717a", fontSize: 11 };
const GRID_STROKE = "rgba(255,255,255,0.05)";

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; name: string; value: number; color?: string; fill?: string }[];
  casas?: number; // PMPV usa 4 casas (R$/m³), igual ao desktop
}

const TooltipBRL = ({ active, payload, label, casas = 2 }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-raised px-3.5 py-2.5 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <p className="mb-1 font-medium text-zinc-400">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold tabular-nums" style={{ color: p.color ?? p.fill }}>
          {p.name}: {brl(p.value, casas)}
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
        {subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function KpiTile({
  label,
  Icon,
  value,
  rawValue,
  delta,
  varLabel,
  accent,
}: {
  label: string;
  Icon: typeof Search;
  value: string;
  rawValue: number;
  /** Diferença em R$ para o mês completo anterior (% engana quando o valor troca de sinal). */
  delta: number | null;
  varLabel?: string;
  accent: string;
}) {
  const isZero = rawValue === 0;
  const isNegative = rawValue < 0;
  return (
    <div className={`${PANEL} p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-colors hover:border-white/[0.14] sm:p-6`}>
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</span>
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}17`, color: accent }}
        >
          <Icon size={16} />
        </span>
      </div>
      <p
        className={`mt-4 truncate text-[1.625rem] font-bold leading-none tracking-tight tabular-nums sm:text-[1.75rem] ${
          isZero ? "text-zinc-600" : isNegative ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {delta !== null ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <span className="flex items-center gap-0.5 tabular-nums">
            {delta >= 0 ? <ArrowUpRight size={14} aria-hidden /> : <ArrowDownRight size={14} aria-hidden />}
            {delta >= 0 ? "+" : ""}{brlCompact(delta)}
          </span>
          {varLabel && <span className="font-normal text-zinc-500">vs {varLabel}</span>}
        </p>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">Sem comparativo</p>
      )}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className={`${PANEL} p-5 sm:p-6`} aria-hidden>
      <div className="flex items-center justify-between">
        <div className="h-3 w-10 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
      <div className="mt-4 h-7 w-44 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-3 h-3 w-24 animate-pulse rounded bg-white/[0.04]" />
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
  const isZero = value === 0;
  return (
    <div className={`flex items-center gap-3 ${isZero ? "opacity-40" : ""}`}>
      <span className="w-9 shrink-0 text-xs font-semibold text-zinc-400">{label}</span>
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
      <span className={`w-36 shrink-0 text-right text-[0.8125rem] font-semibold tabular-nums ${isNeg ? "text-red-400" : "text-zinc-200"}`}>
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

  const aplicar = (dados: DashboardResponse, anoFiltro?: string) => {
    setHistoricoCompleto(dados.historico);
    setUltimoMes(dados.ultimo_mes);
    setSeriePmpv(dados.serie_pmpv);
    setSerieScg(dados.serie_scg);
    if (!anoFiltro) {
      setAnosDisponiveis([...new Set(dados.historico.map((h) => h.periodo.split("/")[1]))].sort((x, y) => Number(y) - Number(x)));
    }
  };

  const ultimaBusca = useRef(0);
  const buscar = (anoFiltro?: string) => {
    const busca = ++ultimaBusca.current;
    getDashboard(anoFiltro)
      .then((dados) => busca === ultimaBusca.current && aplicar(dados, anoFiltro))
      .catch((e) => busca === ultimaBusca.current && setErro(mensagemDeErro(e, "Não foi possível carregar o dashboard.")))
      .finally(() => busca === ultimaBusca.current && setLoading(false));
  };

  const carregar = (anoFiltro?: string) => {
    setLoading(true);
    setErro(null);
    buscar(anoFiltro);
  };

  useEffect(() => {
    buscar();
    getTrimestresCivis().then(setTrimestresCivis).catch(() => setTrimestresCivis([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- só na abertura

  const handleAnoChange = (novoAno: string) => {
    setAno(novoAno);
    carregar(novoAno === TODOS_OS_ANOS ? undefined : novoAno);
  };

  // Só meses completos (com CGR e CGF): um mês só com o CGF lançado dá um
  // "SCG" de −R$ 99 mi que não significa nada.
  const mesesCompletos = useMemo(() => historicoCompleto.filter((h) => h.completo), [historicoCompleto]);
  const incompletos = historicoCompleto.filter((h) => !h.completo);
  const idxUltimo = ultimoMes ? mesesCompletos.findIndex((h) => h.periodo === ultimoMes.periodo) : -1;
  const mesAnterior = idxUltimo > 0 ? mesesCompletos[idxUltimo - 1] : undefined;

  const composicaoTrimestral = useMemo(
    () => agruparTrimestres(mesesCompletos, trimestresCivis),
    [mesesCompletos, trimestresCivis]
  );

  const ultimoTrimestre = composicaoTrimestral[composicaoTrimestral.length - 1];
  const stageColors: Record<string, string> = { cgr: COR_CGR, ret: COR_RET, rp: COR_RP, rpv: COR_RPV };
  const maxAbsComposicao = ultimoTrimestre
    ? Math.max(Math.abs(ultimoTrimestre.ret), Math.abs(ultimoTrimestre.rp), Math.abs(ultimoTrimestre.rpv), 1)
    : 1;

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 lg:gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Visão geral</h1>
            {ultimoMes && (
              <p className="mt-1 text-sm text-zinc-400">Período mais recente: <span className="font-medium text-zinc-200">{ultimoMes.periodo}</span></p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Filtrar por ano"
              value={ano}
              onChange={(e) => handleAnoChange(e.target.value)}
              options={[TODOS_OS_ANOS, ...anosDisponiveis].map((a) => ({ value: a, label: a }))}
            />
            <button
              onClick={() => carregar(ano === TODOS_OS_ANOS ? undefined : ano)}
              disabled={loading}
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-wait"
              title="Recarregar"
              aria-label="Recarregar dashboard"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {incompletos.length > 0 && ultimoMes && (
          <Alert variant="warning">
            {incompletos.map((h) => `${h.periodo} (falta ${h.pendencias.join(" e ")})`).join(", ")}{" "}
            {incompletos.length > 1 ? "estão incompletos" : "está incompleto"} e fica{incompletos.length > 1 ? "m" : ""} fora dos indicadores e do gráfico do SCG.
            Os cartões mostram {ultimoMes.periodo}, o último mês completo.
          </Alert>
        )}

        {/* ── KPIs do último mês ────────────────────────────────────────── */}
        {!ultimoMes ? (
          loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
              {KPI_CAMPOS.map(({ chave }) => <KpiSkeleton key={chave} />)}
            </div>
          ) : erro ? null : (
            <EmptyState
              label="Nenhum período calculado ainda."
              hint="Os indicadores aparecem aqui depois do primeiro cálculo mensal."
              className={`${PANEL} py-12`}
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
            {KPI_CAMPOS.map(({ chave, label, Icon, accent }) => {
              const valor = ultimoMes[chave] as number;
              const anterior = mesAnterior?.[chave] as number | undefined;
              const delta = anterior === undefined ? null : valor - anterior;
              return (
                <KpiTile
                  key={chave}
                  label={label}
                  Icon={Icon}
                  value={brl(valor)}
                  rawValue={valor}
                  delta={delta}
                  varLabel={mesAnterior?.periodo}
                  accent={accent}
                />
              );
            })}
          </div>
        )}

        {/* ── Gráfico principal + composição ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className={`${PANEL} p-5 sm:p-7`}>
            <SectionHeading
              title="SCG mensal"
              subtitle="Saldo consolidado da conta gráfica"
              right={
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR_SCG }} /> SCG
                </span>
              }
            />
            <div className="mt-6 h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieScg} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COR_SCG} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={COR_SCG} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="periodo" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={brlCompact}
                    width={88}
                    domain={["auto", "auto"]}
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

          <div className={`${PANEL} p-5 sm:p-7`}>
            <SectionHeading title="Composição do SCG" subtitle={`SCG = RPV + RET + RP — ${ultimoTrimestre?.trimestre ?? "último trimestre"}`} />
            {!ultimoTrimestre ? (
              loading ? (
                <div className="mt-7 space-y-5" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-white/[0.04]" />
                  ))}
                </div>
              ) : (
                <EmptyState label="Sem dados trimestrais ainda." className="py-12" />
              )
            ) : (
              <div className="mt-7 flex flex-col gap-6">
                <div className="space-y-5">
                  {(["rpv", "ret", "rp"] as const).map((chave) => (
                    <CompositionRow
                      key={chave}
                      label={chave.toUpperCase()}
                      value={ultimoTrimestre[chave]}
                      maxAbs={maxAbsComposicao}
                      color={stageColors[chave]}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-4 py-4">
                  <span className="text-sm font-medium text-zinc-400">Total SCG</span>
                  <span className={`text-xl font-bold tabular-nums sm:text-2xl ${ultimoTrimestre.total < 0 ? "text-red-400" : "text-white"}`}>
                    {brl(ultimoTrimestre.total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Gráficos secundários ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-2">
          <div className={`${PANEL} p-5 sm:p-7`}>
            <SectionHeading title="PMPV mensal" subtitle="Preço médio ponderado por volume (R$/m³)" />
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriePmpv} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="periodo" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v.toFixed(2).replace(".", ",")}
                    width={48}
                    domain={["dataMin - 0.1", "dataMax + 0.1"]}
                  />
                  <Tooltip content={<TooltipBRL casas={4} />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                  <Line type="monotone" dataKey="valor" name="PMPV" stroke={COR_PMPV} strokeWidth={2.5} dot={{ r: 3, fill: COR_PMPV, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${PANEL} p-5 sm:p-7`}>
            <SectionHeading
              title="CGR vs CGF por período"
              subtitle="Comparativo mensal"
              right={
                <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR_CGR }} /> CGR
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR_CGF }} /> CGF
                  </span>
                </div>
              }
            />
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicoCompleto} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="periodo" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={brlCompact}
                    width={88}
                  />
                  <Tooltip content={<TooltipBRL />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="cgr" name="CGR" fill={COR_CGR} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="cgf" name="CGF" fill={COR_CGF} radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Empresas, encargos RET e volumes (seguem o filtro de ano) ───── */}
        <PaineisExtras ano={ano === TODOS_OS_ANOS ? undefined : ano} />
      </div>
    </div>
  );
}
