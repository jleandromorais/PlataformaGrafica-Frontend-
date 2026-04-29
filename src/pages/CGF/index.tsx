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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 size={22} className="text-emerald-400" />
        <h1 className="text-xl font-bold text-white">CGF — Volume Faturado</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Ficheiros Excel">
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer">
              <Upload size={24} className="mx-auto text-slate-500 mb-2" />
              <p className="text-sm text-slate-400">Arrastar ficheiros Excel (faturamento)</p>
              <p className="text-xs text-slate-600 mt-1">.xlsx, .xls</p>
            </div>
          </div>
        </Card>

        <Card title="Configuração">
          <div className="space-y-4">
            <Input label="Período" placeholder="ex: Jan/2025" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            <Input label="Coluna Volume Faturado" defaultValue="Volume Faturado" />
            <Input label="Coluna Produto" defaultValue="Produto" />
            <Input label="Valor Consumo Próprio" defaultValue="consumo proprio" />
          </div>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="success" size="lg" loading={loading} icon={<Play size={16} />} onClick={processar}>
          Processar CGF
        </Button>
        {resultado && (
          <Button variant="purple" icon={<Save size={16} />} onClick={() => alert("CGF salvo no banco!")}>
            Salvar no Banco
          </Button>
        )}
      </div>

      {resultado && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Volume Faturado" value={`${num(resultado.volume_faturado)} m³`} color="text-blue-400" />
          <StatCard label="Volume Cancelado" value={`${num(resultado.volume_cancelado)} m³`} color="text-red-400" />
          <StatCard label="Volume Final" value={`${num(resultado.volume_final)} m³`} color="text-emerald-400" />
          <StatCard label="CGF (R$)" value={brl(resultado.cgf_rs)} color="text-yellow-400" />
        </div>
      )}
    </div>
  );
}
