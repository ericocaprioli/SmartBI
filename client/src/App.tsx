// Importação do componente Toaster para notificações toast
import { Toaster } from "@/components/ui/sonner";

// Importação do TooltipProvider para tooltips em toda a aplicação
import { TooltipProvider } from "@/components/ui/tooltip";

// Importação da página NotFound para rotas não encontradas
import NotFound from "@/pages/NotFound";

// Importação de componentes de roteamento do Wouter
import { Route, Switch } from "wouter";

// Importação do ErrorBoundary para capturar erros na aplicação
import ErrorBoundary from "./components/ErrorBoundary";

// Importação do ThemeProvider para gerenciar tema da aplicação
import { ThemeProvider } from "./contexts/ThemeContext";

// Importação do componente Particles para fundo animado
import Particles from "./components/Particles";

// Importação das páginas da aplicação
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Funcionarios from "./pages/Funcionarios";
import Pagamentos from "./pages/Pagamentos";
import Producao from "./pages/Producao";
import DashboardProducao from "./pages/DashboardProducao";
import Relatorios from "./pages/Relatorios";
import VisaoAnual from "./pages/VisaoAnual";

/**
 * Router define as rotas da aplicação usando Wouter
 * 
 * Funcionalidades:
 * - Mapeia URLs para componentes de página
 * - Usa Switch para selecionar a primeira rota que corresponde
 * - Rota fallback (/404) para URLs não encontradas
 * - Rota final fallback para qualquer URL não correspondida
 * 
 * Nota: Considere se você precisa de autenticação para certas rotas
 * Atualmente, todas as rotas são públicas
 */
function Router() {
  return (
    <Switch>
      {/* Rota raiz redireciona para Dashboard */}
      <Route path={"/"} component={Dashboard} />
      
      {/* Rotas principais da aplicação */}
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/funcionarios"} component={Funcionarios} />
      <Route path={"/pagamentos"} component={Pagamentos} />
      <Route path={"/producao"} component={Producao} />
      <Route path={"/dashboard-producao"} component={DashboardProducao} />
      <Route path={"/relatorios"} component={Relatorios} />
      <Route path={"/visao-anual"} component={VisaoAnual} />
      
      {/* Rota 404 explícita */}
      <Route path={"/404"} component={NotFound} />
      
      {/* Rota fallback final - captura qualquer URL não correspondida */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * NOTA SOBRE TEMA:
 * - Primeiro escolha um tema padrão de acordo com seu estilo de design (dark ou light bg)
 * - Depois altere a paleta de cores em index.css para manter cores de foreground/background consistentes
 * - Se você quiser tornar o tema alternável, passe `switchable` para ThemeProvider e use o hook `useTheme`
 */

/**
 * App é o componente raiz da aplicação
 * 
 * Estrutura de providers:
 * 1. ErrorBoundary: Captura erros em toda a aplicação
 * 2. ThemeProvider: Gerencia tema (light/dark)
 * 3. TooltipProvider: Habilita tooltips em toda a aplicação
 * 4. Particles: Renderiza fundo animado com partículas
 * 5. Toaster: Componente para notificações toast
 * 6. Router: Sistema de roteamento
 * 
 * Esta estrutura garante que:
 * - Erros são capturados e exibidos amigavelmente
 * - O tema é aplicado consistentemente
 * - Tooltips funcionam em toda a aplicação
 * - O fundo animado está sempre presente
 * - Notificações podem ser exibidas
 * - O roteamento funciona corretamente
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable // Descomente para permitir alternância de tema
      >
        <TooltipProvider>
          {/* Componente de partículas para fundo animado */}
          <Particles />
          
          {/* Componente para notificações toast */}
          <Toaster />
          
          {/* Sistema de roteamento */}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
