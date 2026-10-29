/** S3 — "Processar" do Painel do Ciclo: envia a pasta do trimestre para cada etapa-mês
 * com os mesmos /processar e /salvar das telas, mostra o resultado e só grava o que o
 * usuário confirmar. Parte 1: CGF e RET. Spec: _bmad-output/specs/spec-puxar-tudo-processar. */
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";
import { calcularCGFRs, getPMPVMensal, processarCGF, processarRET, salvarCGF, salvarRET } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { brl, num } from "../../utils/format";
import { COLUNAS_PADRAO_CGF } from "../../utils/cgfColunas";
import { linkDoCiclo } from "../../utils/periodoNaUrl";
import {
  NOMES_ETAPA, arquivosDaCelula, classificar, envioDaPastaDoMes, type ArquivoClassificado, type Etapa,
} from "../../utils/pastaCiclo";
import type { CGFHistoricoLinha, CGFProcessarResponse, RETHistoricoLinha, RETResultado } from "../../types";

type Estado = "pronta" | "bloqueada" | "vazia" | "parte2" | "processando" | "processada" | "erro" | "gravando" | "gravada";

interface Celula {
  etapa: Etapa;
  periodo: string;
  arquivos: ArquivoClassificado[];
  gravado: number | null;     // valor já salvo (R$), se houver
  estado: Estado;
  motivo?: string;
  avisos: string[];
  escolhida: boolean;
  valor?: number;             // resultado do processamento (R$)
  detalhe?: string;
  cgf?: { r: CGFProcessarResponse; pmpv: number };
  ret?: RETResultado;
}

const ORDEM: Etapa[] = ["auditoria", "cgf", "ret", "conciliacao"];
const PARTE1: Etapa[] = ["cgf", "ret"];
const ROTA: Record<Etapa, string> = { auditoria: "/auditoria", cgf: "/cgf", ret: "/ret", conciliacao: "/conciliacao" };

const ICONE: Partial<Record<Estado, ReactNode>> = {
  processando: <Loader2 size={15} className="animate-spin text-sky-300" aria-label="Processando" />,
  gravando: <Loader2 size={15} className="animate-spin text-sky-300" aria-label="Gravando" />,
  processada: <CheckCircle2 size={15} className="text-sky-300" aria-label="Processada" />,
  gravada: <CheckCircle2 size={15} className="text-emerald-400" aria-label="Gravada" />,
  erro: <XCircle size={15} className="text-red-300" aria-label="Erro" />,
  bloqueada: <AlertTriangle size={15} className="text-amber-300" aria-label="Bloqueada" />,
};

