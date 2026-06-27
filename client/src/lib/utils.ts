// Importação da biblioteca clsx para mesclar classes CSS condicionalmente
// clsx permite criar strings de classes baseadas em condições
import { clsx, type ClassValue } from "clsx";

// Importação da biblioteca tailwind-merge para mesclar classes Tailwind
// twMerge resolve conflitos entre classes Tailwind (ex: 'p-4' vs 'p-2')
import { twMerge } from "tailwind-merge";

/**
 * Função utilitária cn (className) para mesclar classes CSS
 * Combina clsx e twMerge para:
 * 1. Criar strings de classes condicionalmente com clsx
 * 2. Resolver conflitos entre classes Tailwind com twMerge
 * 
 * Uso típico:
 * - Mesclar classes padrão com classes personalizadas
 * - Adicionar classes condicionalmente baseadas em estado
 * - Garantir que classes conflitantes sejam resolvidas corretamente
 * 
 * @param inputs - Array de valores de classe (strings, objetos, arrays)
 * @returns String de classes CSS mesclada e otimizada
 * 
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", "hover:bg-blue-600")
 * // Retorna: "px-4 py-2 bg-blue-500 hover:bg-blue-600" (se isActive for true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
