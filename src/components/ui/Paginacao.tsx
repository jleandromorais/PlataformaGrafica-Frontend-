import { Pagination } from "@heroui/react";
import { paginasVisiveis } from "../../utils/paginacao";

interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onMudar: (pagina: number) => void;
  /** Nome do item no resumo, no plural: "meses", "sessões"… */
  rotulo?: string;
}

/** Rodapé de tabela paginada (HeroUI Pagination). Some quando tudo cabe numa página. */
export function Paginacao({ pagina, totalPaginas, total, porPagina, onMudar, rotulo = "registros" }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;

  const primeiro = (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <Pagination size="sm" className="border-t border-white/[0.07] px-5 py-3 sm:px-6">
      <Pagination.Summary className="tabular-nums text-zinc-400">
        Mostrando {primeiro}–{ultimo} de {total} {rotulo}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={pagina === 1} onPress={() => onMudar(pagina - 1)}>
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
              <Pagination.Link isActive={p === pagina} onPress={() => onMudar(p)} aria-label={`Página ${p}`}>
                {p}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next isDisabled={pagina === totalPaginas} onPress={() => onMudar(pagina + 1)}>
            <span>Próxima</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
