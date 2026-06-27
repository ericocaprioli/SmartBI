// Importação do componente Button da UI
import { Button } from "@/components/ui/button";

// Importação dos componentes Card e CardContent da UI
import { Card, CardContent } from "@/components/ui/card";

// Importação de ícones do Lucide React
import { AlertCircle, Home } from "lucide-react";

// Importação do hook useLocation do Wouter para navegação
import { useLocation } from "wouter";

/**
 * NotFound é a página exibida quando uma rota não é encontrada
 * 
 * Funcionalidades:
 * - Exibe mensagem amigável de erro 404
 * - Fornece botão para voltar à página inicial
 * - Usa gradiente de fundo para visual atraente
 * - Animação pulsante no ícone de alerta
 * - Design responsivo com card centralizado
 * 
 * Uso:
 * - Renderizado automaticamente pelo Router quando nenhuma rota corresponde
 * - Pode ser acessado explicitamente via /404
 */
export default function NotFound() {
  // Hook useLocation do Wouter para navegação programática
  const [, setLocation] = useLocation();

  /**
   * Função para redirecionar para a página inicial
   * Usa setLocation do Wouter para navegar para "/"
   */
  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    // Container principal com gradiente de fundo
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Card centralizado com efeito de vidro (backdrop blur) */}
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Ícone de alerta com animação pulsante */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Círculo vermelho pulsante ao redor do ícone */}
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              {/* Ícone AlertCircle em vermelho */}
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          {/* Título principal com código de erro */}
          <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>

          {/* Subtítulo descritivo */}
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Page Not Found
          </h2>

          {/* Mensagem explicativa */}
          <p className="text-slate-600 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          {/* Grupo de botões para ações */}
          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            {/* Botão para voltar à página inicial */}
            <Button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {/* Ícone de casa */}
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
