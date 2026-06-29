// Importações de hooks personalizados para autenticação e responsividade
import { useAuth } from "@/_core/hooks/useAuth";

// Importações de componentes UI shadcn para avatar e menu dropdown
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Importações de componentes de sidebar para navegação lateral
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Importações de constantes para configuração de autenticação
import { getLoginUrl, isAuthConfigured } from "@/const";

// Importação de hook personalizado para detectar dispositivos móveis
import { useIsMobile } from "@/hooks/useMobile";

// Importações de ícones Lucide React para a interface
import { LayoutDashboard, LogOut, PanelLeft, Users, DollarSign, Factory, BarChart3, CalendarDays, TrendingUp, Calendar, Briefcase, ClipboardList, CreditCard } from "lucide-react";

// Importações de React para gerenciamento de estado e efeitos
import { CSSProperties, useEffect, useRef, useState } from "react";

// Importação do hook de roteamento Wouter para navegação
import { useLocation } from "wouter";

// Importação do componente de esqueleto para estado de carregamento
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';

// Importação do componente Button da biblioteca UI
import { Button } from "./ui/button";

// Configuração dos itens do menu de navegação da sidebar
// Cada item contém: ícone, label (texto exibido) e caminho da rota
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Cadastro de Funcionário", path: "/funcionarios" },
  { icon: DollarSign, label: "Pagamentos", path: "/pagamentos" },
  { icon: Factory, label: "Produção", path: "/producao" },
  { icon: BarChart3, label: "Dashboard Produção", path: "/dashboard-producao" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: CalendarDays, label: "Visão Anual", path: "/visao-anual" },
  { icon: TrendingUp, label: "Cotações", path: "/cotacoes" },
  { icon: Calendar, label: "Cadastro de Meses/Anos", path: "/admin-meses" },
  { icon: Briefcase, label: "Cadastro de Funções", path: "/admin-funcoes" },
  { icon: ClipboardList, label: "Cadastro de Situações", path: "/admin-situacoes" },
  { icon: CreditCard, label: "Formas de Pagamento", path: "/admin-formas-pagamento" },
];

// Constantes para gerenciamento da largura da sidebar
// SIDEBAR_WIDTH_KEY: chave usada no localStorage para persistir a largura
// DEFAULT_WIDTH: largura padrão da sidebar em pixels
// MIN_WIDTH: largura mínima permitida para redimensionamento
// MAX_WIDTH: largura máxima permitida para redimensionamento
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

/**
 * DashboardLayout é o componente wrapper principal das páginas do dashboard.
 * Responsabilidades:
 * - Gerenciar controle de autenticação e redirecionamento
 * - Permitir redimensionamento e colapso da sidebar
 * - Fornecer fallback em modo convidado quando autenticação não está configurada
 * - Persistir preferências de largura da sidebar no localStorage
 * 
 * @param children - Componentes filhos a serem renderizados dentro do layout
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Estado para controlar a largura da sidebar
  // Inicializa com valor salvo no localStorage ou usa valor padrão
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  // Hook de autenticação para obter estado de loading e usuário atual
  const { loading, user } = useAuth();
  
  // Verifica se a autenticação está configurada no sistema
  const authConfigured = isAuthConfigured();
  
  // Obtém URL de login configurada
  const loginUrl = getLoginUrl();

  // Efeito para persistir a largura da sidebar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Estado de carregamento: exibe esqueleto enquanto autenticação está sendo verificada
  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  // Caso autenticação esteja configurada mas não há usuário logado
  // Redireciona para tela de login
  if (!user && authConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = loginUrl;
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  // Caso autenticação não esteja configurada e não há usuário
  // Renderiza UI em modo convidado (guest mode)
  // Permite explorar o dashboard sem login, mas alguns dados podem não estar disponíveis
  if (!user && !authConfigured) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <div className="min-h-screen flex-1 min-w-0">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 p-6">
            <h2 className="text-xl font-semibold">Guest mode enabled</h2>
            <p className="mt-2 text-sm">
              Authentication is not configured. You can still explore the dashboard UI, but some API data may be unavailable.
            </p>
          </div>
          <DashboardLayoutContent setSidebarWidth={setSidebarWidth} sidebarWidth={sidebarWidth}>
            {children}
          </DashboardLayoutContent>
        </div>
      </SidebarProvider>
    );
  }

  // Caso usuário esteja autenticado ou modo convidado está ativo
  // Renderiza o layout completo com sidebar e conteúdo
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} sidebarWidth={sidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

/**
 * Tipagem das props do componente DashboardLayoutContent
 * Este é o wrapper interno que contém a sidebar e o conteúdo principal
 */
