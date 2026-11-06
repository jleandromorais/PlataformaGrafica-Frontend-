import { useEffect, useRef } from "react";
import { Pagination } from "@heroui/react";
import { paginasVisiveis, textoResumo, type RotuloItem } from "../../utils/paginacao";

interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onMudar: (pagina: number) => void;
  /** Nome do item no resumo: [singular, plural], ex.: ["mês", "meses"]. */
  rotulo?: RotuloItem;
}

/**
 * Rodapé de tabela paginada (HeroUI Pagination). Aparece sempre que há ao menos um item
 * (com uma página só, as setas ficam desativadas); some com a lista vazia ou carregando.
 */
export function Paginacao({ pagina, totalPaginas, total, porPagina, onMudar, rotulo = ["registro", "registros"] }: PaginacaoProps) {
  const atualRef = useRef<HTMLButtonElement>(null);
  const focarAtual = useRef(false);

  // Anterior/Próxima levou à primeira/última página: o botão fica desativado e o navegador
  // jogaria o foco no body. Leva o foco para o número da página atual.
  useEffect(() => {
    if (!focarAtual.current) return;
    focarAtual.current = false;
    atualRef.current?.focus();
  }, [pagina]);

  if (total === 0) return null;

  const irPelaSeta = (destino: number) => {
    if (destino === 1 || destino === totalPaginas) focarAtual.current = true;
    onMudar(destino);
  };

  return (
    <Pagination size="sm" aria-label="Páginas do histórico" className="border-t border-white/[0.07] px-5 py-3 sm:px-6">
      <Pagination.Summary aria-live="polite" className="tabular-nums text-zinc-400">
        {textoResumo(pagina, porPagina, total, rotulo)}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous aria-label="Página anterior" isDisabled={pagina === 1} onPress={() => irPelaSeta(pagina - 1)}>
            <Pagination.PreviousIcon />
            <span>Anterior</span>
          </Pagination.Previous>
        </Pagination.Item>
        {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
          p === "reticencias" ? (
            <Pagination.Item key={`reticencias-${i}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={p}>
              <Pagination.Link
                ref={p === pagina ? atualRef : undefined}
                isActive={p === pagina}
                onPress={() => onMudar(p)}
                aria-label={`Página ${p} de ${totalPaginas}`}
              >
                {p}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next aria-label="Próxima página" isDisabled={pagina === totalPaginas} onPress={() => irPelaSeta(pagina + 1)}>
            <span>Próxima</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
