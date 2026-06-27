// Importação do hook useRef do React
import { useRef } from "react";

// Importação do hook usePersistFn para preservar funções entre re-renders
import { usePersistFn } from "./usePersistFn";

/**
 * Interface de retorno do hook useComposition
 * Define os handlers e funções disponíveis após o uso do hook
 * 
 * @template T - Tipo do elemento HTML (input ou textarea)
 */
export interface UseCompositionReturn<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  /** Handler para início de composição (ex: ao começar a digitar IME) */
  onCompositionStart: React.CompositionEventHandler<T>;
  
  /** Handler para fim de composição (ex: ao finalizar digitação IME) */
  onCompositionEnd: React.CompositionEventHandler<T>;
  
  /** Handler para eventos de teclado */
  onKeyDown: React.KeyboardEventHandler<T>;
  
  /** Função para verificar se está em estado de composição */
  isComposing: () => boolean;
}

/**
 * Interface de opções do hook useComposition
 * Define os handlers opcionais que podem ser fornecidos
 * 
 * @template T - Tipo do elemento HTML (input ou textarea)
 */
export interface UseCompositionOptions<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  /** Handler opcional para eventos de teclado */
  onKeyDown?: React.KeyboardEventHandler<T>;
  
  /** Handler opcional para início de composição */
  onCompositionStart?: React.CompositionEventHandler<T>;
  
  /** Handler opcional para fim de composição */
  onCompositionEnd?: React.CompositionEventHandler<T>;
}

/**
 * Tipo para o retorno de setTimeout
 * Usado para armazenar referências aos timers
 */
type TimerResponse = ReturnType<typeof setTimeout>;

/**
 * Hook useComposition gerencia eventos de composição de texto (IME)
 * 
 * O que é composição (IME)?
 * - IME (Input Method Editor) é usado para digitar caracteres complexos (ex: chinês, japonês)
 * - Durante a composição, o usuário digita e o texto ainda não está confirmado
 * - Eventos de teclado durante composição não devem ser tratados normalmente
 * 
 * Funcionalidades:
 * - Detecta quando o usuário está usando IME (composição)
 * - Previne tratamento incorreto de teclas durante composição
 * - Resolve bug do Safari onde compositionEnd dispara antes de onKeyDown
 * - Usa dois níveis de setTimeout para garantir sincronização correta
 * - Bloqueia ESC e Enter durante composição para evitar ações indesejadas
 * 
 * Uso típico:
 * - Textareas ou inputs que suportam entrada de texto multilíngue
 * - Prevenir envio de formulário durante digitação IME
 * - Evitar ações de teclado durante composição
 * 
 * @param options - Handlers opcionais para eventos de composição e teclado
 * @returns Objeto com handlers e função para verificar estado de composição
 * 
 * @template T - Tipo do elemento HTML (padrão: HTMLInputElement)
 * 
 * @example
 * const { onKeyDown, onCompositionStart, onCompositionEnd } = useComposition();
 * <textarea
 *   onKeyDown={onKeyDown}
 *   onCompositionStart={onCompositionStart}
 *   onCompositionEnd={onCompositionEnd}
 * />
 */
export function useComposition<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement,
>(options: UseCompositionOptions<T> = {}): UseCompositionReturn<T> {
  // Extrai handlers originais das opções
  const {
    onKeyDown: originalOnKeyDown,
    onCompositionStart: originalOnCompositionStart,
    onCompositionEnd: originalOnCompositionEnd,
  } = options;

  // Referência para armazenar estado de composição
  // true se estiver em composição (digitando com IME), false caso contrário
  const c = useRef(false);
  
  // Timers para resolver bug do Safari
  // Usa dois níveis de setTimeout para garantir sincronização
  const timer = useRef<TimerResponse | null>(null);
  const timer2 = useRef<TimerResponse | null>(null);

  /**
   * Handler para início de composição
   * Chamado quando o usuário começa a digitar com IME
   * 
   * @param e - Evento de composição
   */
  const onCompositionStart = usePersistFn((e: React.CompositionEvent<T>) => {
    // Limpa timers existentes para evitar conflitos
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (timer2.current) {
      clearTimeout(timer2.current);
      timer2.current = null;
    }
    
    // Marca que está em estado de composição
    c.current = true;
    
    // Chama handler original se fornecido
    originalOnCompositionStart?.(e);
  });

  /**
   * Handler para fim de composição
   * Chamado quando o usuário finaliza digitação com IME
   * 
   * Usa dois níveis de setTimeout para resolver bug do Safari
   * onde compositionEnd dispara antes de onKeyDown
   * 
   * @param e - Evento de composição
   */
  const onCompositionEnd = usePersistFn((e: React.CompositionEvent<T>) => {
    // Primeiro timer: pequeno delay
    timer.current = setTimeout(() => {
      // Segundo timer: delay adicional para garantir sincronização
      timer2.current = setTimeout(() => {
        // Marca que não está mais em composição
        c.current = false;
      });
    });
    
    // Chama handler original se fornecido
    originalOnCompositionEnd?.(e);
  });

  /**
   * Handler para eventos de teclado
   * Bloqueia certas teclas durante composição
   * 
   * Teclas bloqueadas durante composição:
   - ESC: para evitar cancelamento indesejado
   - Enter (sem Shift): para evitar envio prematuro
   * 
   * @param e - Evento de teclado
   */
  const onKeyDown = usePersistFn((e: React.KeyboardEvent<T>) => {
    // Se estiver em composição e tecla for ESC ou Enter (sem Shift)
    if (
      c.current &&
      (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey))
    ) {
      // Previne propagação do evento
      e.stopPropagation();
      return;
    }
    
    // Chama handler original se fornecido
    originalOnKeyDown?.(e);
  });

  /**
   * Função para verificar se está em estado de composição
   * Útil para lógica condicional baseada no estado de composição
   * 
   * @returns true se estiver em composição, false caso contrário
   */
  const isComposing = usePersistFn(() => {
    return c.current;
  });

  // Retorna handlers e função de verificação
  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    isComposing,
  };
}
