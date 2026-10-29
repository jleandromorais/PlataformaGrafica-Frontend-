import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "../../components/ui/EmptyState";
import { brl, brlCompact, num } from "../../utils/format";
import { getDashEmpresas, getDashRet, getDashVolumes } from "../../api";
import type { DashEmpresasResponse, DashRetResponse, DashVolumesResponse } from "../../types";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const AXIS_TICK = { fill: "var(--chart-eixo)", fontSize: 11 };
const GRID_STROKE = "var(--chart-grade)";
const SUPERFICIE = "var(--chart-superficie)"; // cor do painel: serve de vão entre segmentos empilhados

// Paleta categórica validada (modo escuro), na ordem fixa dos slots 1-3.
// "Outros" fica em cinza para nunca competir com um tipo nomeado.
const CORES_RET = ["var(--chart-azul)", "var(--chart-laranja)", "var(--chart-teal)"];
const COR_OUTROS = "var(--chart-eixo)";
const COR_EMPRESA = "var(--chart-azul)";
const COR_VOLUME = "var(--chart-teal)";

const corDoTipo = (tipo: string, tipos: string[]) =>
  tipo === "Outros" ? COR_OUTROS : CORES_RET[tipos.indexOf(tipo)] ?? COR_OUTROS;

const m3Compacto = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)} mil`;
  return num(v);
};

// ─── Agrupamento Mensal / Trimestral / Anual ────────────────────────────────
type Agrupamento = "mes" | "trimestre" | "ano";
type Trimestre = { label: string; meses: string[] };
type ComMeses<T> = T & { qtd_meses: number };

const AGRUPAMENTOS: { valor: Agrupamento; rotulo: string; unidade: string }[] = [
  { valor: "mes", rotulo: "Mensal", unidade: "mês" },
  { valor: "trimestre", rotulo: "Trimestral", unidade: "trimestre" },
  { valor: "ano", rotulo: "Anual", unidade: "ano" },
];

/** Grupo de um período "Mmm/AAAA": o próprio mês, o trimestre civil
 *  ("Jan - Mar/2026", como CGF e RET na planilha) ou o ano ("2026"). */
function grupoDoPeriodo(periodo: string, agrupamento: Agrupamento, trimestres: Trimestre[]) {
  if (agrupamento === "mes") return periodo;
  const [mes, ano] = periodo.split("/");
  if (agrupamento === "ano") return ano;
  const tri = trimestres.find((t) => t.meses.includes(mes));
  return tri ? `${tri.label}/${ano}` : periodo;
}

/** Soma os meses de cada grupo, na ordem em que chegam (a API já manda em ordem cronológica). */
function agrupar<T extends { periodo: string }>(
  meses: T[], agrupamento: Agrupamento, trimestres: Trimestre[], somar: (a: T, b: T) => T,
): ComMeses<T>[] {
  const grupos = new Map<string, ComMeses<T>>();
  for (const m of meses) {
    const periodo = grupoDoPeriodo(m.periodo, agrupamento, trimestres);
    const atual = grupos.get(periodo);
    grupos.set(periodo, atual
      ? { ...somar(atual, m), periodo, qtd_meses: atual.qtd_meses + 1 }
      : { ...m, periodo, qtd_meses: 1 });
  }
  return [...grupos.values()];
}

function SeletorAgrupamento({ valor, onChange, semTrimestres }: {
  valor: Agrupamento; onChange: (v: Agrupamento) => void; semTrimestres: boolean;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5" role="group" aria-label="Agrupar por">
      {AGRUPAMENTOS.map((a) => (
        <button
          key={a.valor}
          type="button"
          onClick={() => onChange(a.valor)}
          aria-pressed={valor === a.valor}
          disabled={a.valor === "trimestre" && semTrimestres}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${
            valor === a.valor ? "bg-white/[0.08] text-sky-300" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}

const unidadeDe = (a: Agrupamento) => AGRUPAMENTOS.find((x) => x.valor === a)!.unidade;
const mesesComDados = (n: number) => `${n} ${n === 1 ? "mês" : "meses"}`;

function useCarregar<T>(buscar: (ano?: string) => Promise<T>, ano?: string) {
  const [dados, setDados] = useState<T | null>(null);
  const [falhou, setFalhou] = useState(false);
  const ultima = useRef(0);
  useEffect(() => {
    const chamada = ++ultima.current;
    buscar(ano)
      .then((d) => chamada === ultima.current && (setDados(d), setFalhou(false)))
      .catch(() => chamada === ultima.current && setFalhou(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `buscar` é uma constante do módulo
  }, [ano]);
  return { dados, falhou };
}

function Painel({ titulo, subtitulo, legenda, acao, children }: {
  titulo: string; subtitulo: string; legenda?: ReactNode; acao?: ReactNode; children: ReactNode;
}) {
  return (
    <div className={`${PANEL} p-5 sm:p-7`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{titulo}</h2>
          <p className="mt-0.5 text-sm text-zinc-400">{subtitulo}</p>
        </div>
        {(acao || legenda) && (
          <div className="flex flex-col items-end gap-2">
            {acao}
            {legenda}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Vazio({ carregando, falhou }: { carregando: boolean; falhou: boolean }) {
  if (carregando && !falhou) return <div className="mt-6 h-64 animate-pulse rounded-xl bg-white/[0.03]" aria-hidden />;
  return (
    <EmptyState
      label={falhou ? "Não foi possível carregar este painel." : "Sem dados gravados para este período."}
      className="mt-4 py-10"
    />
  );
}

function TooltipCaixa({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-raised px-3.5 py-2.5 text-xs shadow-[0_8px_24px_-8px_rgba(16,39,89,0.25)]">
      <p className="mb-1.5 font-medium text-zinc-300">{titulo}</p>
      <div className="space-y-0.5 tabular-nums text-zinc-400">{children}</div>
    </div>
  );
}

const Linha = ({ cor, rotulo, valor }: { cor?: string; rotulo: string; valor: string }) => (
  <p className="flex items-center justify-between gap-6">
    <span className="flex items-center gap-1.5">
      {cor && <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: cor }} />}
      {rotulo}
    </span>
    <span className="font-semibold text-zinc-100">{valor}</span>
  </p>
);

function TabelaDados({ colunas, linhas }: { colunas: string[]; linhas: string[][] }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300">Ver como tabela</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-xs">
          <thead className="text-[0.68rem] text-zinc-500">
            <tr>{colunas.map((c, i) => <th key={c} className={`px-2 py-2 font-semibold ${i ? "text-right" : "text-left"}`}>{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {linhas.map((l) => (
              <tr key={l[0]}>{l.map((c, i) => <td key={i} className={`px-2 py-1.5 tabular-nums ${i ? "text-right text-zinc-300" : "text-zinc-200"}`}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// ─── 1. CGR por empresa ──────────────────────────────────────────────────────
function PainelEmpresas({ ano }: { ano?: string }) {
  const { dados, falhou } = useCarregar<DashEmpresasResponse>(getDashEmpresas, ano);
  const vazio = !dados || dados.empresas.length === 0;
  return (
    <Painel
      titulo="CGR por empresa"
      subtitulo={dados && !vazio ? `CGR líquido total ${brl(dados.total_cgr_liquido)}` : "CGR líquido gravado na Auditoria"}
    >
      {vazio ? (
        <Vazio carregando={dados === null} falhou={falhou} />
      ) : (
        <>
          <div className="mt-6" style={{ height: Math.max(180, dados.empresas.length * 52 + 24) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.empresas} layout="vertical" margin={{ top: 4, right: 88, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="empresa" tick={{ ...AXIS_TICK, fontSize: 12, fill: "var(--chart-rotulo)" }} tickLine={false} axisLine={false} width={112} />
                <Tooltip
                  cursor={{ fill: "var(--chart-cursor-area)" }}
                  content={({ active, payload }) => {
                    const e = payload?.[0]?.payload as DashEmpresasResponse["empresas"][number] | undefined;
                    if (!active || !e) return null;
                    return (
                      <TooltipCaixa titulo={e.empresa}>
                        <Linha rotulo="CGR líquido" valor={brl(e.cgr_liquido)} />
                        <Linha rotulo="Valor das notas" valor={brl(e.valor_total)} />
                        <Linha rotulo="ICMS" valor={brl(e.icms)} />
                        <Linha rotulo="PIS/COFINS" valor={brl(e.pis_cofins)} />
                        <Linha rotulo="Notas" valor={`${e.notas} (${e.nfe} NF-e · ${e.cte} CT-e)`} />
                      </TooltipCaixa>
                    );
                  }}
                />
                <Bar dataKey="cgr_liquido" name="CGR líquido" fill={COR_EMPRESA} radius={[0, 4, 4, 0]} maxBarSize={26}>
                  <LabelList dataKey="cgr_liquido" position="right" formatter={(v) => brlCompact(Number(v))} fill="var(--chart-rotulo-forte)" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <TabelaDados
            colunas={["Empresa", "CGR líquido", "ICMS", "PIS/COFINS", "Notas"]}
            linhas={dados.empresas.map((e) => [e.empresa, brl(e.cgr_liquido), brl(e.icms), brl(e.pis_cofins), String(e.notas)])}
          />
        </>
      )}
    </Painel>
  );
}

// ─── 2. Encargos RET por tipo ────────────────────────────────────────────────
function PainelRet({ ano, trimestres }: { ano?: string; trimestres: Trimestre[] }) {
  const { dados, falhou } = useCarregar<DashRetResponse>(getDashRet, ano);
  const [agrupamento, setAgrupamento] = useState<Agrupamento>("mes");
  const vazio = !dados || dados.meses.length === 0;
  const grupos = vazio ? [] : agrupar(dados.meses, agrupamento, trimestres, (a, b) => ({
    periodo: a.periodo,
    total: a.total + b.total,
    por_tipo: Object.fromEntries(
      [...new Set([...Object.keys(a.por_tipo), ...Object.keys(b.por_tipo)])]
        .map((t) => [t, (a.por_tipo[t] ?? 0) + (b.por_tipo[t] ?? 0)]),
    ),
  }));
  const serie = grupos.map((m) => ({ periodo: m.periodo, total: m.total, qtd_meses: m.qtd_meses, ...m.por_tipo }));
  return (
    <Painel
      titulo="Encargos RET por tipo"
      subtitulo={dados && !vazio ? `Total ${brl(dados.total)}` : `Valor das notas de débito por ${unidadeDe(agrupamento)}`}
      acao={<SeletorAgrupamento valor={agrupamento} onChange={setAgrupamento} semTrimestres={trimestres.length === 0} />}
      legenda={
        dados && !vazio ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            {dados.tipos.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: corDoTipo(t, dados.tipos) }} /> {t}
              </span>
            ))}
          </div>
        ) : undefined
      }
    >
      {vazio ? (
        <Vazio carregando={dados === null} falhou={falhou} />
      ) : (
        <>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="periodo" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={brlCompact} width={72} />
                <Tooltip
                  cursor={{ fill: "var(--chart-cursor-area)" }}
                  content={({ active, payload, label }) => {
                    const linha = payload?.[0]?.payload as Record<string, number> | undefined;
                    if (!active || !linha) return null;
                    return (
                      <TooltipCaixa titulo={String(label)}>
                        {dados.tipos.map((t) => (
                          <Linha key={t} cor={corDoTipo(t, dados.tipos)} rotulo={t} valor={brl(linha[t] ?? 0)} />
                        ))}
                        <div className="my-1 border-t border-white/10" />
                        <Linha rotulo="Total" valor={brl(linha.total)} />
                        {agrupamento !== "mes" && <Linha rotulo="Meses com dados" valor={mesesComDados(linha.qtd_meses)} />}
                      </TooltipCaixa>
                    );
                  }}
                />
                {dados.tipos.map((t, i) => (
                  <Bar
                    key={t}
                    dataKey={t}
                    name={t}
                    stackId="ret"
                    fill={corDoTipo(t, dados.tipos)}
                    stroke={SUPERFICIE}
                    strokeWidth={2}
                    maxBarSize={44}
                    radius={i === dados.tipos.length - 1 ? [4, 4, 0, 0] : 0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <TabelaDados
            colunas={["Período", ...dados.tipos, "Total"]}
            linhas={grupos.map((m) => [m.periodo, ...dados.tipos.map((t) => brl(m.por_tipo[t] ?? 0)), brl(m.total)])}
          />
        </>
      )}
    </Painel>
  );
}

// ─── 3. Volumes do CGF ───────────────────────────────────────────────────────
function PainelVolumes({ ano, trimestres }: { ano?: string; trimestres: Trimestre[] }) {
  const { dados, falhou } = useCarregar<DashVolumesResponse>(getDashVolumes, ano);
  const [agrupamento, setAgrupamento] = useState<Agrupamento>("mes");
  const vazio = !dados || dados.meses.length === 0;
  const totais = dados?.totais;
  const grupos = vazio ? [] : agrupar(dados.meses, agrupamento, trimestres, (a, b) => ({
    periodo: a.periodo,
    volume_faturado: a.volume_faturado + b.volume_faturado,
    volume_devolucoes: a.volume_devolucoes + b.volume_devolucoes,
    volume_canceladas: a.volume_canceladas + b.volume_canceladas,
    volume_consumo_proprio: a.volume_consumo_proprio + b.volume_consumo_proprio,
    volume_final: a.volume_final + b.volume_final,
  }));
  return (
    <Painel
      titulo="Volumes do CGF"
      subtitulo={`Volume final por ${unidadeDe(agrupamento)} (faturado − devoluções), em m³`}
      acao={<SeletorAgrupamento valor={agrupamento} onChange={setAgrupamento} semTrimestres={trimestres.length === 0} />}
    >
      {vazio || !totais ? (
        <Vazio carregando={dados === null} falhou={falhou} />
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {[
              ["Faturado", totais.volume_faturado],
              ["Devoluções", totais.volume_devolucoes],
              ["Canceladas", totais.volume_canceladas],
              ["Volume final", totais.volume_final],
            ].map(([rotulo, valor]) => (
              <div key={rotulo as string}>
                <dt className="text-xs font-semibold text-zinc-500">{rotulo}</dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-white">
                  {m3Compacto(valor as number)} <span className="text-xs font-normal text-zinc-500">m³</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grupos} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="periodo" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={m3Compacto} width={56} />
                <Tooltip
                  cursor={{ fill: "var(--chart-cursor-area)" }}
                  content={({ active, payload, label }) => {
                    const m = payload?.[0]?.payload as ComMeses<DashVolumesResponse["meses"][number]> | undefined;
                    if (!active || !m) return null;
                    return (
                      <TooltipCaixa titulo={String(label)}>
                        <Linha rotulo="Faturado" valor={`${num(m.volume_faturado, 2)} m³`} />
                        <Linha rotulo="Devoluções" valor={`${num(m.volume_devolucoes, 2)} m³`} />
                        <Linha cor={COR_VOLUME} rotulo="Volume final" valor={`${num(m.volume_final, 2)} m³`} />
                        {agrupamento !== "mes" && <Linha rotulo="Meses com dados" valor={mesesComDados(m.qtd_meses)} />}
                      </TooltipCaixa>
                    );
                  }}
                />
                <Bar dataKey="volume_final" name="Volume final" fill={COR_VOLUME} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <TabelaDados
            colunas={["Período", "Faturado (m³)", "Devoluções (m³)", "Volume final (m³)"]}
            linhas={grupos.map((m) => [m.periodo, num(m.volume_faturado, 2), num(m.volume_devolucoes, 2), num(m.volume_final, 2)])}
          />
        </>
      )}
    </Painel>
  );
}

/** Painéis extras do Dashboard. `ano` segue o filtro da página (vazio = todos);
 *  `trimestresCivis` vem de /config/trimestres-civis (vazio = sem "Trimestral"). */
export function PaineisExtras({ ano, trimestresCivis }: { ano?: string; trimestresCivis: Trimestre[] }) {
  return (
    <>
      <PainelEmpresas ano={ano} />
      <div className="grid grid-cols-1 gap-4 lg:gap-5 xl:grid-cols-2">
        <PainelRet ano={ano} trimestres={trimestresCivis} />
        <PainelVolumes ano={ano} trimestres={trimestresCivis} />
      </div>
    </>
  );
}
