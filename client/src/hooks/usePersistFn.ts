// Importação do hook useRef do React
import { useRef } from "react";

/**
 * Tipo noop representa qualquer função que aceita qualquer número de argumentos
 * e retorna qualquer valor
 * Usado como tipo genérico para funções no usePersistFn
 */
type noop = (...args: any[]) => any;

/**
 * Hook usePersistFn preserva a referência de uma função entre re-renders
 * Alternativa ao useCallback que reduz a carga cognitiva
 * 
 * Funcionalidades:
 * - Mantém a mesma referência de função entre re-renders
 * - Sempre executa a versão mais recente da função
 * - Não precisa de array de dependências (diferente de useCallback)
 * - Útil para funções que são passadas como props ou usadas em efeitos
 * 
 * Vantagens sobre useCallback:
 * - Não precisa gerenciar array de dependências
 * - Menos propenso a bugs por dependências esquecidas
 * - Referência estável entre re-renders
 * 
 * @param fn - Função a ser persistida
 * @returns Função com referência estável que sempre executa a versão mais recente
 * 
 * @example
 * const init = usePersistFn(async () => {
 *   await loadData();
 * });
 * useEffect(() => {
 *   init();
 * }, [init]); // init nunca muda, então efeito roda apenas uma vez
 */
export function usePersistFn<T extends noop>(fn: T) {
  // Referência para armazenar a função atual
  // Atualizada em cada render para sempre ter a versão mais recente
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  // Referência para a função persistida (wrapper estável)
  // Criada apenas uma vez na primeira execução
  const persistFn = useRef<T>(null);
  if (!persistFn.current) {
    // Cria função wrapper que sempre executa fnRef.current
    // A referência desta função nunca muda, mas ela sempre chama a versão mais recente
    persistFn.current = function (this: unknown, ...args) {
      return fnRef.current!.apply(this, args);
    } as T;
  }

  // Retorna a função persistida com referência estável
  return persistFn.current!;
}
