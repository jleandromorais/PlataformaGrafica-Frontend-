import { useState } from "react";
import { Calculator, Save, Download, Plus, Trash2, Database } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, StatCard } from "../../components/ui/Card";
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

function TabelaMes({ linhas, onChange }: { linhas: EmpresaLinha[]; onChange: (l: EmpresaLinha[]) => void }) {
  const update = (i: number, field: keyof EmpresaLinha, val: string) => {
    const next = [...linhas];
    next[i] = { ...next[i], [field]: field === "empresa" ? val : parseFloat(val) || 0 };
    onChange(next);
  };
  const remove = (i: number) => onChange(linhas.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {["Empresa","Molécula","Transporte","Logística","Total","Volume",""].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {linhas.map((l, i) => {
        const total = l.molecula + l.transporte + l.logistica;
        return (
          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center rounded-lg border border-white/8 bg-white/4 px-2 py-1">
            <input value={l.empresa} onChange={(e) => update(i, "empresa", e.target.value)}
              className="bg-[#0b1220] border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500" />
            {(["molecula","transporte","logistica"] as const).map((f) => (
              <input key={f} type="number" step="0.0001" value={l[f] || ""} onChange={(e) => update(i, f, e.target.value)}
                className="bg-[#0b1220] border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500" />
            ))}
            <div className="bg-[#0b1220] border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300 text-right">
              {total.toFixed(4)}
            </div>
            <input type="number" step="0.0000001" value={l.volume || ""} onChange={(e) => update(i, "volume", e.target.value)}
              className="bg-[#0b1220] border border-slate-700 rounded px-2 py-1.5 text-sm text-amber-300 focus:outline-none focus:ring-1 focus:ring-sky-500" />
            <button onClick={() => remove(i)} className="text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

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

  const importarMemoria = () => {
    alert("Importacao de memoria de calculo (mock).");
  };

  const calcular = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    // Mock result — substituir por: calcularPMPV({ trimestre, ano, meses, conta_grafica: parseFloat(contaGrafica) })
    setResultado({ pmpv: 1.2341, preco_final: 1.2131, vp_mensal: 142876000, vp_por_mes: { "Novembro": 47000000, "Dezembro": 48000000, "Janeiro": 47876000 } });
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,_#0b1220_0%,_#0b1120_45%,_#070b14_100%)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.9)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-2">
                <Calculator size={20} className="text-sky-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Modulo PMPV — Calculadora Trimestral</h1>
                <p className="mt-1 text-sm text-slate-400">Preco medio ponderado por volume</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Online
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                PMPV = Σ(Pi*Vi) / ΣVi
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8 flex flex-col gap-6">
            <Card
              title="Configuracao do periodo"
              subtitle="Defina trimestre, ano e conta grafica"
              accent="bg-sky-400"
              className="border border-white/10 bg-slate-950/60"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Trimestre</span>
                  {Object.keys(TRIMESTRES).map((k) => (
                    <button
                      key={k}
                      onClick={() => setTrimestre(k)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        trimestre === k
                          ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                          : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Ano</span>
                  {anoOptions.map((y) => (
                    <button
                      key={y}
                      onClick={() => setAno(y)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        ano === y
                          ? "bg-sky-500/20 text-sky-200 border border-sky-400/30"
                          : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                  <Input label="Ano manual" type="number" value={ano} onChange={(e) => setAno(+e.target.value)} className="w-28" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Meses</span>
                  {periodos.map((p) => (
                    <span key={p} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {p}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <Input label="Conta Grafica (R$)" value={contaGrafica} onChange={(e) => setContaGrafica(e.target.value)} className="w-44" />
                </div>
              </div>
            </Card>

            <Card
              title="Dados por mes"
              subtitle={`Periodo ativo: ${periodoSelecionado}`}
              accent="bg-amber-300"
              className="border border-white/10 bg-slate-950/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
                {["Mês 1","Mês 2","Mês 3"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setAbaMes(m)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      abaMes === m
                        ? "bg-sky-500/80 text-white"
                        : "border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={importarMemoria}>
                    Importar
                  </Button>
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={adicionarEmpresa}>
                    Empresa
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <TabelaMes linhas={meses[abaMes]} onChange={(l) => setMeses({ ...meses, [abaMes]: l })} />
              </div>
            </Card>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-6">
            <Card
              title="Banco de dados"
              subtitle="Sessoes salvas"
              accent="bg-sky-400"
              className="border border-white/10 bg-slate-950/60"
            >
              <div className="space-y-3">
                {periodos.map((p, idx) => {
                  const valor = resultado ? Object.values(resultado.vp_por_mes)[idx] : null;
                  return (
                    <div key={p} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Database size={14} className="text-slate-400" />
                          {p}
                        </span>
                        <span className="text-xs text-slate-500">{resultado ? "OK" : "—"}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        VP: {valor ? `${valor.toLocaleString("pt-BR")} m³` : "sem dados"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card
              title="Acoes"
              subtitle="Calcular e exportar resultados"
              accent="bg-emerald-400"
              className="border border-white/10 bg-slate-950/60"
            >
              <div className="flex flex-col gap-3">
                <Button variant="success" size="lg" loading={loading} icon={<Calculator size={16} />} onClick={calcular}>
                  Calcular PMPV
                </Button>
                <Button variant="purple" icon={<Save size={16} />} onClick={() => alert("Salvo!")} disabled={!resultado}>
                  Salvar Sessao
                </Button>
                <Button variant="primary" icon={<Download size={16} />} onClick={() => alert("Exportado!")} disabled={!resultado}>
                  Salvar PMPV Mensal
                </Button>
              </div>
            </Card>

            <Card
              title="Resumo trimestre"
              subtitle="Volumes por mes"
              accent="bg-amber-300"
              className="border border-white/10 bg-slate-950/60"
            >
              <div className="space-y-2 text-sm">
                {periodos.map((p, idx) => {
                  const valor = resultado ? Object.values(resultado.vp_por_mes)[idx] : null;
                  return (
                    <div key={p} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-300">
                      <span>{p}</span>
                      <span className="font-medium text-slate-100">{valor ? `${valor.toLocaleString("pt-BR")} m³` : "—"}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                  <span>Total</span>
                  <span className="font-semibold">
                    {resultado ? `${resultado.vp_mensal.toLocaleString("pt-BR")} m³` : "—"}
                  </span>
                </div>
              </div>
            </Card>

            <Card
              title="Indicadores"
              subtitle="PMPV e preco final"
              accent="bg-sky-400"
              className="border border-white/10 bg-slate-950/60"
            >
              <div className="space-y-3">
                {resultado ? (
                  <>
                    <StatCard label="PMPV" value={`R$ ${resultado.pmpv.toFixed(4)}`} color="text-sky-300" />
                    <StatCard label="Preco Final" value={`R$ ${resultado.preco_final.toFixed(4)}`} color="text-amber-300" />
                    <StatCard label="Volume Prospectivo" value={`${resultado.vp_mensal.toLocaleString("pt-BR")} m³`} color="text-emerald-300" />
                  </>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    Calcule o PMPV para exibir os indicadores.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
