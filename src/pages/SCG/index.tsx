import { useState } from "react";
import { Layers, Plus, Zap } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, StatCard } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { brl } from "../../utils/format";
import type { SCGPeriodo } from "../../types";

const MOCK_PERIODOS: SCGPeriodo[] = [
  { periodo: "Jan/25 - Mar/25", cgr: 3982585, cgf: 5172827.66, rpv: -1190242.74, ret: 5172827.66, rp: 0, scg: 3982585 },
  { periodo: "Out/24 - Dez/24", cgr: 3100000, cgf: 4200000, rpv: -1100000, ret: 4200000, rp: 50000, scg: 3150000 },
];

export default function SCGPage() {
  const [periodos] = useState<SCGPeriodo[]>(MOCK_PERIODOS);
  const [selected, setSelected] = useState(MOCK_PERIODOS[0]);
  const [modo, setModo] = useState<"auto" | "manual">("auto");
  const [manual, setManual] = useState({ cgr: "", cgf: "", ret: "", rp: "" });
  const [novoPeriodo, setNovoPeriodo] = useState("");

  const campos = [
    { key: "cgr" as const, label: "CGR (Auditoria XML)",   color: "text-blue-400",    badge: "blue" as const },
    { key: "cgf" as const, label: "CGF (Volume Faturado)", color: "text-emerald-400", badge: "green" as const },
    { key: "rpv" as const, label: "RPV = CGR − CGF",       color: "text-violet-400",  badge: "purple" as const },
    { key: "ret" as const, label: "RET (Encargos)",        color: "text-yellow-400",  badge: "yellow" as const },
    { key: "rp"  as const, label: "RP (Conciliação)",      color: "text-sky-400",     badge: "blue" as const },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Layers size={22} className="text-red-400" />
        <h1 className="text-xl font-bold text-white">Consolidação SCG</h1>
        <span className="text-slate-400 text-sm">SCG = RPV + RET + RP</span>
      </div>

      {/* SELETOR DE PERÍODO */}
      <Card title="Período">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-2 flex-wrap">
            {periodos.map((p) => (
              <button key={p.periodo} onClick={() => setSelected(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selected.periodo === p.periodo ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                {p.periodo}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <Input placeholder="Novo período (ex: Abr/25)" value={novoPeriodo} onChange={(e) => setNovoPeriodo(e.target.value)} className="w-52" />
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setNovoPeriodo("")}>Criar</Button>
          </div>
        </div>
      </Card>

      {/* MODO AUTO / MANUAL */}
      <div className="flex gap-3">
        <Button variant={modo === "auto" ? "success" : "ghost"} onClick={() => setModo("auto")}>🔄 Automático (Banco)</Button>
        <Button variant={modo === "manual" ? "warning" : "ghost"} onClick={() => setModo("manual")}>✏️ Manual</Button>
      </div>

      {/* RPV DESTAQUE */}
      <div className="bg-[#1e1b4b] rounded-xl p-5 flex flex-wrap gap-6 items-center">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">CGR</p>
          <p className="text-lg font-bold text-blue-400">{brl(selected.cgr)}</p>
        </div>
        <span className="text-2xl font-bold text-red-400">−</span>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">CGF</p>
          <p className="text-lg font-bold text-emerald-400">{brl(selected.cgf)}</p>
        </div>
        <span className="text-2xl font-bold text-yellow-400">=</span>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">RPV</p>
          <p className="text-xl font-bold text-violet-400">{brl(selected.rpv)}</p>
        </div>
      </div>

      {/* VALORES */}
      <Card title="Valores por Módulo">
        <div className="space-y-3">
          {campos.map(({ key, label, color, badge }) => (
            <div key={key} className="flex items-center gap-4">
              <Badge variant={badge}>BD</Badge>
              <span className="text-slate-300 text-sm w-52">{label}</span>
              {modo === "auto" ? (
                <span className={`font-bold text-base ${color}`}>{brl(selected[key])}</span>
              ) : key !== "rpv" ? (
                <Input type="number" value={manual[key as keyof typeof manual]} onChange={(e) => setManual({ ...manual, [key]: e.target.value })} className="w-44" />
              ) : (
                <span className={`font-bold text-base ${color}`}>{brl(selected.rpv)}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* CALCULAR */}
      <div className="flex items-center gap-6">
        <Button variant="danger" size="lg" icon={<Zap size={16} />} onClick={() => alert("SCG calculado!")}>
          Calcular SCG
        </Button>
        <div className="bg-[#1e293b] rounded-xl px-6 py-3">
          <span className="text-slate-400 text-sm">SCG = </span>
          <span className="text-yellow-400 text-2xl font-bold ml-2">{brl(selected.scg)}</span>
        </div>
      </div>

      {/* HISTÓRICO */}
      <Card title="Histórico de Períodos">
        <div className="space-y-2 font-mono text-xs text-slate-400">
          {periodos.map((p) => (
            <div key={p.periodo} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-700 pb-2">
              <span className="text-slate-300 font-semibold">{p.periodo}</span>
              <span>CGR: <span className="text-blue-400">{brl(p.cgr)}</span></span>
              <span>RPV: <span className="text-violet-400">{brl(p.rpv)}</span></span>
              <span>RET: <span className="text-yellow-400">{brl(p.ret)}</span></span>
              <span>RP: <span className="text-sky-400">{brl(p.rp)}</span></span>
              <span>SCG: <span className="text-emerald-400 font-bold">{brl(p.scg)}</span></span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
