// Importações do React para criar contextos e hooks personalizados
import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Tipo Theme representa os temas disponíveis na aplicação
 * light: tema claro (padrão)
 * dark: tema escuro
 */
type Theme = "light" | "dark";

/**
 * Interface do tipo do contexto de tema
 * Define os dados e funções disponíveis no contexto
 */
interface ThemeContextType {
  theme: Theme; // Tema atual (light ou dark)
  toggleTheme?: () => void; // Função opcional para alternar entre temas
  switchable: boolean; // Indica se o tema pode ser alternado pelo usuário
}

/**
 * Criação do contexto de tema
 * Contexto do React para compartilhar estado de tema entre componentes
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Interface das props do ThemeProvider
 * Define as configurações do provider de tema
 */
interface ThemeProviderProps {
  children: React.ReactNode; // Componentes filhos que terão acesso ao contexto
  defaultTheme?: Theme; // Tema padrão (light ou dark)
  switchable?: boolean; // Permite ou não alternância de tema pelo usuário
}

/**
 * ThemeProvider é o componente provider do contexto de tema
 * Gerencia o estado do tema e o aplica ao documento
 * 
 * Funcionalidades:
 * - Define o tema padrão da aplicação
 * - Permite alternância entre temas light/dark se switchable=true
 * - Persiste a preferência do usuário no localStorage
 * - Aplica a classe 'dark' ao elemento root quando tema é dark
 * - Fornece hook useTheme para acessar o contexto
 * 
 * Modos de operação:
 * - switchable=false: tema fixo, não pode ser alterado pelo usuário
 * - switchable=true: tema pode ser alternado, preferência é persistida
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  // Estado para armazenar o tema atual
  // Inicializa com tema do localStorage se switchable, senão usa defaultTheme
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      // Se switchable, tenta recuperar tema salvo no localStorage
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    // Se não switchable, usa tema padrão
    return defaultTheme;
  });

  // Efeito para aplicar o tema ao documento e persistir no localStorage
  useEffect(() => {
    // Obtém elemento root do documento
    const root = document.documentElement;
    
    // Adiciona ou remove classe 'dark' baseado no tema
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Se switchable, persiste a preferência no localStorage
    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  // Função para alternar entre temas light e dark
  // Só disponível se switchable=true
  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  // Fornece o contexto aos componentes filhos
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook useTheme para acessar o contexto de tema
 * Deve ser usado dentro de um ThemeProvider
 * 
 * @returns Objeto com theme, toggleTheme e switchable
 * @throws Error se usado fora de ThemeProvider
 * 
 * @example
 * const { theme, toggleTheme } = useTheme();
 * <button onClick={toggleTheme}>Alternar Tema</button>
 */
export function useTheme() {
  // Obtém o contexto de tema
  const context = useContext(ThemeContext);
  
  // Valida se o hook está sendo usado dentro do provider
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  
  return context;
}
