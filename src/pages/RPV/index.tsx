import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Minus, Save, Equal } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { SeletorMes } from "../../components/ui/SeletorMes";
import { MESES_ABREV as MESES, anoValido } from "../../utils/periodos";
import { getHistoricoRPV, getRPV, salvarRPV } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, brlEntrada, parseBRL } from "../../utils/format";
import type { RPVHistoricoLinha } from "../../types";
import { tituloDe } from "../../utils/glossario";
import { PageHeader } from "../../components/layout/PageHeader";

const PANEL = "rounded-xl border border-white/[0.07] bg-panel";
const LABEL = "text-xs font-semibold text-zinc-400";
const INPUT = "rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 tabular-nums placeholder-zinc-600 transition-colors focus:border-transparent focus:outline-none focus:ring-1 focus:ring-sky-500/50";

function corDoValor(v: number) {
  return v > 0 ? "text-emerald-300" : v < 0 ? "text-red-300" : "text-zinc-300";
}

function CampoValor({ id, titulo, origem, valor, onChange }: {
  id: string; titulo: string; origem: string; valor: string; onChange: (v: string) => void;
}) {
  const lido = parseBRL(valor);
  const invalido = valor.trim() !== "" && lido === null;
  return (
    <div className={`${PANEL} flex-1 p-5 sm:p-6`}>
      <label htmlFor={id} className="block">
        <span className="text-base font-semibold text-white">{titulo}</span>
        <span className="mt-0.5 block text-sm text-zinc-400">{origem}</span>
      </label>
      <div className="relative mt-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
        <input
          id={id} inputMode="decimal" placeholder="0,00" value={valor}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalido}
          className={`w-full ${INPUT} py-3 pl-10 text-right text-xl font-semibold ${invalido ? "border-red-500/50" : ""}`}
        />
      </div>
      <p className={`mt-2 text-xs ${invalido ? "text-red-300" : "text-zinc-500"}`}>
        {invalido ? `“${valor.trim()}” não é um valor válido. Use o formato 1.234.567,89` : lido !== null ? `Será salvo como ${brl(lido)}` : "Vazio conta como R$ 0,00"}
      </p>
    </div>
  );
}