export function ProcessarTrimestre({ meses, caminhos, arquivos, cgf, ret, onGravado, onFechar }: {
  meses: string[];
  caminhos: string[];
  arquivos: Map<string, File>;
  cgf: CGFHistoricoLinha[];
  ret: RETHistoricoLinha[];
  onGravado: () => void;
  onFechar: () => void;
}) {
  const ano = Number(meses[0].split("/")[1]);
  const reconhecidos = useMemo(
    () => caminhos.map((c) => classificar(c, ano)).filter((x): x is ArquivoClassificado => !!x),
    [caminhos, ano],
  );
  const [celulas, setCelulas] = useState<Celula[]>(() =>
    ORDEM.flatMap((etapa) => meses.map((periodo): Celula => {
      const { pastas, zipsSoltos } = arquivosDaCelula(reconhecidos, etapa, periodo);
      const lista = [...pastas, ...zipsSoltos];
      const salvo = etapa === "cgf" ? cgf.find((h) => h.periodo === periodo)?.cgf_rs
        : etapa === "ret" ? ret.find((h) => h.periodo === periodo)?.ret_gravado : undefined;
      const gravado = salvo ?? null;
      const base = { etapa, periodo, arquivos: lista, gravado, avisos: [], escolhida: false };
      if (!PARTE1.includes(etapa)) return { ...base, estado: "parte2" };
      if (!lista.length) return { ...base, estado: "vazia" };
      if (etapa === "cgf" && !pastas.length) {
        return { ...base, estado: "bloqueada", motivo: "Só há .zip: extraia as planilhas na pasta do mês." };
      }
      return { ...base, estado: "pronta", escolhida: gravado === null };
    })),
  );
  const [fase, setFase] = useState<"previa" | "processando" | "revisao" | "gravando" | "fim">("previa");
  const parar = useRef(false);

  const atualizar = (alvo: Celula, mudanca: Partial<Celula>) =>
    setCelulas((cs) => cs.map((c) => (c.etapa === alvo.etapa && c.periodo === alvo.periodo ? { ...c, ...mudanca } : c)));
  const alternar = (c: Celula) => atualizar(c, { escolhida: !c.escolhida });
  const files = (c: Celula, relativo: boolean) => c.arquivos.flatMap((a) => {
    const f = arquivos.get(a.caminho);
    return f ? [{ arquivo: f, caminho: relativo ? envioDaPastaDoMes(a).caminho : f.name }] : [];
  });

  async function processarUma(c: Celula): Promise<Partial<Celula>> {
    if (c.etapa === "cgf") {
      const pmpv = (await getPMPVMensal(c.periodo).catch(() => ({ pmpv: 0 }))).pmpv || 0;
      if (!pmpv) return { estado: "bloqueada", motivo: `Falta o PMPV de ${c.periodo}: salve o PMPV do trimestre antes.` };
      const r = await processarCGF(files(c, false).map((x) => x.arquivo), COLUNAS_PADRAO_CGF);
      const erros = (r.problemas ?? []).filter((p) => p.gravidade === "erro");
      const avisos = [
        ...(r.problemas ?? []).filter((p) => p.gravidade === "aviso").map((p) => p.mensagem),
        ...(r.volume_devolucoes ? [] : ["Devoluções = 0: confira se a planilha de devoluções entrou."]),
        ...(r.periodo_detectado && r.periodo_detectado !== c.periodo ? [`As planilhas parecem ser de ${r.periodo_detectado}.`] : []),
      ];
      if (erros.length) return { estado: "erro", motivo: erros.map((p) => p.mensagem).join(" "), avisos };
      const rs = await calcularCGFRs(c.periodo, r.volume_final, pmpv);
      return {
        estado: "processada", cgf: { r, pmpv }, valor: rs.cgf_rs ?? undefined, avisos,
        detalhe: `VF ${num(r.volume_final, 0)} m³ = faturado ${num(r.volume_faturado, 0)} − devoluções ${num(r.volume_devolucoes, 0)} · PMPV ${num(pmpv, 4)}`,
      };
    }
    // RET: envia a partir da pasta do mês, como se ela tivesse sido escolhida na tela RET.
    const envio = files(c, true);
    const raiz = c.arquivos[0] ? envioDaPastaDoMes(c.arquivos[0]).raiz : "";
    const r = await processarRET(envio, raiz);
    const outros = r.meses.filter((m) => m.periodo !== c.periodo).map((m) => m.periodo);
    const mes = r.meses.find((m) => m.periodo === c.periodo);
    const avisos = r.ocr_disponivel ? [] : ["PDF de imagem não é lido neste servidor (sem OCR): confira o total."];
    if (outros.length || !mes) {
      return { estado: "erro", avisos, motivo: `Os documentos foram lidos como ${outros.join(", ") || "outro mês"}, não ${c.periodo}. Use a tela RET.` };
    }
    return {
      estado: "processada", ret: r, valor: mes.ret, avisos,
      detalhe: `${mes.qtd_documentos} documento(s) · EAT ${brl(mes.eat_bruto)} · EC ${brl(mes.ec_docs_total)}`,
    };
  }

  async function processar() {
    parar.current = false;
    setFase("processando");
    for (const c of celulas.filter((x) => x.escolhida && x.estado === "pronta")) {
      if (parar.current) break;
      atualizar(c, { estado: "processando", motivo: undefined });
      try {
        atualizar(c, await processarUma(c));
      } catch (e) {
        atualizar(c, { estado: "erro", motivo: mensagemDeErro(e, `Não foi possível processar ${NOMES_ETAPA[c.etapa]} de ${c.periodo}.`) });
      }
    }
    setFase("revisao");
  }

  async function gravar() {
    parar.current = false;
    setFase("gravando");
    for (const c of celulas.filter((x) => x.escolhida && x.estado === "processada")) {
      if (parar.current) break;
      atualizar(c, { estado: "gravando" });
      try {
        if (c.cgf) {
          const { r, pmpv } = c.cgf;
          const s = await salvarCGF({
            periodo: c.periodo, pmpv, volume_faturado: r.volume_faturado, volume_canceladas: r.volume_canceladas,
            volume_devolucoes: r.volume_devolucoes, volume_consumo_proprio: r.volume_consumo_proprio, volume_final: r.volume_final,
          });
          atualizar(c, { estado: "gravada", valor: s.cgf_rs });
        } else if (c.ret) {
          const s = await salvarRET(c.ret.documentos, c.periodo);
          atualizar(c, { estado: "gravada", valor: s.find((x) => x.periodo === c.periodo)?.ret ?? c.valor });
        }
      } catch (e) {
        atualizar(c, { estado: "erro", motivo: mensagemDeErro(e, `Não foi possível gravar ${NOMES_ETAPA[c.etapa]} de ${c.periodo}.`) });
      }
    }
    setFase("fim");
    onGravado();
  }

  const ativas = celulas.filter((c) => PARTE1.includes(c.etapa));
  const aProcessar = ativas.filter((c) => c.escolhida && c.estado === "pronta").length;
  const aGravar = ativas.filter((c) => c.escolhida && c.estado === "processada").length;
  const ocupado = fase === "processando" || fase === "gravando";
  const gravadas = ativas.filter((c) => c.estado === "gravada").length;
  const comErro = ativas.filter((c) => c.estado === "erro" || c.estado === "bloqueada").length;

  return (
    <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
      <h3 className="text-base font-semibold text-white">
        {fase === "previa" ? `Processar ${meses[0]} a ${meses[2]}` : fase === "fim" ? "Pronto" : fase === "revisao" ? "Confira antes de gravar" : "Processando…"}
      </h3>
      <p className="mt-1 text-sm text-zinc-400">
        {fase === "previa" && "Escolha o que enviar. Nada é gravado agora: depois de processar, você confere e decide o que gravar."}
        {fase === "processando" && "Uma etapa-mês por vez. Nada foi gravado ainda."}
        {fase === "revisao" && "Compare com o que já está gravado. Desmarque o que não quiser gravar."}
        {fase === "gravando" && "Gravando o que você confirmou…"}
        {fase === "fim" && `${gravadas} gravada(s)${comErro ? ` · ${comErro} com problema (veja abaixo)` : ""}. As etapas do ciclo foram atualizadas.`}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-white/[0.03] text-[0.7rem] text-zinc-400">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Etapa · mês</th>
              <th className="px-3 py-2 text-right font-semibold">Arquivos</th>
              <th className="px-3 py-2 text-right font-semibold">Já gravado</th>
              <th className="px-3 py-2 text-right font-semibold">Resultado</th>
              <th className="px-3 py-2 text-left font-semibold">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {celulas.map((c) => {
              const podeMarcar = !ocupado && fase !== "fim" &&
                ((fase === "previa" && c.estado === "pronta") || (fase === "revisao" && c.estado === "processada"));
              const regrava = c.escolhida && c.gravado !== null && c.estado !== "gravada";
              return (
                <tr key={`${c.etapa}-${c.periodo}`} className={c.estado === "parte2" ? "text-zinc-500" : ""}>
                  <td className="px-3 py-2">
                    <label className={`flex items-center gap-2 ${podeMarcar ? "cursor-pointer" : ""}`}>
                      <input type="checkbox" checked={c.escolhida} disabled={!podeMarcar} onChange={() => alternar(c)}
                        className="h-4 w-4 accent-marinho disabled:opacity-40" aria-label={`${NOMES_ETAPA[c.etapa]} ${c.periodo}`} />
                      <span className={c.estado === "parte2" ? "" : "text-zinc-100"}>{NOMES_ETAPA[c.etapa].split(" (")[0]} · {c.periodo}</span>
                    </label>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.arquivos.length || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{c.gravado === null ? "—" : brl(c.gravado)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-100">{c.valor === undefined ? "—" : brl(c.valor)}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-start gap-1.5">
                      {ICONE[c.estado] ?? <CircleDashed size={15} className="text-zinc-500" aria-hidden />}
                      <span>
                        {c.estado === "parte2" && (
                          <>Parte 2 do Processar. Por enquanto, <Link className="text-sky-300 underline"
                            to={linkDoCiclo(ROTA[c.etapa], meses[0], { chave: "periodo", valor: c.periodo })}>pela tela</Link>.</>
                        )}
                        {c.estado === "vazia" && "Nenhum arquivo deste mês na pasta."}
                        {c.estado === "pronta" && (regrava ? "Vai substituir o valor já gravado." : c.gravado !== null ? "Já gravado: marque para refazer." : "Pronta para enviar.")}
                        {c.estado === "processando" && "Processando…"}
                        {c.estado === "processada" && (regrava ? "Processada · vai substituir o gravado ao gravar." : "Processada · não gravada.")}
                        {c.estado === "gravando" && "Gravando…"}
                        {c.estado === "gravada" && "Gravada."}
                        {(c.estado === "erro" || c.estado === "bloqueada") && <span className="text-amber-200">{c.motivo}</span>}
                        {c.detalhe && <span className="block text-xs text-zinc-500">{c.detalhe}</span>}
                        {c.avisos.map((a) => <span key={a} className="block text-xs text-amber-200">⚠ {a}</span>)}
                        {c.estado === "bloqueada" && c.etapa === "cgf" && (
                          <Link className="block text-xs text-sky-300 underline"
                            to={linkDoCiclo(ROTA.cgf, meses[0], { chave: "periodo", valor: c.periodo })}>Fazer agora</Link>
                        )}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {fase === "previa" && (
          <button type="button" onClick={processar} disabled={!aProcessar}
            className="rounded-xl bg-marinho px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-50">
            Processar {aProcessar} etapa(s)-mês
          </button>
        )}
        {fase === "revisao" && (
          <button type="button" onClick={gravar} disabled={!aGravar}
            className="rounded-xl bg-marinho px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-50">
            Gravar {aGravar} etapa(s)-mês
          </button>
        )}
        {ocupado && (
          <button type="button" onClick={() => { parar.current = true; }}
            className="rounded-xl border border-white/[0.15] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.05]">
            Parar depois desta
          </button>
        )}
        {!ocupado && (
          <button type="button" onClick={onFechar} className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white">
            {fase === "fim" ? "Fechar" : "Cancelar"}
          </button>
        )}
      </div>
    </div>
  );
}
