import { useState } from "react";
import { BarChart2, Upload, Play, Save } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, StatCard } from "../../components/ui/Card";
import { brl, num } from "../../utils/format";

export default function CGFPage() {
  const [periodo, setPeriodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<null | { volume_faturado: number; volume_cancelado: number; volume_final: number; cgf_rs: number }>(null);

  const processar = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setResultado({ volume_faturado: 5800000, volume_cancelado: 120000, volume_final: 5680000, cgf_rs: 5172827.66 });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#16a08517", color: "#16a085" }}
            >
              <BarChart2 size={16} />
            </span>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">CGF</h1>
          </div>
          <p className="mt-1 ml-12 text-sm text-zinc-500">Conta Gráfica Faturada — volume faturado por período</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Ficheiros Excel" subtitle="Planilha de faturamento do período">
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.1] px-6 py-10 text-center transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] cursor-pointer">
              <Upload size={22} className="text-zinc-600" />
              <p className="text-sm text-zinc-400">Arrastar ficheiros Excel (faturamento)</p>
              <p className="text-xs text-zinc-600">.xlsx, .xls</p>
              <input type="file" accept=".xlsx,.xls" className="hidden" />
            </label>
          </Card>

          <Card title="Configuração" subtitle="Mapeamento de colunas da planilha">
            <div className="space-y-4">
              <Input label="Período" placeholder="ex: Jan/2025" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
              <Input label="Coluna Volume Faturado" defaultValue="Volume Faturado" />
              <Input label="Coluna Produto" defaultValue="Produto" />
              <Input label="Valor Consumo Próprio" defaultValue="consumo proprio" />
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="success" size="lg" loading={loading} icon={<Play size={16} />} onClick={processar}>
            Processar CGF
          </Button>
          {resultado && (
            <Button variant="purple" icon={<Save size={16} />} onClick={() => alert("CGF salvo no banco!")}>
              Salvar no Banco
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Volume Faturado"
            value={resultado ? `${num(resultado.volume_faturado)} m³` : "—"}
            color={resultado ? "text-sky-400" : "text-zinc-700"}
          />
          <StatCard
            label="Volume Cancelado"
            value={resultado ? `${num(resultado.volume_cancelado)} m³` : "—"}
            color={resultado ? "text-red-400" : "text-zinc-700"}
          />
          <StatCard
            label="Volume Final"
            value={resultado ? `${num(resultado.volume_final)} m³` : "—"}
            color={resultado ? "text-emerald-400" : "text-zinc-700"}
          />
          <StatCard
            label="CGF (R$)"
            value={resultado ? brl(resultado.cgf_rs) : "—"}
            color={resultado ? "text-amber-400" : "text-zinc-700"}
          />
        </div>
      </div>
    </div>
  );
}
