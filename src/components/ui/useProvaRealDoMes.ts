/** Busca a "prova real" de um mês (Auditoria, CGF, RPV...) para a página toda: KPIs,
 * fórmula preenchida e card da prova real usam a mesma resposta.
 * Proteção contra resposta fora de ordem: só vale a resposta do período atual, então clicar
 * rápido em outro mês não mistura os números. Sem setState síncrono no efeito. */
import { useEffect, useState } from "react";
import { mensagemDeErro } from "../../api/client";

export interface EstadoProva<T> {
  /** Dados a mostrar: os do mês escolhido ou, enquanto ele carrega, os do mês anterior. */
  dados: T | null;
  /** Erro do mês escolhido (só depois que a resposta dele chegou). */
  erro: string | null;
  /** Primeira carga: ainda não há nada para mostrar (aparece o esqueleto). */
  carregando: boolean;
  /** Trocou de mês e os dados na tela ainda são do mês anterior (a tela esmaece). */
  atualizando: boolean;
}

/** `buscar` precisa ser uma função estável (as de src/api são): ela entra nas dependências do efeito.
 * `chave` é o que identifica o item aberto (o período; no PMPV, o id da sessão em texto).
 * `rotulo` entra na mensagem de erro (por padrão, a própria chave). */
export function useProvaRealDoMes<T>(periodo: string | null, buscar: (periodo: string) => Promise<T>, rotulo?: string): EstadoProva<T> {
  // A última resposta, marcada com o período a que pertence (dados ou erro).
  const [resposta, setResposta] = useState<{ periodo: string; dados?: T; erro?: string } | null>(null);

  useEffect(() => {
    if (!periodo) return;
    let vigente = true;
    buscar(periodo)
      .then((dados) => { if (vigente) setResposta({ periodo, dados }); })
      .catch((e) => { if (vigente) setResposta({ periodo, erro: mensagemDeErro(e, `Não foi possível montar a prova real de ${rotulo ?? periodo}.`) }); });
    return () => { vigente = false; };
  }, [periodo, buscar, rotulo]);

  const daVez = !!periodo && resposta?.periodo === periodo;
  const esperando = !!periodo && !daVez;
  const dados = resposta?.dados ?? null; // pode ser do mês anterior enquanto o novo chega
  return {
    dados,
    erro: daVez ? resposta?.erro ?? null : null,
    carregando: esperando && !dados,
    atualizando: esperando && !!dados,
  };
}
