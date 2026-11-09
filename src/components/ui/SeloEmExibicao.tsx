import { Eye } from "lucide-react";

/** Selo neutro (não é "confere"): só diz qual mês está aberto na prova real. */
export function SeloEmExibicao() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[0.7rem] font-medium text-sky-300">
      <Eye size={12} aria-hidden /> em exibição
    </span>
  );
}
