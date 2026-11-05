/** Memória da tela que sobrevive a recarregar a página: um "guarda-volumes" no
 * próprio navegador (IndexedDB), só desta pessoa e deste computador. Nada vai ao
 * servidor. Guarda o que o localStorage não aceita: a pasta escolhida e resultados grandes.
 * Se o navegador bloquear (janela anônima, dados apagados), a tela só não lembra. */

const BANCO = "cg_memoria";
const GAVETA = "itens";

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, falha) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(GAVETA);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => falha(req.error);
  });
}

async function naGaveta<T>(modo: IDBTransactionMode, acao: (g: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await abrir();
  try {
    return await new Promise<T>((ok, falha) => {
      const req = acao(db.transaction(GAVETA, modo).objectStore(GAVETA));
      req.onsuccess = () => ok(req.result as T);
      req.onerror = () => falha(req.error);
    });
  } finally {
    db.close();
  }
}

export async function lembrar<T>(chave: string): Promise<T | undefined> {
  try {
    return await naGaveta<T | undefined>("readonly", (g) => g.get(chave));
  } catch {
    return undefined;
  }
}

export async function guardar(chave: string, valor: unknown): Promise<void> {
  try {
    await naGaveta("readwrite", (g) => g.put(valor, chave));
  } catch {
    // sem memória no navegador: a tela segue funcionando, só não lembra
  }
}

export async function esquecer(chave: string): Promise<void> {
  try {
    await naGaveta("readwrite", (g) => g.delete(chave));
  } catch {
    // idem
  }
}
