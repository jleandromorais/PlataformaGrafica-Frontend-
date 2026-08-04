import { useState } from "react";
import { Calculator, Save, Download, Plus, Trash2, Database, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/Button";
import type { EmpresaLinha, PMPVResultado } from "../../types";

const TRIMESTRES: Record<string, number[]> = {
  "Nov - Jan": [10, 11, 0],
  "Fev - Abr": [1, 2, 3],
  "Mai - Jul": [4, 5, 6],
  "Ago - Out": [7, 8, 9],
};
const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const EMPRESAS_PADRAO = ["PETROBRAS","GALP","PETRORECONCAVO","BRAVA","ENEVA","ORIZON"];

function linhaVazia(empresa = ""): EmpresaLinha {
  return { empresa, molecula: 0, transporte: 0, logistica: 0, volume: 0 };
}

function periodosTrimestre(trimestre: string, ano: number) {
  const indices = TRIMESTRES[trimestre] || [];
  let anoAtual = ano;
  return indices.map((idx, i) => {
    if (i > 0 && idx < indices[i - 1]) anoAtual += 1;
    return `${MESES_ABREV[idx]}/${String(anoAtual).slice(-2)}`;
  });
}

// ─── Sub-componentes estilizados ────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 py-4 border-b border-white/[0.07]">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}

function ArpeCard({ title, subtitle, children, className = "" }: {
  title?: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] overflow-hidden ${className}`}>
      {title && <SectionHeader title={title} subtitle={subtitle} />}
      <div className="p-6">{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent = "sky", positive }: {
  label: string; value: string; sub?: string; accent?: "sky" | "amber" | "emerald" | "red"; positive?: boolean;
}) {
  const colors = {
    sky:     "#3987e5",
    amber:   "#f59e0b",
    emerald: "#22c55e",
    red:     "#ef4444",
  };
  const c = colors[accent];
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] p-5 flex flex-col gap-1">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-white" style={{ color: c }}>{value}</span>
      {sub && (
        <span className={`text-xs font-medium ${positive === undefined ? "text-zinc-600" : positive ? "text-emerald-400" : "text-red-400"}`}>
          {sub}
        </span>
      )}
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-px h-3 bg-white/10" />
        <div className="border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/10 h-0 w-0" />
      </div>
    </div>
  );
}

function TabelaMes({ linhas, onChange }: { linhas: EmpresaLinha[]; onChange: (l: EmpresaLinha[]) => void }) {
  const update = (i: number, field: keyof EmpresaLinha, val: string) => {
    const next = [...linhas];
    next[i] = { ...next[i], [field]: field === "empresa" ? val : parseFloat(val) || 0 };
    onChange(next);
  };
  const remove = (i: number) => onChange(linhas.filter((_, idx) => idx !== i));

  const inputCls = "w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-colors";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_auto] gap-3 rounded-lg bg-white/[0.03] px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-zinc-500">
        {["Empresa","Molécula","Transporte","Logística","Total","Volume (m³)",""].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {linhas.map((l, i) => {
        const total = l.molecula + l.transporte + l.logistica;
        return (
          <div key={i} className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_auto] gap-3 items-center rounded-lg px-3 py-2 border border-white/[0.05] bg-white/[0.015]">
            <input value={l.empresa} onChange={(e) => update(i, "empresa", e.target.value)} className={inputCls} />
            {(["molecula","transporte","logistica"] as const).map((f) => (
              <input key={f} type="number" step="0.0001" value={l[f] || ""} onChange={(e) => update(i, f, e.target.value)} className={inputCls} />
            ))}
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-2 text-sm text-sky-400 text-right font-mono tabular-nums">
              {total.toFixed(4)}
            </div>
            <input type="number" step="0.0000001" value={l.volume || ""} onChange={(e) => update(i, "volume", e.target.value)}
              className={`${inputCls} text-amber-400 font-mono`} />
            <button onClick={() => remove(i)} className="text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center">
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────────────────

export default function PMPVPage() {
  const trimAtual = "Nov - Jan";
  const [trimestre, setTrimestre] = useState(trimAtual);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [contaGrafica, setContaGrafica] = useState("-0.0210");
  const [meses, setMeses] = useState<Record<string, EmpresaLinha[]>>({
    "Mês 1": EMPRESAS_PADRAO.map(linhaVazia),
    "Mês 2": EMPRESAS_PADRAO.map(linhaVazia),
    "Mês 3": EMPRESAS_PADRAO.map(linhaVazia),
  });
  const [resultado, setResultado] = useState<PMPVResultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [abaMes, setAbaMes] = useState("Mês 1");
  const periodos = periodosTrimestre(trimestre, ano);
  const mesIndex = ["Mês 1", "Mês 2", "Mês 3"].indexOf(abaMes);
  const periodoSelecionado = periodos[mesIndex] || "—";
  const anoOptions = [ano - 1, ano, ano + 1];

  const adicionarEmpresa = () => {
    setMeses((prev) => ({ ...prev, [abaMes]: [...prev[abaMes], linhaVazia()] }));
  };

  const calcular = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setResultado({
      pmpv: 1.2341,
      preco_final: 1.2131,
      vp_mensal: 142876000,
      vp_por_mes: { "Novembro": 47000000, "Dezembro": 48000000, "Janeiro": 47876000 },
    });
    setLoading(false);
  };

  const cgValue = parseFloat(contaGrafica) || 0;
  const cgIsNegative = cgValue < 0;

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">

        {/* ── Header ARPE ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-4">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold tracking-wide"
                style={{ backgroundColor: "#3987e517", color: "#3987e5" }}
              >
                CG
              </span>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Módulo PMPV</h1>
                <p className="text-xs text-zinc-500 mt-0.5">Preço Médio Ponderado por Volume — Calculadora Trimestral</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
              </span>
              <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] font-mono text-zinc-400">
                PMPV = Σ(Pᵢ·Vᵢ) / ΣVᵢ
              </span>
            </div>
          </div>
        </div>

        {/* ── KPIs do Período de Apuração ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] p-5 text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-2">PMPV Trimestral</p>
            <p className={`text-3xl font-bold tabular-nums ${resultado ? "text-sky-400" : "text-zinc-700"}`}>
              {resultado ? `R$ ${resultado.pmpv.toFixed(4)}` : "—"}
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">R$/m³</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] p-5 text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-2">Preço Final</p>
            <p className={`text-3xl font-bold tabular-nums ${resultado ? "text-cyan-400" : "text-zinc-700"}`}>
              {resultado ? `R$ ${resultado.preco_final.toFixed(4)}` : "—"}
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">R$/m³</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] p-5 text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-2">Volume Prospectivo</p>
            <p className={`text-3xl font-bold tabular-nums ${resultado ? "text-amber-400" : "text-zinc-700"}`}>
              {resultado ? `${(resultado.vp_mensal / 1_000_000).toFixed(3)}M` : "—"}
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">m³ no trimestre</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* ── Coluna Principal ─────────────────────────────────────── */}
          <div className="xl:col-span-8 flex flex-col gap-6">

            {/* Configuração do Período */}
            <ArpeCard title="Período de Apuração" subtitle="Trimestre, ano e conta gráfica">
              <div className="space-y-5">

                {/* Trimestre */}
                <div>
                  <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">Trimestre</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(TRIMESTRES).map((k) => (
                      <button
                        key={k}
                        onClick={() => setTrimestre(k)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                          trimestre === k
                            ? "bg-white/[0.08] border border-sky-500/40 text-sky-300"
                            : "border border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.14]"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ano */}
                <div>
                  <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">Ano de Referência</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {anoOptions.map((y) => (
                      <button
                        key={y}
                        onClick={() => setAno(y)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                          ano === y
                            ? "bg-white/[0.08] border border-cyan-500/40 text-cyan-300"
                            : "border border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.14]"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                    <input
                      type="number"
                      value={ano}
                      onChange={(e) => setAno(+e.target.value)}
                      className="w-24 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                    />
                  </div>
                </div>

                {/* Meses do Trimestre */}
                <div>
                  <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">Meses do Trimestre</p>
                  <div className="flex flex-wrap gap-2">
                    {periodos.map((p) => (
                      <span key={p} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-sky-400">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Conta Gráfica — Selector estilizado */}
                <div>
                  <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">Conta Gráfica (Parcela de Recuperação)</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        value={contaGrafica}
                        onChange={(e) => setContaGrafica(e.target.value)}
                        className="w-44 rounded-lg border border-amber-500/25 bg-white/[0.03] px-4 py-2.5 text-base font-bold text-amber-400 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                      />
                    </div>
                    <div className={`flex items-center gap-2 rounded-lg px-4 py-2 border text-sm font-semibold ${
                      cgIsNegative
                        ? "border-red-500/25 bg-red-500/10 text-red-400"
                        : "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                    }`}>
                      <TrendingUp size={14} className={cgIsNegative ? "rotate-180" : ""} />
                      <span>{cgIsNegative ? "Recuperação" : "Devolução"}</span>
                      <span className="font-mono">{Math.abs(cgValue).toFixed(4)} R$/m³</span>
                    </div>
                  </div>
                </div>
              </div>
            </ArpeCard>

            {/* Tabela de Dados por Mês */}
            <ArpeCard title="Dados por Mês" subtitle={`Período ativo: ${periodoSelecionado}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex gap-2">
                  {["Mês 1","Mês 2","Mês 3"].map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => setAbaMes(m)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                        abaMes === m
                          ? "bg-white/[0.08] border border-sky-500/40 text-sky-300"
                          : "border border-white/[0.07] bg-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {periodos[idx] || m}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => alert("Importacao de memoria de calculo (mock).")}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Download size={13} />
                    Importar
                  </button>
                  <button
                    onClick={adicionarEmpresa}
                    className="flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/15 transition-colors"
                  >
                    <Plus size={13} />
                    Empresa
                  </button>
                </div>
              </div>
              <TabelaMes linhas={meses[abaMes]} onChange={(l) => setMeses({ ...meses, [abaMes]: l })} />
            </ArpeCard>
          </div>

          {/* ── Coluna Lateral ───────────────────────────────────────── */}
          <div className="xl:col-span-4 flex flex-col gap-6">

            {/* Ações */}
            <ArpeCard title="Calcular e Exportar">
              <div className="flex flex-col gap-3">
                <button
                  onClick={calcular}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_-3px_rgba(14,165,233,0.5)] hover:from-sky-500 hover:to-cyan-400 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Calculando…
                    </>
                  ) : (
                    <>
                      <Calculator size={16} />
                      Calcular PMPV
                    </>
                  )}
                </button>
                <button
                  disabled={!resultado}
                  onClick={() => alert("Salvo!")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                >
                  <Save size={14} />
                  Salvar Sessão
                </button>
                <button
                  disabled={!resultado}
                  onClick={() => alert("Exportado!")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 text-sm font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                >
                  <Download size={14} />
                  Salvar PMPV Mensal
                </button>
              </div>
            </ArpeCard>

            {/* Resumo do Fluxo */}
            <ArpeCard title="Fluxo de Cálculo" subtitle="Estrutura da Conta Gráfica">
              <div className="space-y-1.5">

                {/* Conta Gráfica */}
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.07] px-4 py-3.5 text-center">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-1">Conta Gráfica (PR)</p>
                  <p className={`text-xl font-bold tabular-nums ${cgIsNegative ? "text-red-400" : "text-emerald-400"}`}>
                    {cgValue >= 0 ? "+" : ""}{cgValue.toFixed(4)}
                    <span className="ml-1 text-sm font-normal text-zinc-500">R$/m³</span>
                  </p>
                </div>

                <FlowConnector />

                {/* PMPV */}
                <div className="rounded-lg border border-white/[0.07] bg-white/[0.015] px-4 py-3.5 text-center">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-1">PMPV Calculado</p>
                  <p className="text-xl font-bold tabular-nums text-amber-400">
                    {resultado ? `R$ ${resultado.pmpv.toFixed(4)}` : "—"}
                    {resultado && <span className="ml-1 text-sm font-normal text-zinc-500">R$/m³</span>}
                  </p>
                </div>

                <FlowConnector />

                {/* Preço Final */}
                <div className="rounded-lg border border-white/[0.07] bg-white/[0.015] px-4 py-3.5 text-center">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-1">Preço Final (PMPV + PR)</p>
                  <p className="text-xl font-bold tabular-nums text-emerald-400">
                    {resultado ? `R$ ${resultado.preco_final.toFixed(4)}` : "—"}
                    {resultado && <span className="ml-1 text-sm font-normal text-zinc-500">R$/m³</span>}
                  </p>
                </div>
              </div>
            </ArpeCard>

            {/* Volumes por Mês */}
            <ArpeCard title="Volumes Mensais" subtitle="Período de recuperação">
              <div className="space-y-2">
                {periodos.map((p, idx) => {
                  const valor = resultado ? Object.values(resultado.vp_por_mes)[idx] : null;
                  return (
                    <div key={p} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-3.5 py-3">
                      <span className="flex items-center gap-2 text-sm text-zinc-500">
                        <Database size={12} className="text-sky-500/60" />
                        {p}
                      </span>
                      <span className="font-mono text-sm font-semibold text-zinc-300">
                        {valor ? `${(valor / 1_000_000).toFixed(3)}M m³` : "—"}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between rounded-lg border border-sky-500/20 bg-white/[0.03] px-3.5 py-3">
                  <span className="text-sm font-semibold text-sky-300">Total Trimestral</span>
                  <span className="font-mono text-sm font-bold text-sky-300">
                    {resultado ? `${(resultado.vp_mensal / 1_000_000).toFixed(3)}M m³` : "—"}
                  </span>
                </div>
              </div>
            </ArpeCard>

          </div>
        </div>
      </div>
    </div>
  );
}
