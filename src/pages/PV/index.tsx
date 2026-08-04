import { useEffect, useState } from "react";
import { DollarSign, Plus, RefreshCw, Save, Trash2, Zap } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { colorForValue } from "../../theme";
import { criarPeriodoPV, getPV, listarPeriodosPV, salvarPV } from "../../api";

function calcularPvLocal(pmpv: number, pr: number): number {
  return pmpv + pr;
}

export default function PVPage() {
  const [periodos, setPeriodos] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState("");
  const [novoPeriodo, setNovoPeriodo] = useState("");
  const [mostrarNovoPeriodo, setMostrarNovoPeriodo] = useState(false);

  const [pmpv, setPmpv] = useState(0);
  const [pr, setPr] = useState(0);

  const [carregandoPeriodos, setCarregandoPeriodos] = useState(false);
  const [carregandoBanco, setCarregandoBanco] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const pv = calcularPvLocal(pmpv, pr);

  const carregarPeriodos = async () => {
    setCarregandoPeriodos(true);
    setErro(null);
    try {
      const dados = await listarPeriodosPV();
      const nomes = dados.map((d) => d.periodo);
      setPeriodos(nomes);
      if (nomes.length && !periodo) setPeriodo(nomes[0]);
    } catch {
      setErro("Não foi possível carregar a lista de períodos.");
    } finally {
      setCarregandoPeriodos(false);
    }
  };

  useEffect(() => {
    carregarPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const criarPeriodo = async () => {
    if (!novoPeriodo.trim()) return;
    setErro(null);
    try {
      await criarPeriodoPV(novoPeriodo.trim());
      await carregarPeriodos();
      setPeriodo(novoPeriodo.trim());
      setNovoPeriodo("");
      setMostrarNovoPeriodo(false);
    } catch {
      setErro("Não foi possível criar o período.");
    }
  };

  const carregarDoBanco = async () => {
    if (!periodo) {
      setAviso("Selecione um período primeiro.");
      return;
    }
    setCarregandoBanco(true);
    setErro(null);
    setAviso(null);
    try {
      const dados = await getPV(periodo);
      if (dados.pmpv === 0 && dados.pr === 0) {
        setAviso(
          `Nenhum valor encontrado para '${periodo}'. Execute os módulos PMPV e PR e salve no banco.`
        );
        return;
      }
      setPmpv(dados.pmpv);
      setPr(dados.pr);
      setAviso(
        `Carregado: PMPV = R$ ${dados.pmpv.toFixed(4)}  |  PR = R$ ${dados.pr.toFixed(4)}  |  PV = R$ ${dados.pv.toFixed(4)}`
      );
    } catch {
      setAviso(`Nenhum valor encontrado para '${periodo}'. Execute os módulos PMPV e PR e salve no banco.`);
    } finally {
      setCarregandoBanco(false);
    }
  };

  const limpar = () => {
    setPmpv(0);
    setPr(0);
    setAviso(null);
  };

  const salvar = async () => {
    if (!periodo) {
      setAviso("Selecione ou crie um período.");
      return;
    }
    if (pmpv === 0 && pr === 0) {
      setAviso("Preencha ao menos um dos valores.");
      return;
    }
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const resultado = await salvarPV(periodo, pmpv, pr);
      setAviso(`PV salvo para ${periodo}. PV = R$ ${resultado.pv.toFixed(4)}`);
    } catch {
      setErro("Falha ao salvar o PV no banco.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#2dd4bf17", color: "#2dd4bf" }}
        >
          <DollarSign size={16} />
        </span>
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-white">PV</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Preço Final — PV = PMPV + PR</p>
        </div>
      </div>

      {erro && <Alert variant="error">{erro}</Alert>}
      {aviso && <Alert variant="info">{aviso}</Alert>}

      <Card title="Período">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Período"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            options={
              periodos.length
                ? periodos.map((p) => ({ value: p, label: p }))
                : [{ value: "", label: "(nenhum período)" }]
            }
          />
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setMostrarNovoPeriodo((v) => !v)}>
            Novo período
          </Button>
          <Button
            variant="ghost"
            icon={<RefreshCw size={14} />}
            loading={carregandoPeriodos}
            onClick={carregarPeriodos}
          >
            Recarregar
          </Button>
        </div>
        {mostrarNovoPeriodo && (
          <div className="mt-3 flex items-end gap-3 border-t border-white/[0.07] pt-3">
            <Input
              label="Nome do período (ex: Dez/2025 ou Jan/2026)"
              value={novoPeriodo}
              onChange={(e) => setNovoPeriodo(e.target.value)}
              className="w-64"
            />
            <Button variant="success" onClick={criarPeriodo}>
              Criar
            </Button>
          </div>
        )}
      </Card>

      <Card title="Fonte dos valores">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="success"
            icon={<Zap size={14} />}
            loading={carregandoBanco}
            onClick={carregarDoBanco}
          >
            Carregar do Banco de Dados
          </Button>
          <Button variant="ghost" icon={<Trash2 size={14} />} onClick={limpar}>
            Limpar
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="PMPV" subtitle="Preço médio mensal (R$/m³)">
          <Input
            label="PMPV (R$/m³)"
            type="number"
            step="0.0001"
            value={pmpv || ""}
            onChange={(e) => setPmpv(parseFloat(e.target.value) || 0)}
          />
        </Card>

        <Card title="PR" subtitle="Preço regulatório final (R$/m³)">
          <Input
            label="PR (R$/m³)"
            type="number"
            step="0.0001"
            value={pr || ""}
            onChange={(e) => setPr(parseFloat(e.target.value) || 0)}
          />
        </Card>
      </div>

      <Card className="border border-teal-500/20">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-zinc-400">PV = PMPV + PR =</span>
          <span className={`text-3xl font-extrabold ${colorForValue(pv)}`}>R$ {pv.toFixed(4)}</span>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="success" icon={<Save size={16} />} loading={salvando} onClick={salvar}>
          Salvar PV no banco
        </Button>
        <Button
          variant="ghost"
          icon={<Save size={16} />}
          disabled
          title="Requer fluxo de Excel Final (Módulo 9) — pendente"
        >
          Excel Final (Módulo 9)
        </Button>
        <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={carregarPeriodos}>
          Atualizar histórico
        </Button>
      </div>

      <Card title="Histórico de PV por período">
        {periodos.length === 0 ? (
          <EmptyState label="Nenhum período salvo ainda." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {periodos.map((p) => (
              <span
                key={p}
                className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300"
              >
                {p}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-600">
          Selecione um período acima e clique em "Carregar do Banco de Dados" para ver PMPV, PR e PV salvos.
        </p>
      </Card>
      </div>
    </div>
  );
}
