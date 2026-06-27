import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Funcionarios from "./pages/Funcionarios";
import Pagamentos from "./pages/Pagamentos";
import Producao from "./pages/Producao";
import DashboardProducao from "./pages/DashboardProducao";
import Relatorios from "./pages/Relatorios";
import VisaoAnual from "./pages/VisaoAnual";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/funcionarios"} component={Funcionarios} />
      <Route path={"/pagamentos"} component={Pagamentos} />
      <Route path={"/producao"} component={Producao} />
      <Route path={"/dashboard-producao"} component={DashboardProducao} />
      <Route path={"/relatorios"} component={Relatorios} />
      <Route path={"/visao-anual"} component={VisaoAnual} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