type DashboardLayoutContentProps = {
  children: React.ReactNode; // Conteúdo a ser renderizado
  setSidebarWidth: (width: number) => void; // Função para atualizar largura da sidebar
  sidebarWidth: number; // Largura atual da sidebar
};

/**
 * DashboardLayoutContent é o componente interno que renderiza:
 * - Sidebar com menu de navegação
 * - Menu de usuário com opção de logout
 * - Área principal de conteúdo
 * - Funcionalidade de redimensionamento da sidebar
 * 
 * Este componente só é renderizado após as condições de autenticação serem resolvidas
 */
function DashboardLayoutContent({
  children,
  setSidebarWidth,
  sidebarWidth,
}: DashboardLayoutContentProps) {
  // Hook de autenticação para obter dados do usuário e função de logout
  const { user, logout } = useAuth();

  // Hook do Wouter para obter rota atual e função de navegação
  const [location, setLocation] = useLocation();

  // Hook do provider de sidebar para obter estado e função de toggle
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Estado para controlar se a sidebar está sendo redimensionada
  const [isResizing, setIsResizing] = useState(false);
  
  // Referência ao elemento DOM do container da sidebar
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Encontra o item de menu ativo baseado na rota atual
  const activeMenuItem = menuItems.find(item => item.path === location);
  
  // Hook para detectar se está em dispositivo móvel
  const isMobile = useIsMobile();

  // Efeito: encerra redimensionamento se a sidebar for colapsada durante o arraste
  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  // Efeito: gerencia eventos de mouse para redimensionamento da sidebar
  useEffect(() => {
    // Função que calcula nova largura baseada na posição do mouse
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      
      // Limita a largura entre mínimo e máximo
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    // Função que encerra o modo de redimensionamento
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    // Adiciona listeners de mouse apenas durante redimensionamento
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    // Cleanup: remove listeners e restaura cursor
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Renderiza o shell completo do dashboard
  return (
    <div className="relative flex min-h-screen" ref={sidebarRef}>
      {/* Componente Sidebar com configurações de colapso e estilo glassmorphism */}
      <Sidebar
        collapsible="icon"
        className="border-r-0 glass-card"
        disableTransition={isResizing}
      >
        {/* Header da sidebar com botão de toggle e título */}
        <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              {/* Botão para colapsar/expandir sidebar */}
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {/* Título "Navigation" exibido apenas quando sidebar não está colapsada */}
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          {/* Conteúdo da sidebar com menu de navegação */}
          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {/* Mapeia os itens do menu e renderiza cada um */}
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${isActive ? "glass-card-gradient" : ""}`}
                    >
                      {/* Ícone do item de menu */}
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      {/* Label do item com gradiente se ativo */}
                      <span className={isActive ? "gradient-text" : ""}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer da sidebar com menu de usuário */}
          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Botão do menu de usuário com avatar e informações */}
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    {/* Fallback do avatar com primeira letra do nome do usuário */}
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Informações do usuário (nome e email) */}
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              {/* Conteúdo do dropdown com opção de logout */}
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        
        {/* Alça de redimensionamento: área invisível à direita da sidebar que inicia o redimensionamento ao arrastar */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />

        {/* Área principal de conteúdo (SidebarInset) */}
        <SidebarInset className="flex-1 min-w-0">
          <div className="flex-1 p-4">{children}</div>
        </SidebarInset>
    </div>
  );
}
