// Importação de hooks do React para gerenciar estado e efeitos
import { useState, useMemo, useEffect } from "react";

// Importação do cliente tRPC para chamadas de API
import { trpc } from "@/lib/trpc";

// Importação de componentes UI
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Importação de componentes de gráficos do Recharts
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Importação do layout do dashboard
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Lista de meses disponíveis para seleção no dashboard
 * Cada objeto contém valor (formato YYYY-MM) e label exibido
 */
const MESES = [
  { value: "2026-01", label: "Janeiro 2026" },
  { value: "2026-02", label: "Fevereiro 2026" },
  { value: "2026-03", label: "Março 2026" },
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-05", label: "Maio 2026" },
  { value: "2026-06", label: "Junho 2026" },
];

/**
 * Paleta de cores para gráficos
 * Usa formato OKLCH para cores vibrantes e modernas
 */
const CORES = [
  "oklch(0.7 0.25 280)", // Roxo
  "oklch(0.65 0.25 220)", // Azul
  "oklch(0.7 0.25 180)", // Ciano
  "oklch(0.6 0.25 140)", // Verde
  "oklch(0.65 0.25 320)", // Rosa
];

/**
 * Lista de widgets disponíveis no dashboard
 * Cada widget tem uma chave única e um label exibido
 * Inclui KPIs e gráficos
 */
const DASHBOARD_WIDGETS = [
  { key: "kpiTotalSalarios", label: "Total Salários" },
  { key: "kpiTotalDescontos", label: "Total Descontos" },
  { key: "kpiMediaSalarial", label: "Média Salarial" },
  { key: "kpiFuncionariosAtivos", label: "Funcionários Ativos" },
  { key: "kpiCustoTotalFolha", label: "Custo Total da Folha" },
  { key: "chartSalariosPorFuncionario", label: "Gráfico de Salários" },
  { key: "chartProducaoMetaRealizado", label: "Gráfico Meta vs Realizado" },
  { key: "chartDistribuicaoSituacao", label: "Gráfico de Distribuição por Situação" },
  { key: "chartDescontosPorFuncionario", label: "Gráfico de Descontos" },
];

/**
 * Estado padrão dos widgets (todos ativados)
 * Reduz a lista de widgets para um objeto com chaves como true
 */
const defaultWidgetState = DASHBOARD_WIDGETS.reduce((acc, widget) => {
  acc[widget.key] = true;
  return acc;
}, {} as Record<string, boolean>);

/**
 * Dashboard é a página principal de visualização de métricas
 * 
 * Funcionalidades:
 * - Seleção de mês para análise
 * - Personalização de widgets (KPIs e gráficos)
 * - Persistência de preferências no localStorage
 * - Exibição de KPIs principais (salários, descontos, média, funcionários, custo)
 * - Gráficos de salários por funcionário
 * - Gráfico de produção (meta vs realizado)
 * - Gráfico de distribuição por situação contratual
 * - Gráfico de descontos por funcionário
 * - Animações e efeitos visuais modernos
 * 
 * Componentes UI utilizados:
 * - DashboardLayout: layout padrão do dashboard
 * - Select: dropdown para seleção de mês
 * - Checkbox: para ativar/desativar widgets
 * - Recharts: biblioteca de gráficos
 */
