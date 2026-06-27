import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const MESES = [
  { value: "2026-01", label: "Janeiro 2026" },
  { value: "2026-02", label: "Fevereiro 2026" },
  { value: "2026-03", label: "Março 2026" },
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-05", label: "Maio 2026" },
  { value: "2026-06", label: "Junho 2026" },
];

const CORES = ["#0066cc", "#0052a3", "#003d7a", "#002851", "#001428"];

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

const defaultWidgetState = DASHBOARD_WIDGETS.reduce((acc, widget) => {
  acc[widget.key] = true;
  return acc;
}, {} as Record<string, boolean>);

export default function Dashboard() {
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  const [selectedWidgets, setSelectedWidgets] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return defaultWidgetState;
    try {
      const saved = window.localStorage.getItem("dashboardWidgets");
      return saved ? JSON.parse(saved) : defaultWidgetState;
    } catch {
      return defaultWidgetState;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("dashboardWidgets", JSON.stringify(selectedWidgets));
    } catch {
      // ignore storage failures
    }
  }, [selectedWidgets]);

  const toggleWidget = (key: string) => {
    setSelectedWidgets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  const { data: kpis } = trpc.dashboard.getKPIs.useQuery(mesSelecionado);
  const { data: pagamentos } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  const { data: producao } = trpc.producao.listByMes.useQuery(mesSelecionado);
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();

  const chartData = useMemo(() => {
    if (!pagamentos) return [];
    return pagamentos.map((p, idx) => ({
      nome: `Func ${idx + 1}`,
      salario: p.salario_liquido || 0,
      desconto: (p.inss || 0) + (p.desconto_diversos || 0),
    }));
  }, [pagamentos]);

  const produtividadeData = useMemo(() => {
    if (!producao) return [];
    return producao.map((p, idx) => ({
      nome: `Func ${idx + 1}`,
      meta: p.meta_mes || 0,
      realizado: p.producao_realizada || 0,
    }));
  }, [producao]);

  const distribuicaoData = useMemo(() => {
    if (!funcionarios) return [];
    const dist = funcionarios.reduce((acc: Record<string, number>, f) => {
      acc[f.situacao] = (acc[f.situacao] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(dist).map(([situacao, count]) => ({
      name: situacao,
      value: count,
    }));
  }, [funcionarios]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho */}
        <div className="border-2 border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">DASHBOARD EXECUTIVO</h1>
              <p className="text-muted-foreground dimension-marker">Gestão de Folha de Pagamento e Produção</p>
            </div>
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-48 cad-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="cad-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Dashboard Customizável</h2>
              <p className="text-muted-foreground text-sm">Escolha quais gráficos e indicadores exibidos.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DASHBOARD_WIDGETS.map((widget) => (
              <div key={widget.key} className="flex items-center gap-3 rounded border border-border bg-slate-950/80 p-3">
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

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {selectedWidgets.kpiTotalSalarios && (
            <div className="cad-card">
              <p className="dimension-marker mb-2">TOTAL SALÁRIOS</p>
              <p className="text-2xl font-bold text-accent">
                R$ {((kpis?.totalSalarios || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {selectedWidgets.kpiTotalDescontos && (
            <div className="cad-card">
              <p className="dimension-marker mb-2">TOTAL DESCONTOS</p>
              <p className="text-2xl font-bold text-accent">
                R$ {((kpis?.totalDescontos || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {selectedWidgets.kpiMediaSalarial && (
            <div className="cad-card">
              <p className="dimension-marker mb-2">MÉDIA SALARIAL</p>
              <p className="text-2xl font-bold text-accent">
                R$ {((kpis?.mediaSalarial || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {selectedWidgets.kpiFuncionariosAtivos && (
            <div className="cad-card">
              <p className="dimension-marker mb-2">FUNCIONÁRIOS ATIVOS</p>
              <p className="text-2xl font-bold text-accent">
                {kpis?.numFuncionariosAtivos || 0}
              </p>
            </div>
          )}
          {selectedWidgets.kpiCustoTotalFolha && (
            <div className="cad-card">
              <p className="dimension-marker mb-2">CUSTO TOTAL FOLHA</p>
              <p className="text-2xl font-bold text-accent">
                R$ {((kpis?.custoTotalFolha || 0) / 100).toFixed(2)}
              </p>
            </div>
          )}
          {!Object.values(selectedWidgets).some(Boolean) && (
            <div className="cad-card col-span-full">
              <p className="dimension-marker mb-2">Nenhum widget selecionado</p>
              <p className="text-sm text-muted-foreground">Ative ao menos um widget no painel de personalização.</p>
            </div>
          )}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedWidgets.chartSalariosPorFuncionario && (
            <div className="cad-card">
              <p className="dimension-marker mb-4">SALÁRIOS POR FUNCIONÁRIO</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                  <Bar dataKey="salario" fill="#0066cc" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedWidgets.chartProducaoMetaRealizado && (
            <div className="cad-card">
              <p className="dimension-marker mb-4">PRODUÇÃO: META VS REALIZADO</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={produtividadeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                  <Legend />
                  <Bar dataKey="meta" fill="#003d7a" />
                  <Bar dataKey="realizado" fill="#0066cc" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedWidgets.chartDistribuicaoSituacao && (
            <div className="cad-card">
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
                    {distribuicaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedWidgets.chartDescontosPorFuncionario && (
            <div className="cad-card">
              <p className="dimension-marker mb-4">DESCONTOS POR FUNCIONÁRIO</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                  <Bar dataKey="desconto" fill="#d9534f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
