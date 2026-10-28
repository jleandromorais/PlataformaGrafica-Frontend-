import { useEffect, useRef, useState } from "react";
import { DollarSign, RefreshCw, Save, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { colorForValue } from "../../theme";
import { getPVTrimestre, getTrimestresFiscais, salvarPVTrimestre } from "../../api";
import { mensagemDeErro } from "../../api/client";
import { MESES_ABREV } from "../../utils/periodos";
import { tituloDe } from "../../utils/glossario";

interface Trimestre { label: string; meses: string[] }

/** Ano do 1º mês. Até 2098: o Nov – Jan/2098 termina em Jan/2099, o último ano aceito. */
const ANO_MIN = 2000;
const ANO_MAX = 2098;
const anoOk = (a: number) => Number.isInteger(a) && a >= ANO_MIN && a <= ANO_MAX;

/** Trimestre fiscal do mês atual e o ano do seu 1º mês (em Jan, o Nov – Jan começou no ano anterior). */
function trimestreAtual(trimestres: Trimestre[]): { label: string; ano: number } {
  const hoje = new Date();
  const mes = MESES_ABREV[hoje.getMonth()];
  const t = trimestres.find((x) => x.meses.includes(mes)) ?? trimestres[0];
  if (!t) return { label: "", ano: hoje.getFullYear() };
  const voltou = MESES_ABREV.indexOf(mes) < MESES_ABREV.indexOf(t.meses[0]);
  return { label: t.label, ano: hoje.getFullYear() - (voltou ? 1 : 0) };
}

export default function PVPage() {
  const [trimestres, setTrimestres] = useState<Trimestre[]>([]);
  const [trimestre, setTrimestre] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [periodos, setPeriodos] = useState<string[]>([]);

  const [pmpv, setPmpv] = useState(0);
  const [pr, setPr] = useState(0);

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const ultimaBusca = useRef(0);
  // Trimestre cujos valores estão na tela; salvar só vale para ele (evita gravar
  // o trimestre anterior enquanto o novo ainda carrega ou depois de um erro).
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null);

  const pv = pmpv + pr;
  const anoValido = anoOk(ano);
  const podeSalvar = !carregando && carregadoPara === `${trimestre}/${ano}`;

  const carregar = async (label = trimestre, a = ano) => {
    // Invalida a busca anterior e limpa a tela antes de validar: nada do trimestre
    // antigo fica visível (nem pode ser salvo) sob o novo rótulo.
    const busca = ++ultimaBusca.current;
    setCarregadoPara(null);
    setPmpv(0);
    setPr(0);
    setPeriodos([]);
    setAvisos([]);
    setErro(null);
    setSucesso(null);
    // valida o ano recebido (o estado `ano` ainda é o do render anterior enquanto se digita)
    if (!label || !anoOk(a)) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const d = await getPVTrimestre(label, a);
      if (busca !== ultimaBusca.current) return; // o usuário já trocou de trimestre
      setPeriodos(d.periodos);
      // Sempre os valores atuais dos módulos PMPV e PR: mostrar o PV já salvo
      // escondia o PR novo (salvo depois) e não havia como trazê-lo para a tela.
      // O aviso diz quando o PV salvo difere; "Salvar" atualiza.
      setPmpv(d.pmpv);
      setPr(d.pr);
      setAvisos(d.avisos);
      setCarregadoPara(`${label}/${a}`);
    } catch (e) {
      if (busca === ultimaBusca.current) setErro(mensagemDeErro(e, `Não foi possível carregar o PV de ${label}/${a}.`));
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  };

  /** Troca trimestre/ano e já carrega do banco. */
  const mudar = (label: string, a: number) => {
    setTrimestre(label);
    setAno(a);
    carregar(label, a);
  };

  useEffect(() => {
    getTrimestresFiscais()
      .then((t) => {
        setTrimestres(t);
        const atual = trimestreAtual(t);
        mudar(atual.label, atual.ano);
      })
      .catch((e) => setErro(mensagemDeErro(e, "Não foi possível carregar a lista de trimestres.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpar = () => {
    setPmpv(0);
    setPr(0);
    setAvisos([]);
    setSucesso(null);
  };

  const salvar = async () => {
    setErro(null);
    setSucesso(null);
    if (!trimestre) return setErro("Escolha o trimestre.");
    if (!anoValido) return setErro(`O ano precisa estar entre ${ANO_MIN} e ${ANO_MAX}.`);
    if (!podeSalvar) return setErro("Espere o trimestre terminar de carregar (ou use \"Recarregar do banco\") antes de salvar.");
    if (pmpv === 0) return setErro("O PMPV está zerado. Salve o PMPV do trimestre ou digite o valor antes de salvar.");
    setSalvando(true);
    try {
      const r = await salvarPVTrimestre(trimestre, ano, pmpv, pr);
      setAvisos([]);
      setSucesso(`PV de ${trimestre}, ano ${ano} salvo: R$ ${r.pv.toFixed(4)}. Gravado em ${r.gravado_em.join(", ")}.`);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o PV."));
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
          <h1 className="text-[1.75rem] font-bold tracking-tight text-white">{tituloDe("PV")}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Preço Final do trimestre — PV = PMPV + PR do mesmo trimestre</p>
        </div>
      </div>

      {erro && <Alert variant="error" className="whitespace-pre-line">{erro}</Alert>}
      {avisos.length > 0 && <Alert variant="warning" className="whitespace-pre-line">{avisos.join("\n")}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      <Card title="Trimestre">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Trimestre fiscal"
            value={trimestre}
            onChange={(e) => mudar(e.target.value, ano)}
            options={
              trimestres.length
                ? trimestres.map((t) => ({ value: t.label, label: t.label }))
                : [{ value: "", label: "(carregando…)" }]
            }
          />
          <Input
            label="Ano (do 1º mês)"
            type="number"
            value={ano}
            onChange={(e) => mudar(trimestre, Number(e.target.value))}
            error={anoValido ? undefined : `Entre ${ANO_MIN} e ${ANO_MAX}.`}
            className="w-32"
          />
          <Button variant="ghost" icon={<RefreshCw size={14} />} loading={carregando} onClick={() => carregar()}>
            Recarregar do banco
          </Button>
          <Button variant="ghost" icon={<Trash2 size={14} />} onClick={limpar}>
            Limpar
          </Button>
        </div>
        {periodos.length > 0 && (
          <p className="mt-3 text-xs text-zinc-500">Meses do trimestre: {periodos.join(", ")}</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title={tituloDe("PMPV")} subtitle="Do trimestre, em R$/m³">
          <Input
            label="PMPV (R$/m³)"
            type="number"
            step="0.0001"
            value={pmpv || ""}
            onChange={(e) => setPmpv(parseFloat(e.target.value) || 0)}
          />
        </Card>

        <Card title="PR — Parcela de Recuperação" subtitle="Do trimestre, em R$/m³">
          <Input
            label="PR (R$/m³)"
            type="number"
            step="0.0001"
            value={pr || ""}
            onChange={(e) => setPr(parseFloat(e.target.value) || 0)}
          />
          <p className="mt-2 text-xs text-zinc-500">
            PR = (SCG com SELIC + SR com SELIC do trimestre apurado) ÷ VP do trimestre do PR
          </p>
        </Card>
      </div>

      <Card className="border border-teal-500/20">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-zinc-400">PV = PMPV + PR =</span>
          <span className={`text-3xl font-extrabold ${colorForValue(pv)}`}>R$ {pv.toFixed(4)}</span>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="success" icon={<Save size={16} />} loading={salvando} disabled={!podeSalvar} onClick={salvar}>
          Salvar PV do trimestre
        </Button>
      </div>
      <p className="-mt-3 text-xs text-zinc-600">
        Salvar grava o PV no trimestre e repete o valor nos 3 meses, que é como o Excel Final lê.
      </p>
      </div>
    </div>
  );
}
