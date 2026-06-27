// Importação da função utilitária cn para mesclar classes CSS condicionalmente
import { cn } from "@/lib/utils";

// Importação de ícones Lucide React para a interface de erro
import { AlertTriangle, RotateCcw } from "lucide-react";

// Importações de React para criar componente de classe
import { Component, ReactNode } from "react";

/**
 * Interface das props do ErrorBoundary
 * children: componentes filhos que serão envolvidos pelo boundary
 */
interface Props {
  children: ReactNode;
}

/**
 * Interface do estado do ErrorBoundary
 * hasError: indica se ocorreu um erro em algum componente filho
 * error: objeto Error contendo detalhes do erro ocorrido
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary é um componente de classe do React que captura erros
 * em componentes filhos durante o ciclo de renderização
 * 
 * Responsabilidades:
 * - Capturar erros JavaScript em qualquer lugar da árvore de componentes
 * - Exibir uma UI de fallback amigável quando ocorre um erro
 * - Evitar que a aplicação inteira quebre devido a um erro em um componente
 * - Permitir que o usuário recarregue a página para tentar recuperar
 * 
 * É especialmente útil em produção para evitar telas brancas e fornecer
 * feedback útil ao usuário sobre o que aconteceu
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Inicializa o estado sem erros
    // hasError: false indica que não há erros inicialmente
    // error: null indica que não há objeto de erro
    this.state = { hasError: false, error: null };
  }

  /**
   * Método estático do ciclo de vida do React
   * Chamado automaticamente quando um erro é lançado por um componente filho
   * Atualiza o estado para indicar que ocorreu um erro e armazena o erro
   * 
   * @param error - O erro que foi lançado
   * @returns Novo estado com hasError=true e o erro capturado
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Método render do React
   * Decide o que renderizar baseado no estado atual
   * Se houver erro, exibe UI de fallback; caso contrário, renderiza filhos normalmente
   */
  render() {
    // Se ocorreu um erro, exibe a tela de erro amigável
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            {/* Ícone de alerta indicando erro */}
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            {/* Título da mensagem de erro */}
            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            {/* Área scrollável mostrando o stack trace do erro para debug */}
            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            {/* Botão para recarregar a página e tentar recuperar */}
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // Se não houver erro, renderiza os componentes filhos normalmente
    // O ErrorBoundary é transparente quando não há erros
    return this.props.children;
  }
}

export default ErrorBoundary;
