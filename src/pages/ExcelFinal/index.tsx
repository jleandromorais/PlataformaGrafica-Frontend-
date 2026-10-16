import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { SeletorMes } from "../../components/ui/SeletorMes";
import { gerarExcelFinal, getTrimestreExcelFinal } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { salvarArquivo } from "../../utils/download";
import { MESES_ABREV, anoValido } from "../../utils/periodos";

const PANEL = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-panel";

export default function ExcelFinalPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(MESES_ABREV[hoje.getMonth()]);
  const [ano, setAno] = useState(hoje.getFullYear());
  const periodo = `${mes}/${ano}`;
  const [meses, setMeses] = useState<string[] | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const ultima = useRef(0);

  const buscarMeses = (p: string) => {
    const busca = ++ultima.current;
    getTrimestreExcelFinal(p)
      .then((r) => busca === ultima.current && setMeses(r.meses))
      .catch(() => busca === ultima.current && setMeses([]));
  };

  useEffect(() => buscarMeses(periodo), []); // eslint-disable-line react-hooks/exhaustive-deps -- só na abertura

  const mudar = (m: string, a: number) => {
    setMes(m);
    setAno(a);
    setSucesso(null);
    setMeses(null);
    if (anoValido(a)) buscarMeses(`${m}/${a}`);
  };

  const gerar = async () => {
    setErro(null);
    setSucesso(null);
    setGerando(true);
    try {
      const nome = `Excel_Final_ContaGrafica_${periodo.replace("/", "-")}.xlsx`;
      salvarArquivo(await gerarExcelFinal(periodo), nome);
      setSucesso(`${nome} baixado. Ele fica na pasta de downloads do seu navegador.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível gerar o Excel Final."));
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[900px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Excel Final</h1>
          <p className="mt-1 text-sm text-zinc-400">
            A planilha consolidada da Conta Gráfica (Módulo 9), com todos os módulos, gerada com os dados gravados.
          </p>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <section className={`${PANEL} p-5 sm:p-6`}>
          <SeletorMes mes={mes} ano={ano} onChange={mudar} />
        </section>

        <section className={`${PANEL} flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6`}>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <FileSpreadsheet size={20} />
            </span>
            <div>
              <p className="font-semibold text-white">Excel Final de {periodo}</p>
              <p className="mt-0.5 text-sm text-zinc-400">
                Resumo, SCG, PR, PV e SR de {periodo}
                {meses === null ? "…" : meses.length ? <>; PMPV do trimestre <span className="text-zinc-200">{meses.join(", ")}</span></> : ""}.
              </p>
              <p className="mt-0.5 text-sm text-zinc-400">Auditoria, CGF, RET e Conciliação trazem todos os meses gravados, agrupados por trimestre.</p>
              <p className="mt-1 text-xs text-zinc-500">Cada pessoa baixa a sua cópia, então não tem problema se outra pessoa estiver com o arquivo aberto.</p>
            </div>
          </div>
          <button type="button" onClick={gerar} disabled={gerando || !anoValido(ano)}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)] transition-colors hover:bg-sky-500 disabled:opacity-50">
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {gerando ? "Gerando…" : "Gerar e baixar"}
          </button>
        </section>
      </div>
    </div>
  );
}
