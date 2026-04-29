import { useState } from "react";
import { Calculator, Save, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, StatCard } from "../../components/ui/Card";
import { brl } from "../../utils/format";
import type { EmpresaLinha, PMPVResultado } from "../../types";

const TRIMESTRES: Record<string, number[]> = {
  "Nov - Jan": [10, 11, 0],
  "Fev - Abr": [1, 2, 3],
  "Mai - Jul": [4, 5, 6],
  "Ago - Out": [7, 8, 9],
};
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const EMPRESAS_PADRAO = ["PETROBRAS","GALP","PETRORECONCAVO","BRAVA","ENEVA","ORIZON"];

function linhaVazia(empresa = ""): EmpresaLinha {
  return { empresa, molecula: 0, transporte: 0, logistica: 0, volume: 0 };
}

function TabelaMes({ linhas, onChange }: { linhas: EmpresaLinha[]; onChange: (l: EmpresaLinha[]) => void }) {
  const update = (i: number, field: keyof EmpresaLinha, val: string) => {
    const next = [...linhas];
    next[i] = { ...next[i], [field]: field === "empresa" ? val : parseFloat(val) || 0 };
    onChange(next);
  };
  const remove = (i: number) => onChange(linhas.filter((_, idx) => idx !== i));
  const add = () => onChange([...linhas, linhaVazia()]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 px-1">
        {["Empresa","Molécula","Transporte","Logística","Total","Volume",""].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {linhas.map((l, i) => {
        const total = l.molecula + l.transporte + l.logistica;
        return (
          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
            <input value={l.empresa} onChange={(e) => update(i, "empresa", e.target.value)}
              className="bg-[#334155] border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            {(["molecula","transporte","logistica"] as const).map((f) => (
              <input key={f} type="number" step="0.0001" value={l[f] || ""} onChange={(e) => update(i, f, e.target.value)}
                className="bg-[#334155] border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            ))}
            <div className="bg-[#0f172a] border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300 text-right">
              {total.toFixed(4)}
            </div>
            <input type="number" step="0.0000001" value={l.volume || ""} onChange={(e) => update(i, "volume", e.target.value)}
              className="bg-[#334155] border border-slate-600 rounded px-2 py-1.5 text-sm text-yellow-300 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={() => remove(i)} className="text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
      <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={add}>Adicionar</Button>
    </div>
  );
}

export default function PMPVPage() {
  const trimAtual = "Nov - Jan";
  const [trimestre, setTrimestre] = useState(trimAtual);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [contaGrafica, setContaGrafica] = useState("-0.0210");
  const [meses, setMeses] = useState<Record<string, EmpresaLinha[]>>({
    "Mês 1": EMPRESAS_PADRAO.map(linhaVazia),
    "Mês 2": EMPRESAS_PADRAO.map(linhaVazia),
    "Mês 3": EMPRESAS_PADRAO.map(linhaVazia),
  });
  const [resultado, setResultado] = useState<PMPVResultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [abaMes, setAbaMes] = useState("Mês 1");

  const calcular = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    // Mock result — substituir por: calcularPMPV({ trimestre, ano, meses, conta_grafica: parseFloat(contaGrafica) })
    setResultado({ pmpv: 1.2341, preco_final: 1.2131, vp_mensal: 142876000, vp_por_mes: { "Novembro": 47000000, "Dezembro": 48000000, "Janeiro": 47876000 } });
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calculator size={22} className="text-blue-400" />
        <h1 className="text-xl font-bold text-white">Calculadora PMPV Master</h1>
      </div>

      {/* CONFIGURAÇÃO */}
      <Card title="Configuração do Período">
        <div className="flex flex-wrap gap-4">
          <Select label="Trimestre" value={trimestre} onChange={(e) => setTrimestre(e.target.value)}
            options={Object.keys(TRIMESTRES).map((k) => ({ value: k, label: k }))}
            className="w-44" />
          <Input label="Ano" type="number" value={ano} onChange={(e) => setAno(+e.target.value)} className="w-28" />
          <Input label="Conta Gráfica (R$)" value={contaGrafica} onChange={(e) => setContaGrafica(e.target.value)} className="w-36" />
        </div>
      </Card>

      {/* ABAS POR MÊS */}
      <Card title="Dados por Mês">
        <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
          {["Mês 1","Mês 2","Mês 3"].map((m) => (
            <button key={m} onClick={() => setAbaMes(m)}
              className={`px-4 py-1.5 rounded-t text-sm font-medium transition-colors ${abaMes === m ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {m}
            </button>
          ))}
        </div>
        <TabelaMes linhas={meses[abaMes]} onChange={(l) => setMeses({ ...meses, [abaMes]: l })} />
      </Card>

      {/* AÇÕES */}
      <div className="flex flex-wrap gap-3">
        <Button variant="success" size="lg" loading={loading} icon={<Calculator size={16} />} onClick={calcular}>
          Calcular PMPV
        </Button>
        {resultado && (
          <>
            <Button variant="purple" icon={<Save size={16} />} onClick={() => alert("Salvo!")}>Salvar no Banco</Button>
            <Button variant="primary" icon={<Download size={16} />} onClick={() => alert("Exportado!")}>Exportar Excel</Button>
          </>
        )}
      </div>

      {/* RESULTADO */}
      {resultado && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="PMPV" value={`R$ ${resultado.pmpv.toFixed(4)}`} color="text-blue-400" />
          <StatCard label="Preço Final" value={`R$ ${resultado.preco_final.toFixed(4)}`} color="text-yellow-400" />
          <StatCard label="Volume Prospectivo Total" value={`${resultado.vp_mensal.toLocaleString("pt-BR")} m³`} color="text-emerald-400" />
        </div>
      )}
    </div>
  );
}
