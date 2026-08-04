import { useState } from "react";
import { Zap, Upload, Play, Save, Download } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, StatCard } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { brl } from "../../utils/format";
import type { RETItem } from "../../types";

const MOCK_ITENS: RETItem[] = [
  { tipo_encargo: "EAT", empresa: "COPERGÁS", nota_tipo: "ND", numero_nd: "ND-2025-001", data_vencimento: "2025-03-15", valor_total: 1200000, quantidade: 1, valor_unitario: 1200000, arquivo: "EAT_Jan25.pdf" },
  { tipo_encargo: "EAT", empresa: "COPERGÁS", nota_tipo: "ND", numero_nd: "ND-2025-002", data_vencimento: "2025-03-15", valor_total: 980000, quantidade: 1, valor_unitario: 980000, arquivo: "EAT_Fev25.pdf" },
  { tipo_encargo: "EC", empresa: "COPERGÁS", nota_tipo: "ND", numero_nd: "ND-2025-003", data_vencimento: "2025-03-15", valor_total: 2992827.66, quantidade: 1, valor_unitario: 2992827.66, arquivo: "EC_Mar25.pdf" },
];

export default function RETPage() {
  const [periodo, setPeriodo] = useState("Q1/2026");
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<RETItem[]>([]);

  const PIS_COFINS = 0.0465;
  const eatBruto = itens.filter((i) => i.tipo_encargo === "EAT").reduce((s, i) => s + i.valor_total, 0);
  const ecDocs = itens.filter((i) => i.tipo_encargo === "EC").reduce((s, i) => s + i.valor_total, 0);
  const ret = eatBruto * (1 - PIS_COFINS) + ecDocs;

  const processar = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setItens(MOCK_ITENS);
    setLoading(false);
  };

  const columns = [
    { key: "tipo_encargo", header: "Tipo" },
    { key: "numero_nd", header: "Nº ND" },
    { key: "data_vencimento", header: "Vencimento" },
    { key: "valor_total", header: "Valor Total", align: "right" as const, render: (r: RETItem) => brl(r.valor_total) },
    { key: "arquivo", header: "Arquivo" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#f59e0b17", color: "#f59e0b" }}
            >
              <Zap size={16} />
            </span>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">RET</h1>
          </div>
          <p className="mt-1 ml-12 text-sm text-zinc-500">Processamento automatizado de encargos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Seleção">
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.1] px-5 py-6 text-center transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.03] cursor-pointer">
                <Upload size={22} className="text-zinc-600" />
                <p className="text-sm text-zinc-400">Selecionar pasta principal (RET)</p>
                <input type="file" multiple className="hidden" />
              </label>
              <Input label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="ex: Q1/2026" />
              <Button variant="success" className="w-full justify-center" loading={loading} icon={<Play size={16} />} onClick={processar}>
                Processar PDFs
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2 flex flex-col gap-6">
            {itens.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-5">
                  <StatCard label="Σ EAT (bruto)" value={brl(eatBruto)} color="text-amber-400" />
                  <StatCard label="EC = RET (líquido)" value={brl(ret)} color="text-sky-400" sub={`PIS/COFINS: ${(PIS_COFINS * 100).toFixed(2)}%`} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="purple" icon={<Save size={16} />} onClick={() => alert(`RET salvo para ${periodo}`)}>Salvar RET no SCG</Button>
                  <Button variant="primary" icon={<Download size={16} />} onClick={() => alert("Excel exportado!")}>Exportar Excel</Button>
                  <Button variant="ghost" icon={<Save size={16} />} onClick={() => alert("Salvo no banco!")}>Salvar no Banco</Button>
                </div>
              </>
            ) : (
              <Card>
                <p className="text-zinc-600 text-sm text-center py-8">Selecione a pasta e clique em Processar PDFs</p>
              </Card>
            )}
          </div>
        </div>

        {itens.length > 0 && (
          <Card title={`Dados Detalhados — ${itens.length} documentos`}>
            <Table columns={columns} data={itens} />
          </Card>
        )}
      </div>
    </div>
  );
}
