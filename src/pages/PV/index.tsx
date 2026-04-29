import { DollarSign } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import { brl } from "../../utils/format";

export default function PVPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign size={22} className="text-teal-400" />
        <h1 className="text-xl font-bold text-white">PV — Preço de Venda Final</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="PMPV" value="R$ 1,2341" color="text-blue-400" sub="Calculado pelo módulo PMPV" />
        <StatCard label="PR (Parcela Recuperação)" value="R$ 0,0292" color="text-yellow-400" />
        <StatCard label="Preço Final (PV = PMPV + PR)" value="R$ 1,2633" color="text-teal-400" sub="Preço de venda ao consumidor" />
      </div>
    </div>
  );
}
