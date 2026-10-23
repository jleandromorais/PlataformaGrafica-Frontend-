import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { gerarExcelFinalGeral, gerarMinutaNotaTecnica, getCoberturaExcelFinal } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { salvarArquivo } from "../../utils/download";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";

type Cobertura = { anos: string[]; periodos: string[]; total: number };

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Mês deslocado: ("Jun/2026", 2) → "Ago/2026". */
function desloca(p: string, n: number): string {
  const [m, a] = p.split("/");
  const t = Number(a) * 12 + MESES.indexOf(m) + n;
  return `${MESES[t % 12]}/${Math.floor(t / 12)}`;
}

const ordem = (p: string) => Number(p.split("/")[1]) * 12 + MESES.indexOf(p.split("/")[0]);

/** Ciclos com dados: trimestre civil apurado (último mês) → trimestre do PR (Jun/26 → Ago–Out/26). */
function ciclos(periodos: string[]): { ultimo: string; apurado: string; pr: string }[] {
  const fins = new Set(periodos.map((p) => desloca(p, 2 - (MESES.indexOf(p.split("/")[0]) % 3))));
  return [...fins]
    .sort((a, b) => ordem(b) - ordem(a))
    .map((fim) => ({ ultimo: fim, apurado: `${desloca(fim, -2)} a ${fim}`, pr: `${desloca(fim, 2)} a ${desloca(fim, 4)}` }));
}

export default function ExcelFinalPage() {
  const [cobertura, setCobertura] = useState<Cobertura | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [ciclo, setCiclo] = useState("");
  const [gerandoNT, setGerandoNT] = useState(false);

  useEffect(() => {
    getCoberturaExcelFinal()
      .then(setCobertura)
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível consultar os períodos gravados.")));
  }, []);

  const gerar = async () => {
    setErro(null);
    setSucesso(null);
    setGerando(true);
    try {
      const nome = "Excel_Final_ContaGrafica_Geral.xlsx";
      salvarArquivo(await gerarExcelFinalGeral(), nome);
      setSucesso(`${nome} baixado. Ele fica na pasta de downloads do seu navegador.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gerar o Excel Final."));
    } finally {
      setGerando(false);
    }
  };

  const gerarNT = async () => {
    const c = listaCiclos.find((x) => x.ultimo === (ciclo || listaCiclos[0]?.ultimo));
    if (!c) return;
    setErro(null);
    setSucesso(null);
    setGerandoNT(true);
    try {
      const [ini, , fim] = c.pr.split(" ");
      const nome = `Minuta_NT_Repasse_${ini.replace("/", "-")}_a_${fim.replace("/", "-")}.docx`;
      salvarArquivo(await gerarMinutaNotaTecnica(c.ultimo), nome);
      setSucesso(`${nome} baixado. Os trechos em amarelo são para o analista completar.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gerar a minuta da Nota Técnica."));
    } finally {
      setGerandoNT(false);
    }
  };

  const listaCiclos = cobertura ? ciclos(cobertura.periodos) : [];
  const vazio = cobertura !== null && cobertura.total === 0;
  const primeiro = cobertura?.periodos[0];
  const ultimo = cobertura?.periodos[cobertura.periodos.length - 1];

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[900px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Excel Final</h1>
          <p className="mt-1 text-sm text-zinc-400">
            A planilha consolidada da Conta Gráfica (Módulo 9), com todos os módulos e todos os anos gravados.
          </p>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <section className={`${PANEL} flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6`}>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <FileSpreadsheet size={20} />
            </span>
            <div>
              <p className="font-semibold text-white">Excel Final — Geral</p>
              <p className="mt-0.5 text-sm text-zinc-400">
                SCG, SR, PR e PV no formato dos Quadros da Nota Técnica, mais Auditoria, CGF, RET, Conciliação, PMPV e Progresso, de todos os períodos gravados.
              </p>
              <p className="mt-1 text-xs text-zinc-500">Cada pessoa baixa a sua cópia, então não tem problema se outra pessoa estiver com o arquivo aberto.</p>
            </div>
          </div>
          <button type="button" onClick={gerar} disabled={gerando || vazio}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)] transition-colors hover:bg-sky-500 disabled:opacity-50">
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {gerando ? "Gerando…" : "Gerar e baixar"}
          </button>
        </section>

        <section className={`${PANEL} flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6`}>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
              <FileText size={20} />
            </span>
            <div>
              <p className="font-semibold text-white">Nota Técnica — minuta (Word)</p>
              <p className="mt-0.5 text-sm text-zinc-400">
                No formato da NT da ARPE, com SCG, SR, PR, PV (Quadros 5 a 8) e o Anexo A do ciclo. Os trechos do analista vêm em amarelo.
              </p>
              <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                Ciclo
                <select value={ciclo || listaCiclos[0]?.ultimo || ""} onChange={(e) => setCiclo(e.target.value)}
                  disabled={!listaCiclos.length}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500/50">
                  {listaCiclos.map((c) => (
                    <option key={c.ultimo} value={c.ultimo} className="bg-[#0d0d0f]">
                      Apura {c.apurado} → PR de {c.pr}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <button type="button" onClick={gerarNT} disabled={gerandoNT || !listaCiclos.length}
            className="flex items-center gap-2 rounded-xl border border-sky-500/40 px-5 py-3 text-sm font-semibold text-sky-200 transition-colors hover:bg-sky-500/10 disabled:opacity-50">
            {gerandoNT ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {gerandoNT ? "Gerando…" : "Gerar e baixar"}
          </button>
        </section>

        <section className={`${PANEL} p-5 sm:p-6`}>
          <h2 className="text-base font-semibold text-white">O que entra no arquivo</h2>
          {cobertura === null ? (
            <p className="mt-3 text-sm text-zinc-500">Consultando os dados gravados…</p>
          ) : vazio ? (
            <p className="mt-3 text-sm text-zinc-500">Ainda não há nenhum período gravado. Calcule e salve algum módulo primeiro.</p>
          ) : (
            <>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">Anos</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-100">{cobertura.anos.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">Meses gravados</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">{cobertura.total}</dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">Intervalo</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-100">{primeiro} a {ultimo}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {cobertura.periodos.map((p) => (
                  <span key={p} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-xs tabular-nums text-zinc-300">{p}</span>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
