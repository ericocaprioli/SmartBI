// Importação do hook useAuth para gerenciar autenticação
import { useAuth } from "@/_core/hooks/useAuth";

// Importação do componente Button da UI
import { Button } from "@/components/ui/button";

// Importação do ícone Loader2 do Lucide React
import { Loader2 } from "lucide-react";

// Importação da função getLoginUrl para redirecionamento de login
import { getLoginUrl } from "@/const";

// Importação do componente Streamdown para renderização de Markdown
import { Streamdown } from 'streamdown';

/**
 * Home é a página inicial da aplicação
 * 
 * NOTA: Todo o conteúdo desta página é apenas um exemplo
 * Substitua com sua própria implementação de funcionalidades
 * 
 * Ao construir páginas, lembre-se das instruções em:
 * - Frontend Workflow
 * - Frontend Best Practices
 * - Design Guide
 * - Common Pitfalls
 * 
 * Funcionalidades demonstradas:
 * - Hook useAuth para estado de autenticação
 * - Ícones do Lucide React
 * - Renderização de Markdown com Streamdown
 * - Componentes UI (Button)
 * - Gerenciamento de tema (comentado)
 */
export default function Home() {
  /**
   * Hook useAuth fornece estado de autenticação
   * 
   * Retorna:
   * - user: dados do usuário autenticado
   * - loading: estado de carregamento
   * - error: erro de autenticação se houver
   * - isAuthenticated: boolean indicando se usuário está autenticado
   * - logout: função para fazer logout
   * 
   * Para implementar login/logout:
   * - Chame logout() para fazer logout
   * - Redirecione para getLoginUrl() para fazer login
   */
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  return (
    // Container principal com altura mínima da tela
    <div className="min-h-screen flex flex-col">
      <main>
        {/* Exemplo: ícones do Lucide React */}
        {/* Loader2 com animação de rotação */}
        <Loader2 className="animate-spin" />
        
        {/* Texto de exemplo */}
        Example Page
        
        {/* Exemplo: renderização de Markdown com Streamdown */}
        {/* Streamdown converte Markdown para HTML */}
        <Streamdown>Any **markdown** content</Streamdown>
        
        {/* Exemplo: componente Button da UI */}
        <Button variant="default">Example Button</Button>
      </main>
    </div>
  );
}
