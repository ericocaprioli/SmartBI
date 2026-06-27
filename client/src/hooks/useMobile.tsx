// Importação do React para usar hooks
import * as React from "react";

/**
 * Constante que define o breakpoint para dispositivos móveis
 * Largura em pixels abaixo da qual a tela é considerada móvel
 * 768px é o breakpoint padrão para tablets (padrão Tailwind: md)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook useIsMobile detecta se a tela atual é de um dispositivo móvel
 * 
 * Funcionalidades:
 * - Detecta se a largura da janela é menor que o breakpoint
 * - Atualiza automaticamente quando a janela é redimensionada
 * - Usa MediaQuery API para detecção responsiva
 * - Retorna booleano indicando se é mobile
 * 
 * Uso típico:
 * - Ajustar layout para mobile vs desktop
 * - Mostrar/ocultar elementos baseados no tamanho da tela
 * - Alterar comportamento de componentes em mobile
 * 
 * @returns true se a tela for menor que 768px, false caso contrário
 * 
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   // Renderizar versão mobile
 * } else {
 *   // Renderizar versão desktop
 * }
 */
export function useIsMobile() {
  // Estado para armazenar se é mobile
  // Inicializa como undefined para evitar flash de conteúdo incorreto
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  // Efeito para configurar listener de redimensionamento
  React.useEffect(() => {
    // Cria MediaQuery para detectar telas menores que o breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Função callback chamada quando o estado da media query muda
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Adiciona listener para mudanças na media query
    mql.addEventListener("change", onChange);
    
    // Define estado inicial baseado na largura atual
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Cleanup: remove listener quando componente desmonta
    return () => mql.removeEventListener("change", onChange);
  }, []); // Array vazio: executa apenas na montagem

  // Converte para booleano (true se isMobile for true, false caso contrário)
  // O !! garante que undefined se torna false
  return !!isMobile;
}
