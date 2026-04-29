import { useState } from "react";
import { FileText, Upload, Play, Save } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, StatCard } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { brl } from "../../utils/format";
import type { ConciliaItem } from "../../types";

const MOCK: ConciliaItem[] = [
  { arquivo: "NF_001.pdf", categoria: "Receita", valor: 120000, status: "OK", metodo: "OCR" },
  { arquivo: "NF_002.pdf", categoria: "Receita", valor: 85000, status: "OK", metodo: "OCR" },
  { arquivo: "DESP_001.pdf", categoria: "Despesa", valor: 45000, status: "OK", metodo: "OCR" },
  { arquivo: "DESP_002.pdf", categoria: "Despesa", valor: 160000, status: "DIVERGÊNCIA", metodo: "OCR" },
];

export default function ConciliacaoPage() {
  const [periodo, setPeriodo] = useState(new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(" de ", "/"));
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<ConciliaItem[]>([]);
  const [layoutBonito, setLayoutBonito] = useState(false);

  const totalRec = itens.filter((i) => i.categoria === "Receita").reduce((s, i) => s + i.valor, 0);
  const totalDesp = itens.filter((i) => i.categoria === "Despesa").reduce((s, i) => s + i.valor, 0);
  const saldoRP = totalDesp - totalRec;

  const processar = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setItens(MOCK);
    setLoading(false);
  };

  const columns = [
    { key: "arquivo", header: "Arquivo" },
    { key: "categoria", header: "Categoria", render: (r: ConciliaItem) => <Badge variant={r.categoria === "Receita" ? "green" : "red"}>{r.categoria}</Badge> },
    { key: "valor", header: "Valor", align: "right" as const, render: (r: ConciliaItem) => brl(r.valor) },
    { key: "status", header: "Status", render: (r: ConciliaItem) => <Badge variant={r.status === "OK" ? "green" : "yellow"}>{r.status}</Badge> },
    { key: "metodo", header: "Método", render: (r: ConciliaItem) => <Badge variant="gray">{r.metodo}</Badge> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText size={22} className="text-orange-400" />
        <h1 className="text-xl font-bold text-white">Conciliador Financeiro</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Pasta de RECEITAS">
          <div className="border-2 border-dashed border-emerald-800 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer">
            <Upload size={24} className="mx-auto text-emerald-600 mb-2" />
            <p className="text-sm text-slate-400">Selecionar pasta de receitas</p>
            <p className="text-xs text-slate-600 mt-1">PDF e ZIP suportados</p>
          </div>
        </Card>
        <Card title="Pasta de DESPESAS">
          <div className="border-2 border-dashed border-red-800 rounded-lg p-6 text-center hover:border-red-500 transition-colors cursor-pointer">
            <Upload size={24} className="mx-auto text-red-600 mb-2" />
            <p className="text-sm text-slate-400">Selecionar pasta de despesas</p>
            <p className="text-xs text-slate-600 mt-1">PDF e ZIP suportados</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <Input label="Período" placeholder="ex: Dez/2025" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-44" />
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={layoutBonito} onChange={(e) => setLayoutBonito(e.target.checked)} className="rounded" />
            Gerar Excel bonito
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="lg" loading={loading} icon={<Play size={16} />} onClick={processar}>
          Processar e Conciliar
        </Button>
        {itens.length > 0 && (
          <Button variant="success" icon={<Save size={16} />} onClick={() => alert(`RP salvo para ${periodo}`)}>
            Salvar Saldo (RP) no SCG
          </Button>
        )}
      </div>

      {itens.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Receitas" value={brl(totalRec)} color="text-emerald-400" />
            <StatCard label="Total Despesas" value={brl(totalDesp)} color="text-red-400" />
            <StatCard label="Saldo RP (Desp − Rec)" value={brl(saldoRP)} color={saldoRP >= 0 ? "text-yellow-400" : "text-red-400"} />
          </div>
          <Card title={`Itens — ${itens.length} registos`}>
            <Table columns={columns} data={itens} />
          </Card>
        </>
      )}
    </div>
  );
}
