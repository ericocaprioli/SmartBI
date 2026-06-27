// Importação de hooks do React para gerenciar estado e memoização
import { useState, useMemo } from "react";

// Importação do cliente tRPC para chamadas de API
import { trpc } from "@/lib/trpc";

// Importação de componentes UI
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Importação de componentes de gráficos do Recharts
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Importação do layout do dashboard
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Lista de meses disponíveis para seleção nos relatórios
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
 * Paleta de cores em tons de azul para gráficos
 */
const CORES = ["#0066cc", "#0052a3", "#003d7a", "#002851", "#001428"];

/**
 * Relatorios é a página de análise multidimensional de dados
 * 
 * Funcionalidades:
 * - Seleção de mês para análise
 * - Cálculo de custo de folha por função
 * - Distribuição de funcionários por situação contratual
 * - Eficiência de produção por funcionário
 * - Eficiência média por função
 * - Gráficos de barra e pizza para visualização
 * - Tabelas detalhadas com dados cruzados
 * - Conversão de valores de centavos para reais na exibição
 * 
 * Cálculos realizados:
 * - Custo total por função (salário líquido + INSS + descontos)
 * - Distribuição por situação contratual
 * - Eficiência por funcionário (realizado / meta * 100)
 * - Eficiência média por função (média das eficiências)
 */
export default function Relatorios() {
  // Estado para mês selecionado (padrão: junho 2026)
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  // Query para listar pagamentos do mês selecionado
  const { data: pagamentos } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  
  // Query para listar funcionários
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  
  // Query para listar produção do mês selecionado
  const { data: producao } = trpc.producao.listByMes.useQuery(mesSelecionado);

  /**
 * custoPorFuncao calcula o custo total de folha por função
 * Soma salário líquido, INSS e descontos diversos por função
 * Converte centavos para reais
 */
  const custoPorFuncao = useMemo(() => {
    if (!pagamentos || !funcionarios) return [];
    const custoMap: Record<string, number> = {};
    
    pagamentos.forEach((p) => {
      const func = funcionarios.find((f) => f.id === p.funcionario_id);
      if (func) {
        // Custo total = salário líquido + INSS + descontos diversos
        const custoTotal = (p.salario_liquido || 0) + (p.inss || 0) + (p.desconto_diversos || 0);
        custoMap[func.funcao] = (custoMap[func.funcao] || 0) + custoTotal;
      }
    });

    return Object.entries(custoMap).map(([funcao, custo]) => ({
      funcao,
      custo: custo / 100, // Converte centavos para reais
    }));
  }, [pagamentos, funcionarios]);

  /**
 * distribuicaoSituacao calcula a distribuição de funcionários por situação contratual
 * Conta quantos funcionários em cada situação
 */
  const distribuicaoSituacao = useMemo(() => {
    if (!funcionarios) return [];
    const dist: Record<string, number> = {};
    
    funcionarios.forEach((f) => {
      dist[f.situacao] = (dist[f.situacao] || 0) + 1;
    });

    return Object.entries(dist).map(([situacao, count]) => ({
      name: situacao,
      value: count,
    }));
  }, [funcionarios]);

  /**
 * eficienciaPorFuncionario calcula a eficiência de produção por funcionário
 * Eficiência = (realizado / meta) * 100
 */
  const eficienciaPorFuncionario = useMemo(() => {
    if (!producao || !funcionarios) return [];
    
    return producao.map((p) => {
      const func = funcionarios.find((f) => f.id === p.funcionario_id);
      const meta = p.meta_mes || 0;
      const realizado = p.producao_realizada || 0;
      const eficiencia = meta > 0 ? ((realizado / meta) * 100).toFixed(1) : "0";
      
      return {
        nome: func?.nome || `Funcionário ${p.funcionario_id}`,
        funcao: func?.funcao || "N/A",
        eficiencia: parseFloat(eficiencia),
      };
    });
  }, [producao, funcionarios]);

  /**
 * eficienciaPorFuncao calcula a eficiência média por função
 * Calcula a média das eficiências de todos os funcionários de cada função
 */
  const eficienciaPorFuncao = useMemo(() => {
    if (!eficienciaPorFuncionario) return [];
    const eficienciaMap: Record<string, { soma: number; count: number }> = {};
    
    eficienciaPorFuncionario.forEach((e) => {
      if (!eficienciaMap[e.funcao]) {
        eficienciaMap[e.funcao] = { soma: 0, count: 0 };
      }
      eficienciaMap[e.funcao].soma += e.eficiencia;
      eficienciaMap[e.funcao].count += 1;
    });

    return Object.entries(eficienciaMap).map(([funcao, data]) => ({
      funcao,
      eficiencia: (data.soma / data.count).toFixed(1),
    }));
  }, [eficienciaPorFuncionario]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e seleção de mês */}
        <div className="border-2 border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">RELATÓRIOS CRUZADOS</h1>
              <p className="text-muted-foreground dimension-marker">Análise multidimensional de dados</p>
            </div>
            {/* Dropdown para seleção de mês */}
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

        {/* Gráficos - Grid com visualizações de dados cruzados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico: Custo de Folha por Função */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">CUSTO DE FOLHA POR FUNÇÃO (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={custoPorFuncao}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="funcao" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Bar dataKey="custo" fill="oklch(0.7 0.25 280)" name="Custo (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Distribuição por Situação Contratual */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">DISTRIBUIÇÃO POR SITUAÇÃO CONTRATUAL</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribuicaoSituacao}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distribuicaoSituacao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Eficiência por Funcionário */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">EFICIÊNCIA DE PRODUÇÃO POR FUNCIONÁRIO (%)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eficienciaPorFuncionario}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Bar dataKey="eficiencia" fill="oklch(0.7 0.25 280)" name="Eficiência (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Eficiência Média por Função */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">EFICIÊNCIA MÉDIA POR FUNÇÃO (%)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eficienciaPorFuncao}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="funcao" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Bar dataKey="eficiencia" fill="oklch(0.65 0.25 220)" name="Eficiência Média (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabelas Resumo - Detalhamento dos dados cruzados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabela: Custo por Função */}
          <div className="glass-card overflow-x-auto">
            <p className="dimension-marker mb-4">DETALHE: CUSTO POR FUNÇÃO</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 dimension-marker">FUNÇÃO</th>
                  <th className="text-left p-3 dimension-marker">CUSTO TOTAL (R$)</th>
                </tr>
              </thead>
              <tbody>
                {custoPorFuncao.map((item, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{item.funcao}</td>
                    <td className="p-3 text-white">R$ {item.custo.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tabela: Eficiência por Função */}
          <div className="glass-card overflow-x-auto">
            <p className="dimension-marker mb-4">DETALHE: EFICIÊNCIA POR FUNÇÃO</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 dimension-marker">FUNÇÃO</th>
                  <th className="text-left p-3 dimension-marker">EFICIÊNCIA MÉDIA (%)</th>
                </tr>
              </thead>
              <tbody>
                {eficienciaPorFuncao.map((item, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{item.funcao}</td>
                    <td className="p-3 text-white">{item.eficiencia}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
