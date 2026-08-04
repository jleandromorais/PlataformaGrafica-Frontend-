import type { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
}

interface FooterCell {
  /** Índice da coluna (0-based) onde esta célula começa. */
  colIndex: number;
  /** Quantas colunas esta célula ocupa (para rótulos que atravessam várias). */
  colSpan?: number;
  content: ReactNode;
  align?: "left" | "right" | "center";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  /** Linha de rodapé (ex.: totais). Células não cobertas ficam em branco. */
  footer?: FooterCell[];
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "Sem dados.",
  footer,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
      <table className="w-full text-sm text-zinc-300">
        <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.08em] text-zinc-500">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 font-semibold text-${col.align ?? "left"}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-600">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-2.5 tabular-nums text-${col.align ?? "left"}`}
                  >
                    {col.render ? col.render(row) : row[col.key as keyof T]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && footer.length > 0 && (
          <tfoot className="border-t border-white/[0.1] bg-white/[0.03] font-semibold text-zinc-100">
            <tr>
              {footer.map((cell, i) => (
                <td
                  key={i}
                  colSpan={cell.colSpan ?? 1}
                  className={`px-4 py-2.5 tabular-nums text-${cell.align ?? "left"}`}
                >
                  {cell.content}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
