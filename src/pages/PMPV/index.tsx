import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Save, Upload, Plus, Trash2, Database, TrendingUp, Loader2 } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { calcularPMPV, getTrimestresFiscais, importarMemoriaPMPV, salvarPMPV } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import type { EmpresaLinha, PMPVLinhaCalculo, PMPVResultado } from "../../types";

// ─── Regras de período (espelham tela_pmpv.py) ──────────────────────────────

const MESES_NOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const EMPRESAS_PADRAO = ["PETROBRAS", "GALP", "PETRORECONCAVO", "BRAVA", "ENEVA", "ORIZON"];
const ABAS = ["Mês 1", "Mês 2", "Mês 3"] as const;
type Aba = (typeof ABAS)[number];

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";
const LABEL = "text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-400";

interface Trimestre { label: string; meses: string[] }

/** Linha em edição: campos numéricos como texto para aceitar vírgula e campo vazio. */
interface LinhaEdit {
  id: number;
  empresa: string;
  molecula: string;
  transporte: string;
  logistica: string;
  qdc: string;
}

let proximoId = 1;
const linhaVazia = (empresa = ""): LinhaEdit =>
  ({ id: proximoId++, empresa, molecula: "", transporte: "", logistica: "", qdc: "" });
const linhasPadrao = () => EMPRESAS_PADRAO.map((e) => linhaVazia(e));

/** Ex.: ["Nov","Dez","Jan"], 2025 → ["Nov/2025","Dez/2025","Jan/2026"] (virada de ano). */
function periodosDe(meses: string[], ano: number): string[] {
  let anoAtual = ano;
  return meses.map((m, i) => {
    if (i > 0 && MESES_ABREV.indexOf(m) < MESES_ABREV.indexOf(meses[i - 1])) anoAtual += 1;
    return `${m}/${anoAtual}`;
  });
}

function diasDoMes(periodo: string): number {
  const [abrev, ano] = periodo.split("/");
  return new Date(Number(ano), MESES_ABREV.indexOf(abrev) + 1, 0).getDate();
}

/** Igual ao `_val` do desktop: vírgula vira ponto; vazio/inválido = 0. */
function paraNumero(txt: string): number {
  const v = parseFloat(txt.trim().replace(",", "."));
  return Number.isFinite(v) ? v : 0;
}

/** Igual ao `_limpar_str_volume` do desktop: aceita "1.234.567" ou "1234567,5". */
function paraVolume(txt: string): number {
  let limpo = txt.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const partes = limpo.split(".");
  if (partes.length > 2) {
    const ultimo = partes[partes.length - 1];
    limpo = ultimo.length === 3 ? partes.join("") : partes.slice(0, -1).join("") + "." + ultimo;
  }
  const v = parseFloat(limpo);
  return Number.isFinite(v) ? v : 0;
}

const paraTexto = (v: number) => (v ? String(v).replace(".", ",") : "");

function trimestreDoMesAtual(trimestres: Trimestre[]): string {
  const atual = MESES_ABREV[new Date().getMonth()];
  return trimestres.find((t) => t.meses.includes(atual))?.label ?? trimestres[0]?.label ?? "";
}

// ─── Componentes ────────────────────────────────────────────────────────────

function Painel({ title, subtitle, children, right }: {
  title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <section className={`${PANEL} overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Seletor<T extends string | number>({ opcoes, valor, onChange, rotulo }: {
  opcoes: T[]; valor: T; onChange: (v: T) => void; rotulo: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={String(o)}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={valor === o}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            valor === o
              ? "border border-sky-500/40 bg-white/[0.08] text-sky-300"
              : "border border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200"
          }`}
        >
          {rotulo(o)}
        </button>
      ))}
    </div>
  );
}

const INPUT = "rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 tabular-nums placeholder-zinc-600 transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-sky-500/50";
const GRADE = "grid grid-cols-[minmax(10rem,2.2fr)_repeat(3,minmax(5.5rem,1fr))_minmax(5.5rem,1fr)_minmax(7rem,1.2fr)_minmax(7.5rem,1.2fr)_2rem] items-center gap-2";

