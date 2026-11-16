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
})