export default function Dashboard() {
  // Estado para mês selecionado (padrão: junho 2026)
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  // Estado para widgets selecionados (persistido no localStorage)
  const [selectedWidgets, setSelectedWidgets] = useState<Record<string, boolean>>(() => {
    // Se não estiver no navegador, retorna estado padrão
    if (typeof window === "undefined") return defaultWidgetState;
    try {
      // Tenta recuperar preferências salvas
      const saved = window.localStorage.getItem("dashboardWidgets");
      return saved ? JSON.parse(saved) : defaultWidgetState;
    } catch {
      // Em caso de erro, retorna estado padrão
      return defaultWidgetState;
    }
  });

  // Efeito para persistir preferências no localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem("dashboardWidgets", JSON.stringify(selectedWidgets));
    } catch {
      // Ignora falhas de armazenamento
    }
  }, [selectedWidgets]);

  /**
 * toggleWidget alterna a visibilidade de um widget
 * @param key - Chave do widget a alternar
 */
  const toggleWidget = (key: string) => {
    setSelectedWidgets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  // Queries tRPC para obter dados
  const { data: kpis } = trpc.dashboard.getKPIs.useQuery(mesSelecionado);
  const { data: pagamentos } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  const { data: producao } = trpc.producao.listByMes.useQuery(mesSelecionado);
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();

  /**
 * chartData prepara dados para gráfico de salários e descontos
 * Mapeia pagamentos para formato compatível com Recharts
 */
  const chartData = useMemo(() => {
    if (!pagamentos) return [];
    return pagamentos.map((p, idx) => ({
      nome: `Func ${idx + 1}`,
      salario: p.salario_liquido || 0,
      desconto: (p.inss || 0) + (p.desconto_diversos || 0),
    }));
  }, [pagamentos]);

  /**
 * produtividadeData prepara dados para gráfico de produção
 * Mapeia produção para formato compatível com Recharts
 */
  const produtividadeData = useMemo(() => {
    if (!producao) return [];
    return producao.map((p, idx) => ({
      nome: `Func ${idx + 1}`,
      meta: p.meta_mes || 0,
      realizado: p.producao_realizada || 0,
    }));
  }, [producao]);

  /**
 * distribuicaoData prepara dados para gráfico de pizza
 * Conta funcionários por situação contratual
 */
  const distribuicaoData = useMemo(() => {
    if (!funcionarios) return [];
    // Reduz funcionários para contagem por situação
    const dist = funcionarios.reduce((acc: Record<string, number>, f) => {
      acc[f.situacao] = (acc[f.situacao] || 0) + 1;
      return acc;
    }, {});
    // Converte para formato do gráfico de pizza
    return Object.entries(dist).map(([situacao, count]) => ({
      name: situacao,
      value: count,
    }));
  }, [funcionarios]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e seleção de mês */}
        <div className="glass-card-gradient p-6 animate-pulse-glow">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">DASHBOARD EXECUTIVO</h1>
              <p className="text-muted-foreground dimension-marker">Gestão de Folha de Pagamento e Produção</p>
            </div>
            {/* Dropdown para seleção de mês */}
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-48 glass-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card">
                {MESES.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Painel de personalização de widgets */}
        <div className="glass-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold gradient-text">Dashboard Customizável</h2>
              <p className="text-muted-foreground text-sm">Escolha quais gráficos e indicadores exibidos.</p>
            </div>
          </div>
          {/* Grid de checkboxes para ativar/desativar widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DASHBOARD_WIDGETS.map((widget) => (
              <div key={widget.key} className="flex items-center gap-3 rounded glass-card p-3">
                <Checkbox
                  id={widget.key}
                  checked={selectedWidgets[widget.key]}
                  onCheckedChange={() => toggleWidget(widget.key)}
                />
                <Label htmlFor={widget.key} className="text-white">
                  {widget.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs Principais - Cards com métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* KPI: Total Salários */}
          {selectedWidgets.kpiTotalSalarios && (
            <div className="glass-card-gradient animate-float animate-fade-in-up animate-delay-1">
              <p className="dimension-marker mb-2">TOTAL SALÁRIOS</p>
              {/* Converte centavos para reais */}
              <p className="text-2xl font-bold gradient-text">
                R$ {((kpis?.totalSalarios || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {/* KPI: Total Descontos (em vermelho) */}
          {selectedWidgets.kpiTotalDescontos && (
            <div className="glass-card-gradient animate-float animate-fade-in-up animate-delay-2" style={{ animationDelay: '0.5s' }}>
              <p className="dimension-marker mb-2">TOTAL DESCONTOS</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {((kpis?.totalDescontos || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {/* KPI: Média Salarial */}
          {selectedWidgets.kpiMediaSalarial && (
            <div className="glass-card-gradient animate-float animate-fade-in-up animate-delay-3" style={{ animationDelay: '1s' }}>
              <p className="dimension-marker mb-2">MÉDIA SALARIAL</p>
              <p className="text-2xl font-bold gradient-text">
                R$ {((kpis?.mediaSalarial || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {/* KPI: Funcionários Ativos (em verde) */}
          {selectedWidgets.kpiFuncionariosAtivos && (
            <div className="glass-card-gradient animate-float animate-fade-in-up animate-delay-4" style={{ animationDelay: '1.5s' }}>
              <p className="dimension-marker mb-2">FUNCIONÁRIOS ATIVOS</p>
              <p className="text-2xl font-bold text-success">
                {kpis?.numFuncionariosAtivos || 0}
              </p>
            </div>
          )}
          {/* KPI: Custo Total Folha */}
          {selectedWidgets.kpiCustoTotalFolha && (
            <div className="glass-card-gradient animate-float animate-fade-in-up animate-delay-5" style={{ animationDelay: '2s' }}>
              <p className="dimension-marker mb-2">CUSTO TOTAL FOLHA</p>
              <p className="text-2xl font-bold gradient-text">
                R$ {((kpis?.custoTotalFolha || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {/* Mensagem quando nenhum widget está selecionado */}
          {!Object.values(selectedWidgets).some(Boolean) && (
            <div className="glass-card col-span-full">
              <p className="dimension-marker mb-2">Nenhum widget selecionado</p>
              <p className="text-sm text-muted-foreground">Ative ao menos um widget no painel de personalização.</p>
            </div>
          )}
        </div>

        {/* Gráficos - Grid com visualizações de dados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico: Salários por Funcionário */}
          {selectedWidgets.chartSalariosPorFuncionario && (
            <div className="glass-card">
              <p className="dimension-marker mb-4">SALÁRIOS POR FUNCIONÁRIO</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                  <Bar dataKey="salario" fill="oklch(0.7 0.25 280)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico: Produção (Meta vs Realizado) */}
          {selectedWidgets.chartProducaoMetaRealizado && (
            <div className="glass-card">
              <p className="dimension-marker mb-4">PRODUÇÃO: META VS REALIZADO</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={produtividadeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                  <Legend />
                  <Bar dataKey="meta" fill="oklch(0.65 0.25 220)" />
                  <Bar dataKey="realizado" fill="oklch(0.6 0.25 140)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico: Distribuição por Situação (Pizza) */}
          {selectedWidgets.chartDistribuicaoSituacao && (
            <div className="glass-card">
              <p className="dimension-marker mb-4">DISTRIBUIÇÃO POR SITUAÇÃO</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribuicaoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {/* Mapeia cores para cada fatia do gráfico */}
                    {distribuicaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico: Descontos por Funcionário */}
          {selectedWidgets.chartDescontosPorFuncionario && (
            <div className="glass-card">
              <p className="dimension-marker mb-4">DESCONTOS POR FUNCIONÁRIO</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                  <Bar dataKey="desconto" fill="oklch(0.55 0.25 25)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
