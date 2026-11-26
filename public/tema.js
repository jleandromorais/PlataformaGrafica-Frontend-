// Aplica o tema antes de desenhar a página (evita piscar claro↔escuro).
// Escuro é o padrão; o claro vale só para quem escolheu no menu.
// Fica num arquivo (não dentro do index.html) para o CSP do vercel.json não precisar liberar script embutido.
(function () {
  var t = null;
  try { t = localStorage.getItem("cg_tema"); } catch (e) {}
  var escuro = t !== "claro";
  document.documentElement.dataset.theme = escuro ? "dark" : "light";
})();
