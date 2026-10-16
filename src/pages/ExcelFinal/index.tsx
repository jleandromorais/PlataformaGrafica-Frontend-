import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { gerarExcelFinalGeral, getCoberturaExcelFinal } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { salvarArquivo } from "../../utils/download";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";

type Cobertura = { anos: string[]; periodos: string[]; total: number };

export default function ExcelFinalPage() {
  const [cobertura, setCobertura] = useState<Cobertura | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

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
                Dashboard, Resumo, PMPV, Auditoria, RET, Conciliação, CGF, RPV, SCG, SR, PR e PV de todos os períodos gravados.
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
