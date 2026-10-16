import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { useAuth } from "../../auth/AuthContext";
import { mensagemDeErro } from "../../api/client";

export default function LoginPage() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const destino = (local.state as { de?: string } | null)?.de ?? "/";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await entrar(email, senha);
      navegar(destino, { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível entrar."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthShell
      titulo="Entrar"
      subtitulo="Acesse a plataforma com seu e-mail e senha."
      rodape={<>Não tem conta? <Link to="/cadastro" className="text-sky-400 hover:underline">Criar conta</Link></>}
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {erro && <Alert variant="error">{erro}</Alert>}
        <Input label="E-mail" type="email" autoComplete="email" required autoFocus
          icon={<Mail size={15} />} placeholder="voce@empresa.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" type="password" autoComplete="current-password" required
          icon={<Lock size={15} />} placeholder="Sua senha"
          value={senha} onChange={(e) => setSenha(e.target.value)} />
        <Button type="submit" loading={enviando} className="mt-1 w-full justify-center">Entrar</Button>
      </form>
    </AuthShell>
  );
}
