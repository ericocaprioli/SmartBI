// Importação do componente Skeleton da biblioteca UI
// Skeleton é usado para criar placeholders de carregamento
import { Skeleton } from './ui/skeleton';

/**
 * DashboardLayoutSkeleton é um componente de esqueleto (skeleton loader)
 * Exibido enquanto o dashboard está carregando, antes que o estado de autenticação seja resolvido
 * Imita a estrutura visual do layout real com blocos cinza animados
 * Isso melhora a experiência do usuário ao fornecer feedback visual imediato
 */
export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Esqueleto da sidebar - imita a barra lateral de navegação */}
      <div className="w-[280px] border-r border-border bg-background p-4 space-y-6">
        {/* Área do logo/header da sidebar */}
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Itens do menu de navegação - 3 placeholders para itens do menu */}
        <div className="space-y-2 px-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Área do perfil do usuário na parte inferior da sidebar */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 px-1">
            {/* Avatar do usuário */}
            <Skeleton className="h-9 w-9 rounded-full" />
            {/* Nome e email do usuário */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Esqueleto do conteúdo principal - imita a área de conteúdo do dashboard */}
      <div className="flex-1 p-4 space-y-4">
        {/* Título/cabeçalho do conteúdo */}
        <Skeleton className="h-12 w-48 rounded-lg" />
        
        {/* Grid de cards/KPIs - 3 placeholders em grid responsiva */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        
        {/* Gráfico ou tabela principal - placeholder grande */}
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