export default function RPVPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(MESES[hoje.getMonth()]);
  const [ano, setAno] = useState(hoje.getFullYear());
  const periodo = `${mes}/${ano}`;

  const [cgr, setCgr] = useState("");
  const [cgf, setCgf] = useState("");
  const [salvo, setSalvo] = useState<{ cgr: number; cgf: number } | null>(null);
  const [existe, setExiste] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [historico, setHistorico] = useState<RPVHistoricoLinha[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const ultimaBusca = useRef(0);

  // Erro próprio: não apaga nem é apagado pelo erro de salvar/carregar o período.
  const carregarHistorico = useCallback(() => {
    getHistoricoRPV()
      .then((h) => { setHistorico(h); setErroHistorico(null); })
      .catch((e) => setErroHistorico(mensagemDeErro(e, "Não foi possível carregar o histórico do RPV.")));
  }, []);

  useEffect(carregarHistorico, [carregarHistorico]);

  /** Busca o que já está gravado no banco para o período. */
  const buscar = useCallback((p: string) => {
    const busca = ++ultimaBusca.current;
    getRPV(p)
      .then((d) => {
        if (busca !== ultimaBusca.current) return; // resposta de um período antigo
        setExiste(!!d);
        setSalvo(d ? { cgr: d.cgr, cgf: d.cgf } : null);
        setCgr(d ? brlEntrada(d.cgr) : "");
        setCgf(d ? brlEntrada(d.cgf) : "");
      })
      .catch((e) => busca === ultimaBusca.current && setErro(mensagemDeErro(e, `Não foi possível carregar ${p}.`)))
      .finally(() => busca === ultimaBusca.current && setCarregando(false));
  }, []);

  useEffect(() => buscar(periodo), []); // eslint-disable-line react-hooks/exhaustive-deps -- só o período inicial

  const mudarPeriodo = (m: string, a: number) => {
    setMes(m);
    setAno(a);
    setErro(null);
    setSucesso(null);
    if (!anoValido(a)) return;
    setCarregando(true);
    buscar(`${m}/${a}`);
  };

  const vCgr = parseBRL(cgr);
  const vCgf = parseBRL(cgf);
  const validos = (cgr.trim() === "" || vCgr !== null) && (cgf.trim() === "" || vCgf !== null);
  const nCgr = vCgr ?? 0;
  const nCgf = vCgf ?? 0;
  const rpv = nCgr - nCgf;
  const alterado = salvo ? Math.abs(salvo.cgr - nCgr) > 0.004 || Math.abs(salvo.cgf - nCgf) > 0.004 : nCgr !== 0 || nCgf !== 0;

  const salvar = async () => {
    setErro(null);
    setSucesso(null);
    if (!validos) {
      const campos = [vCgr === null && cgr.trim() && "CGR", vCgf === null && cgf.trim() && "CGF"].filter(Boolean).join(" e ");
      return setErro(`O valor de ${campos} não é válido. Corrija no campo indicado (formato 1.234.567,89) e salve de novo.`);
    }
    if (nCgr === 0 && nCgf === 0) {
      return setErro("Preencha ao menos um dos valores (CGR ou CGF). O CGR vem da Auditoria CGR e o CGF da tela CGF: se já salvou lá, o valor aparece aqui sozinho.");
    }
    setSalvando(true);
    try {
      const r = await salvarRPV(periodo, nCgr, nCgf);
      setSalvo({ cgr: nCgr, cgf: nCgf });
      setExiste(true);
      setSucesso(`${periodo} salvo: RPV = ${brl(r.rpv)}.`);
      carregarHistorico();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o RPV."));
    } finally {
      setSalvando(false);
    }
  };

  const abrirPeriodo = (p: string) => {
    const [m, a] = p.split("/");
    if (MESES.includes(m) && Number(a)) mudarPeriodo(m, Number(a));
  };

  return (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <PageHeader modulo="rpv" formula="RPV = CGR − CGF, por mês" />

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        {/* Período */}
        <section className={`${PANEL} p-5 sm:p-6`}>
          <SeletorMes
            mes={mes} ano={ano} onChange={mudarPeriodo}
            status={carregando ? (
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando {periodo}…</span>
            ) : existe ? (
              <>Valores de <span className="font-medium text-zinc-200">{periodo}</span> carregados do banco.</>
            ) : (
              <><span className="font-medium text-zinc-200">{periodo}</span> ainda não tem valores. Preencha e salve.</>
            )}
          />
        </section>

        {/* CGR − CGF = RPV */}
        <div className={`flex flex-col items-stretch gap-3 md:flex-row md:items-center ${carregando ? "opacity-60" : ""}`}>
          <CampoValor id="cgr" titulo={tituloDe("CGR")} origem="Vem da Auditoria CGR" valor={cgr} onChange={setCgr} />
          <Minus size={22} className="mx-auto shrink-0 text-zinc-500" aria-hidden />
          <CampoValor id="cgf" titulo={tituloDe("CGF")} origem="Vem da tela CGF (PMPV × volume faturado)" valor={cgf} onChange={setCgf} />
        </div>

        <section className={`${PANEL} flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <Equal size={20} className="text-zinc-500" aria-hidden />
            <div>
              <p className={LABEL}>RPV de {periodo}</p>
              <p className={`mt-1 text-3xl font-bold tracking-tight tabular-nums ${validos ? corDoValor(rpv) : "text-zinc-600"}`}>
                {validos ? brl(rpv) : "—"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {rpv > 0 ? "CGR maior que CGF" : rpv < 0 ? "CGR menor que CGF" : "CGR igual a CGF"}
                {alterado && <span className="ml-2 text-amber-300">· alterações não salvas</span>}
              </p>
            </div>
          </div>
          <button
            type="button" onClick={salvar} disabled={salvando || carregando || !alterado}
            className="flex items-center gap-2 rounded-xl bg-marinho px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-marinho-claro disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-400 disabled:shadow-none"
          >
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar {periodo}
          </button>
        </section>

        {/* Histórico */}
        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Histórico</h2>
            <p className="mt-0.5 text-sm text-zinc-400">Clique num período para abrir.</p>
          </div>
          {erroHistorico && <Alert variant="error" className="m-4 whitespace-pre-line">{erroHistorico}</Alert>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Período</th>
                  <th className="px-5 py-3 text-right font-semibold">CGR</th>
                  <th className="px-5 py-3 text-right font-semibold">CGF</th>
                  <th className="px-5 py-3 text-right font-semibold">RPV</th>
                  <th className="px-5 py-3 text-right font-semibold">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {historico.map((h) => (
                  <tr
                    key={h.periodo}
                    onClick={() => abrirPeriodo(h.periodo)}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${h.periodo === periodo ? "bg-sky-500/[0.06]" : ""}`}
                  >
                    <td className="px-5 py-2.5">
                      <button type="button" onClick={() => abrirPeriodo(h.periodo)} className="font-medium text-zinc-200 hover:text-sky-300">
                        {h.periodo}
                      </button>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.cgr)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-zinc-300">{brl(h.cgf)}</td>
                    <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${corDoValor(h.rpv)}`}>{brl(h.rpv)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-zinc-500">{h.data_atualizacao.replace("T", " ")}</td>
                  </tr>
                ))}
                {historico.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-500">Nenhum período salvo ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