function TabelaMes({ linhas, dias, onChange }: {
  linhas: LinhaEdit[]; dias: number; onChange: (l: LinhaEdit[]) => void;
}) {
  const atualizar = (id: number, campo: keyof LinhaEdit, valor: string) =>
    onChange(linhas.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[56rem] space-y-1.5">
        <div className={`${GRADE} rounded-lg bg-white/[0.03] px-3 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-400`}>
          <span>Empresa</span>
          <span>Molécula</span>
          <span>Transporte</span>
          <span>Logística</span>
          <span className="text-right">Total R$/m³</span>
          <span>QDC (m³/dia)</span>
          <span className="text-right">Volume ({dias} dias)</span>
          <span className="sr-only">Remover</span>
        </div>
        {linhas.map((l) => {
          const total = paraNumero(l.molecula) + paraNumero(l.transporte) + paraNumero(l.logistica);
          const volume = paraVolume(l.qdc) * dias;
          return (
            <div key={l.id} className={`${GRADE} rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-1.5`}>
              <input aria-label="Empresa" value={l.empresa} onChange={(e) => atualizar(l.id, "empresa", e.target.value)} className={`w-full ${INPUT}`} />
              {(["molecula", "transporte", "logistica"] as const).map((campo) => (
                <input
                  key={campo}
                  aria-label={`${campo} — ${l.empresa}`}
                  inputMode="decimal"
                  placeholder="0,0000"
                  value={l[campo]}
                  onChange={(e) => atualizar(l.id, campo, e.target.value)}
                  className={`w-full ${INPUT}`}
                />
              ))}
              <span className="text-right text-sm font-medium tabular-nums text-sky-300">{total.toFixed(4).replace(".", ",")}</span>
              <input
                aria-label={`QDC — ${l.empresa}`}
                inputMode="decimal"
                placeholder="0"
                value={l.qdc}
                onChange={(e) => atualizar(l.id, "qdc", e.target.value)}
                className={`w-full ${INPUT} text-amber-300`}
              />
              <span className="text-right text-sm tabular-nums text-zinc-300">{volume ? num(volume) : "—"}</span>
              <button
                type="button"
                onClick={() => onChange(linhas.filter((x) => x.id !== l.id))}
                aria-label={`Remover ${l.empresa || "linha"}`}
                className="flex items-center justify-center rounded-md p-1 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
        {linhas.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-500">Nenhuma empresa neste mês. Adicione uma ou importe a Memória de Cálculo.</p>
        )}
      </div>
    </div>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────

export default function PMPVPage() {
  const [trimestres, setTrimestres] = useState<Trimestre[]>([]);
  const [trimestre, setTrimestre] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [contaGrafica, setContaGrafica] = useState("-0,0210");
  const [linhas, setLinhas] = useState<Record<Aba, LinhaEdit[]>>(() => ({
    "Mês 1": linhasPadrao(), "Mês 2": linhasPadrao(), "Mês 3": linhasPadrao(),
  }));
  const [aba, setAba] = useState<Aba>("Mês 1");
  const [resultado, setResultado] = useState<PMPVResultado | null>(null);
  const [ocupado, setOcupado] = useState<null | "calcular" | "salvar" | "importar">(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTrimestresFiscais()
      .then((t) => {
        setTrimestres(t);
        setTrimestre(trimestreDoMesAtual(t));
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar os trimestres fiscais.")));
  }, []);

  const mesesTri = useMemo(() => trimestres.find((t) => t.label === trimestre)?.meses ?? [], [trimestres, trimestre]);
  const periodos = useMemo(() => periodosDe(mesesTri, ano), [mesesTri, ano]);
  const dias = periodos.map(diasDoMes);
  const cgValida = /^[+-]?\d+([.,]\d+)?$/.test(contaGrafica.trim());
  const cg = paraNumero(contaGrafica);
  const anoValido = ano >= 2000 && ano <= 2100;

  /** Qualquer mudança nos dados invalida o resultado — evita salvar números velhos. */
  const invalidar = () => {
    setResultado(null);
    setSucesso(null);
  };

  const limparMensagens = () => {
    setErro(null);
    setAviso(null);
    setSucesso(null);
  };

  const calcular = async () => {
    limparMensagens();
    if (!cgValida) return setErro("O valor da Conta Gráfica não é um número válido. Exemplo: -0,0210");
    if (!anoValido) return setErro("O ano precisa estar entre 2000 e 2100.");

    const dados_extraidos: Record<string, PMPVLinhaCalculo[]> = {};
    const dias_config: Record<string, number> = {};
    ABAS.forEach((a, i) => {
      dias_config[a] = dias[i];
      dados_extraidos[a] = linhas[a].map((l) => ({
        empresa: l.empresa.trim(),
        molecula: paraNumero(l.molecula),
        transporte: paraNumero(l.transporte),
        logistica: paraNumero(l.logistica),
        volume: paraVolume(l.qdc),
        campos_vazios: [
          !l.molecula.trim() && "Molécula",
          !l.transporte.trim() && "Transporte",
          !l.logistica.trim() && "Logística",
        ].filter(Boolean) as string[],
      }));
    });

    setOcupado("calcular");
    try {
      const r = await calcularPMPV({
        dados_extraidos, valor_cg: cg, dias_config,
        lista_meses: MESES_NOME, idx_start: MESES_ABREV.indexOf(mesesTri[0]),
      });
      setResultado(r);
      if (r.avisos.length) setAviso(`Campos vazios considerados como 0:\n${r.avisos.map((a) => a.trim()).join("\n")}`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível calcular o PMPV."));
    } finally {
      setOcupado(null);
    }
  };

  const salvar = async () => {
    if (!resultado) return;
    limparMensagens();
    const dados_por_mes: Record<string, EmpresaLinha[]> = {};
    ABAS.forEach((a, i) => {
      dados_por_mes[MESES_NOME[MESES_ABREV.indexOf(mesesTri[i])]] = linhas[a]
        .filter((l) => l.empresa.trim())
        .map((l) => ({
          empresa: l.empresa.trim(), molecula: paraNumero(l.molecula), transporte: paraNumero(l.transporte),
          logistica: paraNumero(l.logistica), volume: paraVolume(l.qdc),
        }));
    });
    // Mesmo nome que o desktop gera (tela_pmpv.salvar).
    const nome = `PMPV_${trimestre.replace(/ /g, "_").replace(/-/g, "_")}_${ano}`;

    setOcupado("salvar");
    try {
      const { sessao_id } = await salvarPMPV({ nome, dados_por_mes, resultado, periodos });
      setSucesso(`Sessão ${nome} salva (nº ${sessao_id}). PMPV gravado em ${periodos.join(", ")} e trimestre ativo atualizado.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar a sessão."));
    } finally {
      setOcupado(null);
    }
  };

  const importar = async (arquivo: File) => {
    limparMensagens();
    setOcupado("importar");
    try {
      const r = await importarMemoriaPMPV(arquivo, periodos);
      const novas = { ...linhas };
      let importados = 0;
      ABAS.forEach((a, i) => {
        const doMes = r.meses[periodos[i]];
        if (!doMes) return;
        novas[a] = doMes.map((l) => ({
          id: proximoId++, empresa: l.empresa, molecula: paraTexto(l.molecula),
          transporte: paraTexto(l.transporte), logistica: paraTexto(l.logistica), qdc: paraTexto(l.volume),
        }));
        importados += 1;
      });
      setLinhas(novas);
      invalidar();
      if (importados === 0) setErro(`Nada foi importado.\n${r.erros.join("\n")}`);
      else if (r.erros.length) setAviso(`${importados}/3 meses importados de ${trimestre}.\n${r.erros.join("\n")}`);
      else setSucesso(`Trimestre ${trimestre}: os 3 meses foram carregados da Memória de Cálculo.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível importar a planilha."));
    } finally {
      setOcupado(null);
      if (arquivoRef.current) arquivoRef.current.value = "";
    }
  };

  const idxAba = ABAS.indexOf(aba);
  const pronto = trimestres.length > 0 && periodos.length === 3;

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">PMPV</h1>
            <p className="mt-1 text-sm text-zinc-400">Preço Médio Ponderado por Volume — cálculo trimestral</p>
          </div>
          <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-zinc-400">
            PMPV = Σ(Pᵢ·Vᵢ) / ΣVᵢ
          </span>
        </div>

        {erro && <Alert variant="error" className="whitespace-pre-line">{erro}</Alert>}
        {aviso && <Alert variant="warning" className="whitespace-pre-line">{aviso}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "PMPV do trimestre", valor: resultado && brl(resultado.pmpv, 4), sub: "R$/m³", cor: "text-sky-300" },
            { label: "Preço final", valor: resultado && brl(resultado.preco_final, 4), sub: "PMPV + Conta Gráfica, R$/m³", cor: "text-emerald-300" },
            { label: "Volume prospectivo", valor: resultado && num(resultado.vp_mensal), sub: "m³ no trimestre", cor: "text-amber-300" },
          ].map((k) => (
            <div key={k.label} className={`${PANEL} p-5`}>
              <p className={LABEL}>{k.label}</p>
              <p className={`mt-3 truncate text-[1.75rem] font-bold leading-none tracking-tight tabular-nums ${k.valor ? k.cor : "text-zinc-600"}`}>
                {k.valor ?? "—"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">{resultado ? k.sub : "Calcule para ver"}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-6 xl:col-span-8">
            <Painel title="Período de apuração" subtitle="Trimestre fiscal, ano e Conta Gráfica">
              <div className="space-y-5">
                <div>
                  <p className={`${LABEL} mb-2`}>Trimestre</p>
                  {trimestres.length ? (
                    <Seletor opcoes={trimestres.map((t) => t.label)} valor={trimestre}
                      onChange={(v) => { setTrimestre(v); invalidar(); }} rotulo={(v) => v} />
                  ) : (
                    <p className="text-sm text-zinc-500">Carregando…</p>
                  )}
                </div>
                <div>
                  <label htmlFor="ano" className={`${LABEL} mb-2 block`}>Ano</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Seletor opcoes={[ano - 1, ano, ano + 1]} valor={ano} onChange={(v) => { setAno(v); invalidar(); }} rotulo={String} />
                    <input
                      id="ano" type="number" value={ano}
                      onChange={(e) => { setAno(Number(e.target.value)); invalidar(); }}
                      className={`w-24 ${INPUT} ${anoValido ? "" : "border-red-500/50"}`}
                    />
                  </div>
                </div>
                <div>
                  <p className={`${LABEL} mb-2`}>Meses</p>
                  <div className="flex flex-wrap gap-2">
                    {periodos.map((p, i) => (
                      <span key={p} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
                        {p} <span className="text-zinc-500">· {dias[i]} dias</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="cg" className={`${LABEL} mb-2 block`}>Conta Gráfica (R$/m³)</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="cg" inputMode="decimal" value={contaGrafica}
                      onChange={(e) => { setContaGrafica(e.target.value); invalidar(); }}
                      className={`w-40 ${INPUT} text-base font-semibold ${cgValida ? "text-amber-300" : "border-red-500/50 text-red-300"}`}
                    />
                    {cgValida ? (
                      <span className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                        cg < 0 ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                      }`}>
                        <TrendingUp size={14} className={cg < 0 ? "rotate-180" : ""} />
                        {cg < 0 ? "Recuperação" : "Devolução"}
                      </span>
                    ) : (
                      <span className="text-sm text-red-300">Valor inválido (ex.: -0,0210)</span>
                    )}
                  </div>
                </div>
              </div>
            </Painel>

            <Painel
              title="Dados por mês"
              subtitle="Preços em R$/m³ e QDC em m³/dia; o volume do mês é QDC × dias."
              right={
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={arquivoRef} type="file" accept=".xlsx,.xls,.xlsm" className="hidden"
                    onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])}
                  />
                  <button
                    type="button" disabled={!pronto || ocupado !== null}
                    onClick={() => arquivoRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {ocupado === "importar" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    Importar Memória de Cálculo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLinhas({ ...linhas, [aba]: [...linhas[aba], linhaVazia()] }); invalidar(); }}
                    className="flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/15"
                  >
                    <Plus size={13} /> Empresa
                  </button>
                </div>
              }
            >
              <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Mês do trimestre">
                {ABAS.map((a, i) => (
                  <button
                    key={a} type="button" role="tab" aria-selected={aba === a} onClick={() => setAba(a)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                      aba === a ? "border border-sky-500/40 bg-white/[0.08] text-sky-300"
                        : "border border-white/[0.07] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {periodos[i] ?? a}
                  </button>
                ))}
              </div>
              <TabelaMes
                linhas={linhas[aba]} dias={dias[idxAba] ?? 30}
                onChange={(l) => { setLinhas({ ...linhas, [aba]: l }); invalidar(); }}
              />
            </Painel>
          </div>

          <div className="flex flex-col gap-6 xl:col-span-4">
            <Painel title="Calcular e salvar">
              <div className="flex flex-col gap-3">
                <button
                  type="button" onClick={calcular} disabled={!pronto || ocupado !== null}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)] transition-colors hover:bg-sky-500 disabled:opacity-50"
                >
                  {ocupado === "calcular" ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                  {ocupado === "calcular" ? "Calculando…" : "Calcular PMPV"}
                </button>
                <button
                  type="button" onClick={salvar} disabled={!resultado || ocupado !== null}
                  title={resultado ? undefined : "Calcule antes de salvar"}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                >
                  {ocupado === "salvar" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salvar sessão
                </button>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Salvar grava a sessão, o PMPV de cada mês ({periodos.join(", ") || "—"}) e define este como o trimestre ativo dos outros módulos.
                </p>
              </div>
            </Painel>

            <Painel title="Composição do preço">
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-zinc-400">PMPV</dt>
                  <dd className="font-semibold tabular-nums text-zinc-100">{resultado ? brl(resultado.pmpv, 4) : "—"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-zinc-400">Conta Gráfica</dt>
                  <dd className={`font-semibold tabular-nums ${cg < 0 ? "text-red-300" : "text-emerald-300"}`}>
                    {cgValida ? `${cg >= 0 ? "+" : ""}${brl(cg, 4)}` : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-white/[0.07] pt-3">
                  <dt className="font-medium text-zinc-200">Preço final</dt>
                  <dd className="text-lg font-bold tabular-nums text-emerald-300">{resultado ? brl(resultado.preco_final, 4) : "—"}</dd>
                </div>
              </dl>
            </Painel>

            <Painel title="Volume prospectivo por mês">
              <div className="space-y-2">
                {periodos.map((p, i) => {
                  const valor = resultado?.vp_por_mes[MESES_NOME[MESES_ABREV.indexOf(mesesTri[i])]];
                  return (
                    <div key={p} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-3.5 py-2.5">
                      <span className="flex items-center gap-2 text-sm text-zinc-400">
                        <Database size={12} className="text-sky-500/70" /> {p}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-zinc-200">{valor ? `${num(valor)} m³` : "—"}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between rounded-lg border border-sky-500/20 bg-white/[0.03] px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-sky-300">Total</span>
                  <span className="text-sm font-bold tabular-nums text-sky-300">{resultado ? `${num(resultado.vp_mensal)} m³` : "—"}</span>
                </div>
              </div>
            </Painel>
          </div>
        </div>
      </div>
    </div>
  );
}
