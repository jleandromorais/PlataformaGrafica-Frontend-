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
    <div className="rounded-t-xl bg-gradient-to-r from-[#0d2444] to-[#0f3060] px-5 py-3 border-b border-[#1a4a8a]/40">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[11px] text-sky-300/60">{subtitle}</p>}
    </div>
  );
}

function ArpeCard({ title, subtitle, children, className = "" }: {
  title?: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#1a4a8a]/30 shadow-[0_4px_24px_-6px_rgba(0,40,120,0.5)] overflow-hidden ${className}`}>
      {title && <SectionHeader title={title} subtitle={subtitle} />}
      <div className="bg-[#071428]/80 p-5">{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent = "sky", positive }: {
  label: string; value: string; sub?: string; accent?: "sky" | "amber" | "emerald" | "red"; positive?: boolean;
}) {
  const colors = {
    sky:     { bg: "from-[#0d2444] to-[#0f3060]", val: "text-sky-300",     border: "border-sky-500/20" },
    amber:   { bg: "from-[#2a1a00] to-[#3a2400]", val: "text-amber-300",   border: "border-amber-500/20" },
    emerald: { bg: "from-[#012a1a] to-[#013a25]", val: "text-emerald-300", border: "border-emerald-500/20" },
    red:     { bg: "from-[#2a0808] to-[#3a0c0c]", val: "text-red-300",     border: "border-red-500/20" },
  };
  const c = colors[accent];
  return (
    <div className={`rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} p-4 flex flex-col gap-1`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className={`text-2xl font-extrabold tabular-nums ${c.val}`}>{value}</span>
      {sub && (
        <span className={`text-xs font-medium ${positive === undefined ? "text-slate-500" : positive ? "text-emerald-400" : "text-red-400"}`}>
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
        <div className="w-px h-3 bg-sky-500/40" />
        <div className="border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-sky-500/40 h-0 w-0" />
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

  const inputCls = "w-full bg-[#0b1a30] border border-[#1a4a8a]/40 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/60 transition-colors";

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_auto] gap-2 rounded-lg bg-[#0d2444]/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300/80">
        {["Empresa","Molécula","Transporte","Logística","Total","Volume (m³)",""].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {linhas.map((l, i) => {
        const total = l.molecula + l.transporte + l.logistica;
        const isEven = i % 2 === 0;
        return (
          <div key={i} className={`grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_auto] gap-2 items-center rounded-lg px-2 py-1 border border-[#1a4a8a]/20 ${isEven ? "bg-[#071428]/60" : "bg-[#0a1e38]/40"}`}>
            <input value={l.empresa} onChange={(e) => update(i, "empresa", e.target.value)} className={inputCls} />
            {(["molecula","transporte","logistica"] as const).map((f) => (
              <input key={f} type="number" step="0.0001" value={l[f] || ""} onChange={(e) => update(i, f, e.target.value)} className={inputCls} />
            ))}
            <div className="rounded-lg bg-[#0d2444]/80 border border-sky-500/20 px-2 py-1.5 text-sm text-sky-300 text-right font-mono tabular-nums">
              {total.toFixed(4)}
            </div>
            <input type="number" step="0.0000001" value={l.volume || ""} onChange={(e) => update(i, "volume", e.target.value)}
              className={`${inputCls} text-amber-300 font-mono`} />
            <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors flex items-center justify-center">
              <Trash2 size={13} />
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
    <div className="relative min-h-screen bg-[#040d1a] px-4 py-6 sm:px-6 lg:px-8">
      {/* Fundo gradiente */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(14,50,120,0.25),transparent)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">

        {/* ── Header ARPE ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1a4a8a]/40 bg-gradient-to-r from-[#071428] via-[#0a1e38] to-[#071428] shadow-[0_8px_32px_-8px_rgba(0,40,120,0.6)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-sky-600 via-cyan-400 to-sky-600" />
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Logotipo simplificado ARPE */}
              <div className="flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/8 px-3 py-2">
                <div className="flex gap-0.5">
                  <div className="w-1 h-5 rounded-sm bg-sky-400" />
                  <div className="w-1 h-5 rounded-sm bg-cyan-300" />
                  <div className="w-1 h-5 rounded-sm bg-sky-500" />
                </div>
                <span className="text-sm font-black tracking-widest text-sky-200">ARPE</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Módulo PMPV</h1>
                <p className="text-xs text-sky-300/70 mt-0.5">Preço Médio Ponderado por Volume — Calculadora Trimestral</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Online
              </span>
              <span className="rounded-lg border border-sky-400/20 bg-sky-400/8 px-3 py-1 text-[11px] font-mono text-sky-300">
                PMPV = Σ(Pᵢ·Vᵢ) / ΣVᵢ
              </span>
            </div>
          </div>
        </div>

        {/* ── KPIs do Período de Apuração (estilo Excel ARPE) ─────────── */}
        {resultado && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-sky-500/25 bg-gradient-to-b from-[#0d2444] to-[#071428] p-5 text-center shadow-[0_4px_20px_-6px_rgba(0,80,200,0.4)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/70 mb-2">PMPV Trimestral</p>
              <p className="text-3xl font-extrabold tabular-nums text-sky-200">
                R$ {resultado.pmpv.toFixed(4)}
              </p>
              <p className="mt-1 text-[11px] text-sky-400/50">R$/m³</p>
            </div>
            <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-b from-[#0a2a3a] to-[#071428] p-5 text-center shadow-[0_4px_20px_-6px_rgba(0,150,200,0.3)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/70 mb-2">Preço Final</p>
              <p className="text-3xl font-extrabold tabular-nums text-cyan-200">
                R$ {resultado.preco_final.toFixed(4)}
              </p>
              <p className="mt-1 text-[11px] text-cyan-400/50">R$/m³</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-gradient-to-b from-[#2a1a00] to-[#071428] p-5 text-center shadow-[0_4px_20px_-6px_rgba(180,100,0,0.3)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70 mb-2">Volume Prospectivo</p>
              <p className="text-3xl font-extrabold tabular-nums text-amber-200">
                {(resultado.vp_mensal / 1_000_000).toFixed(3)}M
              </p>
              <p className="mt-1 text-[11px] text-amber-400/50">m³ no trimestre</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* ── Coluna Principal ─────────────────────────────────────── */}
          <div className="xl:col-span-8 flex flex-col gap-5">

            {/* Configuração do Período */}
            <ArpeCard title="Período de Apuração" subtitle="Trimestre, ano e conta gráfica">
              <div className="space-y-4">

                {/* Trimestre */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Trimestre</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(TRIMESTRES).map((k) => (
                      <button
                        key={k}
                        onClick={() => setTrimestre(k)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                          trimestre === k
                            ? "bg-[#0d2444] border border-sky-400/50 text-sky-200 shadow-[0_0_12px_-3px_rgba(56,189,248,0.4)]"
                            : "border border-[#1a4a8a]/30 bg-[#0a1e38]/50 text-slate-400 hover:text-sky-300 hover:border-sky-500/30"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ano */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Ano de Referência</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {anoOptions.map((y) => (
                      <button
                        key={y}
                        onClick={() => setAno(y)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                          ano === y
                            ? "bg-[#0d2444] border border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_-3px_rgba(34,211,238,0.3)]"
                            : "border border-[#1a4a8a]/30 bg-[#0a1e38]/50 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                    <input
                      type="number"
                      value={ano}
                      onChange={(e) => setAno(+e.target.value)}
                      className="w-24 rounded-lg border border-[#1a4a8a]/40 bg-[#0b1a30] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                    />
                  </div>
                </div>

                {/* Meses do Trimestre */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Meses do Trimestre</p>
                  <div className="flex flex-wrap gap-2">
                    {periodos.map((p) => (
                      <span key={p} className="rounded-lg border border-[#1a4a8a]/40 bg-[#0d2444]/60 px-4 py-2 text-xs font-semibold text-sky-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Conta Gráfica — Selector estilizado */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Conta Gráfica (Parcela de Recuperação)</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        value={contaGrafica}
                        onChange={(e) => setContaGrafica(e.target.value)}
                        className="w-44 rounded-lg border border-amber-400/30 bg-[#2a1a00]/60 px-4 py-2.5 text-base font-bold text-amber-300 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                      />
                    </div>
                    <div className={`flex items-center gap-2 rounded-lg px-4 py-2 border text-sm font-semibold ${
                      cgIsNegative
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex gap-2">
                  {["Mês 1","Mês 2","Mês 3"].map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => setAbaMes(m)}
                      className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                        abaMes === m
                          ? "bg-gradient-to-r from-[#0d2444] to-[#0f3060] border border-sky-400/50 text-sky-200"
                          : "border border-[#1a4a8a]/30 bg-transparent text-slate-500 hover:text-sky-300"
                      }`}
                    >
                      {periodos[idx] || m}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => alert("Importacao de memoria de calculo (mock).")}
                    className="flex items-center gap-1.5 rounded-lg border border-[#1a4a8a]/40 bg-[#0a1e38]/50 px-3 py-2 text-xs text-slate-400 hover:text-sky-300 transition-colors"
                  >
                    <Download size={13} />
                    Importar
                  </button>
                  <button
                    onClick={adicionarEmpresa}
                    className="flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-400/20 transition-colors"
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
          <div className="xl:col-span-4 flex flex-col gap-5">

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
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#1a4a8a]/40 bg-[#0a1e38]/60 py-2.5 text-sm font-semibold text-sky-300 hover:bg-[#0d2444] transition-all disabled:opacity-40"
                >
                  <Save size={14} />
                  Salvar Sessão
                </button>
                <button
                  disabled={!resultado}
                  onClick={() => alert("Exportado!")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#1a4a8a]/40 bg-[#0a1e38]/60 py-2.5 text-sm font-semibold text-slate-400 hover:text-sky-300 transition-all disabled:opacity-40"
                >
                  <Download size={14} />
                  Salvar PMPV Mensal
                </button>
              </div>
            </ArpeCard>

            {/* Resumo do Fluxo — estilo ARPE Dashboard */}
            <ArpeCard title="Fluxo de Cálculo" subtitle="Estrutura da Conta Gráfica">
              <div className="space-y-1">

                {/* Conta Gráfica */}
                <div className="rounded-lg bg-gradient-to-r from-[#0d2444] to-[#0f3060] border border-sky-500/25 px-4 py-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-400/60 mb-1">Conta Gráfica (PR)</p>
                  <p className={`text-xl font-extrabold tabular-nums ${cgIsNegative ? "text-red-300" : "text-emerald-300"}`}>
                    {cgValue >= 0 ? "+" : ""}{cgValue.toFixed(4)}
                    <span className="ml-1 text-sm font-normal text-slate-400">R$/m³</span>
                  </p>
                </div>

                <FlowConnector />

                {/* PMPV */}
                <div className="rounded-lg border border-amber-400/20 bg-[#2a1a00]/40 px-4 py-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/60 mb-1">PMPV Calculado</p>
                  <p className="text-xl font-extrabold tabular-nums text-amber-200">
                    {resultado ? `R$ ${resultado.pmpv.toFixed(4)}` : "—"}
                    {resultado && <span className="ml-1 text-sm font-normal text-slate-400">R$/m³</span>}
                  </p>
                </div>

                <FlowConnector />

                {/* Preço Final */}
                <div className="rounded-lg border border-emerald-400/20 bg-[#012a1a]/40 px-4 py-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400/60 mb-1">Preço Final (PMPV + PR)</p>
                  <p className="text-xl font-extrabold tabular-nums text-emerald-200">
                    {resultado ? `R$ ${resultado.preco_final.toFixed(4)}` : "—"}
                    {resultado && <span className="ml-1 text-sm font-normal text-slate-400">R$/m³</span>}
                  </p>
                </div>
              </div>
            </ArpeCard>

            {/* Volumes por Mês */}
            <ArpeCard title="Volumes Mensais" subtitle="Período de recuperação">
              <div className="space-y-1.5">
                {periodos.map((p, idx) => {
                  const valor = resultado ? Object.values(resultado.vp_por_mes)[idx] : null;
                  return (
                    <div key={p} className="flex items-center justify-between rounded-lg border border-[#1a4a8a]/20 bg-[#0a1e38]/40 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-sm text-slate-400">
                        <Database size={12} className="text-sky-500/60" />
                        {p}
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-200">
                        {valor ? `${(valor / 1_000_000).toFixed(3)}M m³` : "—"}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between rounded-lg border border-sky-400/25 bg-gradient-to-r from-[#0d2444]/80 to-[#0f3060]/60 px-3 py-2.5">
                  <span className="text-sm font-bold text-sky-300">Total Trimestral</span>
                  <span className="font-mono text-sm font-bold text-sky-200">
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
