import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { brl, num } from "../../utils/format";
import { mockDashboard } from "../../data/mockDashboard";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val: number = payload[0].value;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className={`mt-1 font-semibold ${val >= 0 ? "text-emerald-300" : "text-red-300"}`}>
        R$ {val.toFixed(4)}
      </p>
    </div>
  );
};

const formatSignedBrl = (value: number) => `${value < 0 ? "-" : ""}${brl(Math.abs(value))}`;

function MiniStat({ label, value, tone = "text-slate-200", helper }: { label: string; value: string; tone?: string; helper?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
      {helper && <p className="mt-1 text-[11px] text-slate-500">{helper}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const d = mockDashboard;
  const saldoCobertura = d.saldo_a_recuperar > 0 ? (d.saldo_cg_atualizado / d.saldo_a_recuperar) * 100 : 0;
  const recuperacaoMedia = d.historico_parcela.length
    ? d.historico_parcela.reduce((acc, item) => acc + item.valor, 0) / d.historico_parcela.length
    : 0;
  const ultimosMeses = d.sr_por_mes.slice(-2);

  const saldoEvolucao = d.historico_parcela.length >= 2
    ? d.historico_parcela[d.historico_parcela.length - 1].valor - d.historico_parcela[d.historico_parcela.length - 2].valor
    : 0;
  const mediaSr = d.sr_por_mes.length
    ? d.sr_por_mes.reduce((acc, item) => acc + item.valor, 0) / d.sr_por_mes.length
    : 0;
  const movimentosRecentes = d.historico_parcela.slice(-4).map((item) => ({
    periodo: item.periodo,
    valor: item.valor,
  }));

  return (
    <div className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,_#0b1220_0%,_#0b1120_45%,_#070b14_100%)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card
          accent="bg-sky-400"
          className="border border-white/10 bg-slate-950/60 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.9)]"
        >
          <div className="flex flex-col gap-6 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold tracking-[0.26em] text-sky-200">
                  ARPE
                </span>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                  {d.versao_cg}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Conta Gráfica</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Tarifa de Gás Canalizado com leitura executiva, destaques de recuperação e evolução histórica da parcela.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Apuração: <span className="font-semibold text-white">{d.periodo_apuracao}</span>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Recuperação: <span className="font-semibold text-white">{d.periodo_recuperacao}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1 xl:grid-cols-3">
              <MiniStat label="Saldo a recuperar" value={brl(d.saldo_a_recuperar)} tone="text-emerald-300" helper="Base de recomposição" />
              <MiniStat label="Parcela atual" value={`R$ ${d.parcela_recuperacao.toFixed(4)}/m³`} tone="text-amber-200" helper="Última revisão" />
              <MiniStat label="SR total" value={brl(d.sr_total)} tone="text-violet-300" helper={`${saldoCobertura.toFixed(1)}% coberto`} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Evolução do mês" value={`${saldoEvolucao >= 0 ? "+" : ""}${saldoEvolucao.toFixed(4)} R$/m³`} tone={saldoEvolucao >= 0 ? "text-emerald-300" : "text-red-300"} helper="Var. do último período" />
          <MiniStat label="Média SR" value={brl(mediaSr)} tone="text-slate-100" helper="Média simples dos meses" />
          <MiniStat label="RPV" value={formatSignedBrl(d.rpv)} tone={d.rpv >= 0 ? "text-emerald-300" : "text-red-300"} helper="Impacto negativo" />
          <MiniStat label="RET" value={brl(d.ret)} tone="text-emerald-300" helper="Impacto positivo" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Card
            title="Resumo executivo"
            subtitle="O que mais importa para leitura rápida da conta gráfica"
            accent="bg-emerald-400"
            className="xl:col-span-8 border border-white/10 bg-slate-950/60"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Saldo a recuperar</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">{brl(d.saldo_a_recuperar)}</p>
                <p className="mt-2 text-xs text-emerald-100/70">Saldo atualizado de referência para o período de apuração.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">SCG</p>
                <p className="mt-2 text-2xl font-semibold text-sky-300">{brl(d.scg)}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2"><TrendingDown size={14} className="text-red-400" />RPV</span>
                    <span className="font-medium text-red-300">{formatSignedBrl(d.rpv)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400" />RET</span>
                    <span className="font-medium text-emerald-300">{brl(d.ret)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2"><Layers size={14} className="text-cyan-400" />RP</span>
                    <span className="font-medium text-slate-200">{brl(d.rp)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200/80">SR total</p>
                <p className="mt-2 text-2xl font-semibold text-violet-300">{brl(d.sr_total)}</p>
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  {d.sr_por_mes.map((m) => (
                    <div key={m.mes} className="flex items-center justify-between rounded-lg bg-black/10 px-3 py-2">
                      <span>{m.mes}</span>
                      <span className="font-medium text-slate-100">{brl(m.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">Parcela de recuperação</p>
                <p className="mt-2 text-2xl font-semibold text-amber-200">R$ {d.parcela_recuperacao.toFixed(4)} /m³</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between rounded-lg bg-black/10 px-3 py-2">
                    <span>Vol. Prospectivo</span>
                    <span className="font-medium text-slate-100">{num(d.volume_prospectivo)} m³</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/10 px-3 py-2">
                    <span>SCG atualizado</span>
                    <span className="font-medium text-slate-100">{brl(d.saldo_cg_atualizado)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-black/10 px-3 py-2">
                    <span>Saldo remanescente</span>
                    <span className="font-medium text-slate-100">{brl(d.saldo_remanescente)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Leitura rápida"
            subtitle="Indicadores compactos do ciclo atual"
            accent="bg-amber-300"
            className="xl:col-span-4 border border-white/10 bg-slate-950/60"
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Cobertura do SCG</p>
                <p className="mt-2 text-3xl font-semibold text-white">{saldoCobertura.toFixed(1)}%</p>
                <p className="mt-2 text-sm text-slate-400">
                  {d.saldo_cg_atualizado >= d.saldo_a_recuperar ? "Cobertura integral do saldo a recuperar." : "Cobertura parcial com remanescente."}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Média histórica</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-300">R$ {recuperacaoMedia.toFixed(4)}</p>
                <p className="mt-2 text-sm text-slate-400">Média simples do histórico.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">SR por mês</p>
                <div className="mt-3 space-y-2">
                  {ultimosMeses.map((item) => (
                    <div key={item.mes} className="flex items-center justify-between text-sm text-slate-300">
                      <span>{item.mes}</span>
                      <span className="font-medium text-slate-100">{brl(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card
          title="Parcela de Recuperação (R$/m³)"
          subtitle="Histórico com referência do nível zero"
          accent="bg-sky-400"
          className="border border-white/10 bg-slate-950/60"
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-h-[320px] rounded-2xl border border-white/8 bg-black/10 p-3 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.historico_parcela} margin={{ top: 12, right: 20, left: 0, bottom: 6 }}>
                  <defs>
                    <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.12} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.25)" }} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(2)} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="valor" stroke="url(#lineFill)" strokeWidth={2.5} dot={{ r: 3, fill: "#38bdf8", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#facc15" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/8 bg-white/4 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Resumo rápido</p>
                <p className="mt-2 text-sm text-slate-300">Mar/25 marca o último valor positivo no histórico recente.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Movimentos recentes</p>
                <div className="mt-3 space-y-2">
                  {movimentosRecentes.map((item) => (
                    <div key={item.periodo} className="flex items-center justify-between text-sm text-slate-300">
                      <span>{item.periodo}</span>
                      <span className={item.valor >= 0 ? "text-emerald-300" : "text-red-300"}>
                        {item.valor.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Leitura do eixo</p>
                <p className="mt-2 text-sm text-slate-300">Linha zero separa recuperação adicional de abatimento.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
