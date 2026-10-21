import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { useAuth } from "../../auth/AuthContext";
import { mensagemDeErro } from "../../api/client";

export default function CadastroPage() {
  const { cadastrar } = useAuth();
  const navegar = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const senhaCurta = senha.length > 0 && senha.length < 8;
  const naoConfere = confirmar.length > 0 && confirmar !== senha;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 8) return setErro("A senha deve ter pelo menos 8 caracteres.");
    if (senha !== confirmar) return setErro("As senhas não coincidem.");
    setEnviando(true);
    try {
      await cadastrar({ nome, email, senha, confirmar_senha: confirmar });
      navegar("/", { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível criar a conta. Confira os campos e tente de novo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthShell
      titulo="Criar conta"
      subtitulo="Preencha os dados para acessar a plataforma."
      rodape={<>Já tem conta? <Link to="/login" className="text-sky-400 hover:underline">Entrar</Link></>}
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {erro && <Alert variant="error" className="whitespace-pre-line">{erro}</Alert>}
        <Input label="Nome" autoComplete="name" required autoFocus
          icon={<User size={15} />} placeholder="Seu nome"
          value={nome} onChange={(e) => setNome(e.target.value)} />
        <Input label="E-mail" type="email" autoComplete="email" required
          icon={<Mail size={15} />} placeholder="voce@empresa.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" type="password" autoComplete="new-password" required
          icon={<Lock size={15} />} placeholder="Mínimo de 8 caracteres"
          error={senhaCurta ? "Mínimo de 8 caracteres." : undefined}
          value={senha} onChange={(e) => setSenha(e.target.value)} />
        <Input label="Repita a senha" type="password" autoComplete="new-password" required
          icon={<Lock size={15} />} placeholder="Digite a senha novamente"
          error={naoConfere ? "As senhas não coincidem." : undefined}
          value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        <Button type="submit" loading={enviando} className="mt-1 w-full justify-center">Criar conta</Button>
      </form>
    </AuthShell>
  );
}
