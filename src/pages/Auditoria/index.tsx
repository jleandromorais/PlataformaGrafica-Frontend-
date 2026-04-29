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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileSearch size={22} className="text-violet-400" />
        <h1 className="text-xl font-bold text-white">Auditoria XML Fiscal</h1>
      </div>

      {/* CONFIGURAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Passo 1 — Pasta com XMLs/PDFs">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant={modo === "XML" ? "primary" : "ghost"} size="sm" onClick={() => setModo("XML")}>XML</Button>
              <Button variant={modo === "PDF" ? "warning" : "ghost"} size="sm" onClick={() => setModo("PDF")}>PDF (OCR)</Button>
            </div>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload size={24} className="mx-auto text-slate-500 mb-2" />
              <p className="text-sm text-slate-400">Arraste a pasta ou clique para selecionar</p>
              <p className="text-xs text-slate-600 mt-1">Suporta pastas com subpastas por empresa</p>
            </div>
          </div>
        </Card>

        <Card title="Passo 2 — Excel e Período (opcional)">
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-emerald-500 transition-colors cursor-pointer">
              <Upload size={20} className="mx-auto text-slate-500 mb-1" />
              <p className="text-sm text-slate-400">Selecionar Excel (Conta Gráfica)</p>
            </div>
            <Input label="Mês/Ano (para comparação)" placeholder="jan26 ou jan/2026" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
          </div>
        </Card>
      </div>

      {/* PAINEL CGR */}
      {itens.length > 0 && (
        <div className="bg-[#0d1b2a] rounded-xl p-4 flex flex-wrap gap-6 items-center border border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CGR Apurado</span>
          <span className="text-slate-400 text-sm">NF-e: <span className="text-blue-400 font-semibold">{brl(totalNFe)}</span></span>
          <span className="text-slate-400 text-sm">CT-e: <span className="text-yellow-400 font-semibold">{brl(totalCTe)}</span></span>
          <span className="text-slate-400 text-sm ml-auto">CGR Líquido: <span className="text-emerald-400 font-bold text-lg">{brl(cgr)}</span></span>
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
  );
}
