import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Config própria dos testes. O pool padrão do vitest 5 com o vite 8 dá o erro
// "Cannot read properties of undefined (reading 'config')" (o vitest é carregado
// duas vezes e o "describe" não acha o executor). O pool vmThreads isola cada
// arquivo num contexto próprio e evita o problema.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    pool: 'vmThreads',
  },
  // O pool vmThreads carrega o react-router-dom pelo build CJS (condição "node"), que faz
  // require de um .mjs e quebra com "Cannot use import statement outside a module"
  // (server.deps.inline é ignorado nesse pool). Apontar para o build ESM resolve.
  resolve: { alias: { 'react-router-dom': fileURLToPath(new URL('./node_modules/react-router-dom/dist/index.mjs', import.meta.url)) } },
})
