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
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#fb923c17", color: "#fb923c" }}
            >
              <FileText size={16} />
            </span>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">Conciliação</h1>
          </div>
          <p className="mt-1 ml-12 text-sm text-zinc-500">Conciliador financeiro — receitas x despesas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Pasta de RECEITAS">
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-500/20 px-6 py-8 text-center transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] cursor-pointer">
              <Upload size={22} className="text-emerald-500/50" />
              <p className="text-sm text-zinc-400">Selecionar pasta de receitas</p>
              <p className="text-xs text-zinc-600">PDF e ZIP suportados</p>
              <input type="file" multiple className="hidden" />
            </label>
          </Card>
          <Card title="Pasta de DESPESAS">
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-red-500/20 px-6 py-8 text-center transition-colors hover:border-red-500/40 hover:bg-red-500/[0.03] cursor-pointer">
              <Upload size={22} className="text-red-500/50" />
              <p className="text-sm text-zinc-400">Selecionar pasta de despesas</p>
              <p className="text-xs text-zinc-600">PDF e ZIP suportados</p>
              <input type="file" multiple className="hidden" />
            </label>
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap gap-4 items-end">
            <Input label="Período" placeholder="ex: Dez/2025" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-44" />
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={layoutBonito} onChange={(e) => setLayoutBonito(e.target.checked)} className="rounded border-white/[0.2] bg-white/[0.03]" />
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard label="Total Receitas" value={brl(totalRec)} color="text-emerald-400" />
              <StatCard label="Total Despesas" value={brl(totalDesp)} color="text-red-400" />
              <StatCard label="Saldo RP (Desp − Rec)" value={brl(saldoRP)} color={saldoRP >= 0 ? "text-amber-400" : "text-red-400"} />
            </div>
            <Card title={`Itens — ${itens.length} registos`}>
              <Table columns={columns} data={itens} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
