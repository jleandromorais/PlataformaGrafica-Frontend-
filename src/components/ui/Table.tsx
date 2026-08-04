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
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm text-slate-300">
        <thead className="bg-[#0f172a] text-xs uppercase tracking-wider text-slate-400">
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
        <tbody className="divide-y divide-slate-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-2.5 text-${col.align ?? "left"}`}
                  >
                    {col.render ? col.render(row) : row[col.key as keyof T]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && footer.length > 0 && (
          <tfoot className="border-t-2 border-slate-600 bg-slate-800/40 font-semibold text-slate-100">
            <tr>
              {footer.map((cell, i) => (
                <td
                  key={i}
                  colSpan={cell.colSpan ?? 1}
                  className={`px-4 py-2.5 text-${cell.align ?? "left"}`}
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
