import { useState } from "react";
import { FileSearch, Upload, Play, Save, Download } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, StatCard } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { brl } from "../../utils/format";
import type { AuditoriaItem } from "../../types";

const MOCK_ITENS: AuditoriaItem[] = [
  { empresa: "PETROBRAS", tipo: "NF-e", numero: "123456", valor_total: 850000, icms: 136000, icms_taxa: 0.16, pis: 5525, cofins: 25500, volume_total: 450000, cgr_liquido: 708500, metodo: "XML" },
  { empresa: "GALP", tipo: "CT-e", numero: "78910", valor_total: 320000, icms: 51200, icms_taxa: 0.16, pis: 2080, cofins: 9600, volume_total: 180000, cgr_liquido: 268800, metodo: "XML" },
  { empresa: "BRAVA", tipo: "NF-e", numero: "111222", valor_total: 490000, icms: 78400, icms_taxa: 0.16, pis: 3185, cofins: 14700, volume_total: 260000, cgr_liquido: 411600, metodo: "XML" },
];

export default function AuditoriaPage() {
  const [periodo, setPeriodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<AuditoriaItem[]>([]);
  const [modo, setModo] = useState<"XML" | "PDF">("XML");

  const cgr = itens.reduce((s, i) => s + i.cgr_liquido, 0);
  const totalNFe = itens.filter((i) => i.tipo === "NF-e").reduce((s, i) => s + i.valor_total, 0);
  const totalCTe = itens.filter((i) => i.tipo === "CT-e").reduce((s, i) => s + i.valor_total, 0);

  const executar = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setItens(MOCK_ITENS);
    setLoading(false);
  };

  const columns = [
    { key: "empresa", header: "Empresa" },
    { key: "tipo", header: "Tipo", render: (r: AuditoriaItem) => <Badge variant={r.tipo === "NF-e" ? "blue" : "yellow"}>{r.tipo}</Badge> },
    { key: "numero", header: "Número" },
    { key: "valor_total", header: "Valor Total", align: "right" as const, render: (r: AuditoriaItem) => brl(r.valor_total) },
    { key: "icms", header: "ICMS", align: "right" as const, render: (r: AuditoriaItem) => brl(r.icms) },
    { key: "cgr_liquido", header: "CGR Líquido", align: "right" as const, render: (r: AuditoriaItem) => <span className="text-emerald-400 font-semibold">{brl(r.cgr_liquido)}</span> },
    { key: "metodo", header: "Método", render: (r: AuditoriaItem) => <Badge variant="gray">{r.metodo}</Badge> },
  ];

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#a78bfa17", color: "#a78bfa" }}
            >
              <FileSearch size={16} />
            </span>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">Auditoria</h1>
          </div>
          <p className="mt-1 ml-12 text-sm text-zinc-500">Conferência fiscal de XML/PDF por empresa</p>
        </div>

        {/* CONFIGURAÇÃO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Passo 1 — Pasta com XMLs/PDFs">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={modo === "XML" ? "primary" : "ghost"} size="sm" onClick={() => setModo("XML")}>XML</Button>
                <Button variant={modo === "PDF" ? "warning" : "ghost"} size="sm" onClick={() => setModo("PDF")}>PDF (OCR)</Button>
              </div>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.1] px-6 py-8 text-center transition-colors hover:border-sky-500/40 hover:bg-sky-500/[0.03] cursor-pointer">
                <Upload size={22} className="text-zinc-600" />
                <p className="text-sm text-zinc-400">Arraste a pasta ou clique para selecionar</p>
                <p className="text-xs text-zinc-600">Suporta pastas com subpastas por empresa</p>
                <input type="file" multiple className="hidden" />
              </label>
            </div>
          </Card>

          <Card title="Passo 2 — Excel e Período (opcional)">
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/[0.1] px-6 py-5 text-center transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] cursor-pointer">
                <Upload size={18} className="text-zinc-600" />
                <p className="text-sm text-zinc-400">Selecionar Excel (Conta Gráfica)</p>
                <input type="file" accept=".xlsx,.xls" className="hidden" />
              </label>
              <Input label="Mês/Ano (para comparação)" placeholder="jan26 ou jan/2026" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            </div>
          </Card>
        </div>

        {/* PAINEL CGR */}
        {itens.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent bg-[#0d0d0f] px-6 py-4 flex flex-wrap gap-6 items-center">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">CGR Apurado</span>
            <span className="text-zinc-400 text-sm">NF-e: <span className="text-sky-400 font-semibold">{brl(totalNFe)}</span></span>
            <span className="text-zinc-400 text-sm">CT-e: <span className="text-amber-400 font-semibold">{brl(totalCTe)}</span></span>
            <span className="text-zinc-400 text-sm ml-auto">CGR Líquido: <span className="text-emerald-400 font-bold text-lg">{brl(cgr)}</span></span>
          </div>
        )}

        {/* AÇÕES */}
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="lg" loading={loading} icon={<Play size={16} />} onClick={executar}>
            Executar Auditoria
          </Button>
          {itens.length > 0 && (
            <>
              <Button variant="success" icon={<Save size={16} />} onClick={() => alert("Salvo no SCG!")}>Salvar no SCG</Button>
              <Button variant="primary" icon={<Download size={16} />} onClick={() => alert("Excel exportado!")}>Exportar Excel</Button>
            </>
          )}
        </div>

        {/* RESULTADOS */}
        {itens.length > 0 && (
          <Card title={`Resultados — ${itens.length} itens`}>
            <Table columns={columns} data={itens} />
          </Card>
        )}
      </div>
    </div>
  );
}
