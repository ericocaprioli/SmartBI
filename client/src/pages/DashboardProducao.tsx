// Importação de hooks do React para gerenciar estado e memoização
import { useState, useMemo } from "react";

// Importação do cliente tRPC para chamadas de API
import { trpc } from "@/lib/trpc";

// Importação de componentes UI
import { Card } from "@/components/ui/card";
import Gauge from "@/components/Gauge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Importação de componentes de gráficos do Recharts
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Importação do layout do dashboard
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Lista de meses disponíveis para seleção no dashboard de produção
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
 * MOCK_PRODUCAO - Dados de demonstração usados quando o backend não está disponível (modo convidado)
 * Contém dados fictícios de produção para visualização
 */
const MOCK_PRODUCAO = [
  { id: 1, funcionario_id: 1, meta_dia: 50, meta_mes: 1000, producao_realizada: 1200, valor_peca: 250, faturamento_mensal: 120000 },
  { id: 2, funcionario_id: 2, meta_dia: 40, meta_mes: 800, producao_realizada: 600, valor_peca: 200, faturamento_mensal: 60000 },
  { id: 3, funcionario_id: 3, meta_dia: 30, meta_mes: 600, producao_realizada: 450, valor_peca: 180, faturamento_mensal: 81000 },
  { id: 4, funcionario_id: 4, meta_dia: 20, meta_mes: 400, producao_realizada: 360, valor_peca: 220, faturamento_mensal: 79200 },
];

/**
 * MOCK_PAGAMENTOS - Dados de demonstração de pagamentos usados quando o backend não está disponível
 * Contém dados fictícios de dias trabalhados para cálculos de eficiência
 */
const MOCK_PAGAMENTOS = [
  { funcionario_id: 1, dias_trabalhados: 22 },
  { funcionario_id: 2, dias_trabalhados: 20 },
  { funcionario_id: 3, dias_trabalhados: 18 },
  { funcionario_id: 4, dias_trabalhados: 20 },
];

/**
 * DashboardProducao é a página de análise de produção
 * 
 * Funcionalidades:
 * - Seleção de mês para análise
 * - Uso de dados mock quando backend não está disponível (modo convidado)
 * - Cálculo de eficiência diária e acumulada
 * - Cálculo de saldo (realizado - meta)
 * - Cálculo de faturamento total
 * - Exibição de velocímetro (Gauge) para eficiência acumulada
 * - Gráficos de meta vs realizado por funcionário
 * - Gráficos de eficiência por funcionário
 * - Gráficos de faturamento por funcionário
 * - Tabelas detalhadas com métricas por funcionário
 * - Conversão de valores de centavos para reais na exibição
 * 
 * Cálculos realizados:
 * - Eficiência diária (realizado / (meta dia * dias trabalhados) * 100)
 * - Eficiência acumulada (realizado / meta mês * 100)
 * - Saldo acumulado (realizado - meta mês)
 * - Valor médio por peça
 * - Meta atingida (total realizado / total meta * 100)
 */
export default function DashboardProducao() {
  // Estado para mês selecionado (padrão: junho 2026)
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  // Query para listar produção do mês selecionado
  const { data: producaoRemote } = trpc.producao.listByMes.useQuery(mesSelecionado);
  // Usa dados reais se disponíveis, senão usa dados mock
  const producao = producaoRemote && producaoRemote.length > 0 ? producaoRemote : MOCK_PRODUCAO;  
  
  // Query para listar funcionários
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  
  // Query para listar pagamentos do mês selecionado
  const { data: pagamentosRemote } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  // Usa dados reais se disponíveis, senão usa dados mock
  const pagamentos = pagamentosRemote && pagamentosRemote.length > 0 ? pagamentosRemote : MOCK_PAGAMENTOS;

  /**
 * getFuncionarioNome busca o nome do funcionário pelo ID
 * @param id - ID do funcionário
 * @returns Nome do funcionário ou string padrão se não encontrado
 */
  const getFuncionarioNome = (id: number) => {
    return funcionarios?.find((f) => f.id === id)?.nome || `Funcionário ${id}`;
  };

  /**
 * produtividadeData prepara dados para gráfico de produtividade
 * Mapeia produção para formato compatível com Recharts
 */
  const produtividadeData = useMemo(() => {
    if (!producao) return [];
    return producao.map((p) => ({
      nome: getFuncionarioNome(p.funcionario_id),
      meta: p.meta_mes || 0,
      realizado: p.producao_realizada || 0,
      eficiencia: (p.meta_mes ?? 0) > 0 ? (((p.producao_realizada ?? 0) / (p.meta_mes ?? 0)) * 100).toFixed(1) : "0",
    }));
  }, [producao, funcionarios]);

  /**
 * faturamentoData prepara dados para gráfico de faturamento
 * Converte centavos para reais
 */
  const faturamentoData = useMemo(() => {
    if (!producao) return [];
    return producao.map((p) => ({
      nome: getFuncionarioNome(p.funcionario_id),
      faturamento: (p.faturamento_mensal || 0) / 100,
    }));
  }, [producao, funcionarios]);

  /**
 * pagamentosMap cria um mapa de funcionário para dias trabalhados
 * Facilita acesso rápido aos dias trabalhados por funcionário
 */
  const pagamentosMap = useMemo(() => {
    if (!pagamentos) return {} as Record<number, number>;
    return pagamentos.reduce((acc, pagamento) => {
      acc[pagamento.funcionario_id] = pagamento.dias_trabalhados || 0;
      return acc;
    }, {} as Record<number, number>);
  }, [pagamentos]);

  /**
 * totalMetaDia calcula a soma de todas as metas diárias
 */
  const totalMetaDia = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.meta_dia || 0), 0);
  }, [producao]);

  /**
 * totalMetaMes calcula a soma de todas as metas mensais
 */
  const totalMetaMes = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.meta_mes || 0), 0);
  }, [producao]);

  /**
 * totalRealizado calcula a soma de toda a produção realizada
 */
  const totalRealizado = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.producao_realizada || 0), 0);
  }, [producao]);

  /**
 * valorPecaMedio calcula o valor médio por peça
 * Filtra valores positivos e converte centavos para reais
 */
  const valorPecaMedio = useMemo(() => {
    if (!producao || producao.length === 0) return 0;
    const valores = producao.filter((p) => p.valor_peca && p.valor_peca > 0).map((p) => p.valor_peca || 0);
    return valores.length > 0 ? valores.reduce((sum, value) => sum + value, 0) / valores.length / 100 : 0;
  }, [producao]);

  /**
 * producaoDetalhada prepara dados detalhados de produção por funcionário
 * Calcula eficiência diária, produção acumulada, saldo e eficiência acumulada
 */
  const producaoDetalhada = useMemo(() => {
    if (!producao) return [];
    return producao.map((p) => {
      const diasTrabalhados = pagamentosMap[p.funcionario_id] || 0;
      const metaDia = p.meta_dia || 0;
      const metaMes = p.meta_mes || 0;
      const realizado = p.producao_realizada || 0;
      // Eficiência diária: realizado / (meta dia * dias trabalhados)
      const eficienciaDia = metaDia > 0 && diasTrabalhados > 0 ? ((realizado / (metaDia * diasTrabalhados)) * 100).toFixed(1) : "0";
      // Produção acumulada como porcentagem da meta
      const producaoAcumulada = metaMes > 0 ? ((realizado / metaMes) * 100).toFixed(1) : "0";
      // Saldo: diferença entre realizado e meta
      const saldo = realizado - metaMes;
      // Eficiência acumulada: mesma que produção acumulada
      const eficienciaAcum = metaMes > 0 ? ((realizado / metaMes) * 100).toFixed(1) : "0";

      return {
        ...p,
        nome: getFuncionarioNome(p.funcionario_id),
        diasTrabalhados,
        eficienciaDia,
        producaoAcumulada,
        saldo,
        eficienciaAcum,
      };
    });
  }, [producao, pagamentosMap, funcionarios]);

  /**
 * eficienciaAcumulada calcula a eficiência média de toda a equipe
 * Total realizado / total meta * 100
 */
  const eficienciaAcumulada = useMemo(() => {
    if (!producao) return 0;
    const totalMeta = producao.reduce((sum, p) => sum + (p.meta_mes || 0), 0);
    const totalRealizado = producao.reduce((sum, p) => sum + (p.producao_realizada || 0), 0);
    return totalMeta > 0 ? ((totalRealizado / totalMeta) * 100).toFixed(1) : "0";
  }, [producao]);

  /**
 * saldoAcumulado calcula o saldo total de toda a equipe
 * Soma de (realizado - meta) de todos os funcionários
 */
  const saldoAcumulado = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => {
      const meta = p.meta_mes || 0;
      const realizado = p.producao_realizada || 0;
      return sum + (realizado - meta);
    }, 0);
  }, [producao]);

  /**
 * totalFaturamento calcula o faturamento total de toda a equipe
 * Converte centavos para reais
 */
  const totalFaturamento = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.faturamento_mensal || 0), 0) / 100;
  }, [producao]);

  /**
 * metaAtingida calcula a porcentagem da meta atingida pela equipe
 * Total realizado / total meta * 100
 */
  const metaAtingida = totalMetaMes > 0 ? ((totalRealizado / totalMetaMes) * 100).toFixed(1) : "0";

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e seleção de mês */}
        <div className="border-2 border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">DASHBOARD DE PRODUÇÃO</h1>
              <p className="text-muted-foreground dimension-marker">Análise de metas, eficiência e faturamento</p>
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

        {/* Painel de comando - Cards com métricas principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card: Eficiência Média */}
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">EFICIÊNCIA MÉDIA</p>
            <p className="text-3xl font-bold text-white">{eficienciaAcumulada}%</p>
            <p className="text-sm text-muted-foreground mt-2">Comparado à meta do mês</p>
          </div>
          {/* Card: Saldo Acumulado */}
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">SALDO ACUMULADO</p>
            <p className="text-3xl font-bold text-white">{saldoAcumulado >= 0 ? `+${saldoAcumulado}` : saldoAcumulado}</p>
            <p className="text-sm text-muted-foreground mt-2">Peças acima/abaixo da meta</p>
          </div>
          {/* Card: Faturamento Total */}
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">FATURAMENTO TOTAL</p>
            <p className="text-3xl font-bold text-white">R$ {totalFaturamento.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">Receita mensal estimada</p>
          </div>
          {/* Card: Meta Atingida */}
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">META ATINGIDA</p>
            <p className="text-3xl font-bold text-white">{metaAtingida}%</p>
            <p className="text-sm text-muted-foreground mt-2">Proporção do realizado sobre a meta</p>
          </div>
        </div>

        {/* KPIs Principais - Cards com métricas detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="glass-card">
            <p className="dimension-marker mb-2">META DIA</p>
            <p className="text-2xl font-bold text-accent">
              {totalMetaDia}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">META MÊS</p>
            <p className="text-2xl font-bold text-accent">
              {totalMetaMes}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">REALIZADO</p>
            <p className="text-2xl font-bold text-accent">
              {totalRealizado}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">VALOR PEÇA</p>
            <p className="text-2xl font-bold text-accent">
              R$ {valorPecaMedio.toFixed(2)}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">FATURAMENTO MENSAL</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totalFaturamento.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Velocímetro elegante - Gauge para eficiência acumulada */}
        <div className="flex justify-center">
          <div className="glass-card w-full lg:w-1/3">
            <p className="dimension-marker mb-4">EFICIÊNCIA ACUMULADA</p>
            <div className="flex justify-center">
              {/* Componente Gauge customizado com valor de eficiência */}
              <Gauge value={Number(eficienciaAcumulada)} size={220} label="Acumulada" />
            </div>
          </div>
        </div>

        {/* Tabela de Resumo de Produção */}
        <div className="glass-card">
          <p className="dimension-marker mb-4">RESUMO PRODUÇÃO {mesSelecionado.replace("2026-", "jun/")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 dimension-marker">FUNCIONÁRIO</th>
                  <th className="text-left p-3 dimension-marker">DIAS TRABALHADOS</th>
                  <th className="text-left p-3 dimension-marker">META DIA</th>
                  <th className="text-left p-3 dimension-marker">META MÊS</th>
                  <th className="text-left p-3 dimension-marker">PRODUÇÃO</th>
                  <th className="text-left p-3 dimension-marker">EFICIÊNCIA DIA (%)</th>
                  <th className="text-left p-3 dimension-marker">PRODUÇÃO (%) ACUMULADA</th>
                  <th className="text-left p-3 dimension-marker">SALDO ACUMULADO</th>
                  <th className="text-left p-3 dimension-marker">EFICIÊNCIA ACUMULADA</th>
                </tr>
              </thead>
              <tbody>
                {/* Mapeia produção detalhada para linhas da tabela */}
                {producaoDetalhada.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{item.nome}</td>
                    <td className="p-3 text-white">{item.diasTrabalhados}</td>
                    <td className="p-3 text-white">{item.meta_dia || 0}</td>
                    <td className="p-3 text-white">{item.meta_mes || 0}</td>
                    <td className="p-3 text-white">{item.producao_realizada || 0}</td>
                    <td className="p-3 text-white">{item.eficienciaDia}%</td>
                    <td className="p-3 text-white">{item.producaoAcumulada}%</td>
                    {/* Saldo em verde se positivo, vermelho se negativo */}
                    <td className={`p-3 text-white ${item.saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {item.saldo >= 0 ? "+" : ""}{item.saldo}
                    </td>
                    <td className="p-3 text-white">{item.eficienciaAcum}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráficos - Grid com visualizações de dados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico: Meta vs Realizado por Funcionário */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">META VS REALIZADO POR FUNCIONÁRIO</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtividadeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Legend />
                <Bar dataKey="meta" fill="oklch(0.65 0.25 220)" name="Meta" />
                <Bar dataKey="realizado" fill="oklch(0.7 0.25 280)" name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Eficiência por Funcionário */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">EFICIÊNCIA POR FUNCIONÁRIO (%)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtividadeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Bar dataKey="eficiencia" fill="oklch(0.7 0.25 280)" name="Eficiência (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Faturamento por Funcionário (span 2 colunas) */}
          <div className="glass-card lg:col-span-2">
            <p className="dimension-marker mb-4">FATURAMENTO POR FUNCIONÁRIO (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faturamentoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Bar dataKey="faturamento" fill="oklch(0.7 0.25 280)" name="Faturamento (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Detalhada por Funcionário */}
        <div className="glass-card overflow-x-auto">
          <p className="dimension-marker mb-4">DETALHAMENTO POR FUNCIONÁRIO</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">FUNCIONÁRIO</th>
                <th className="text-left p-3 dimension-marker">META DIA</th>
                <th className="text-left p-3 dimension-marker">META MÊS</th>
                <th className="text-left p-3 dimension-marker">REALIZADO</th>
                <th className="text-left p-3 dimension-marker">EFICIÊNCIA</th>
                <th className="text-left p-3 dimension-marker">SALDO</th>
                <th className="text-left p-3 dimension-marker">FATURAMENTO</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeia produção para linhas da tabela com cálculos */}
              {producao?.map((p) => {
                const meta = p.meta_mes || 0;
                const realizado = p.producao_realizada || 0;
                const eficiencia = meta > 0 ? ((realizado / meta) * 100).toFixed(1) : "0";
                const saldo = realizado - meta;
                const faturamento = (p.faturamento_mensal || 0) / 100;
                
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{getFuncionarioNome(p.funcionario_id)}</td>
                    <td className="p-3 text-white">{p.meta_dia || 0}</td>
                    <td className="p-3 text-white">{meta}</td>
                    <td className="p-3 text-white">{realizado}</td>
                    <td className="p-3 text-white">{eficiencia}%</td>
                    {/* Saldo em verde se positivo, vermelho se negativo */}
                    <td className={`p-3 text-white ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {saldo >= 0 ? "+" : ""}{saldo}
                    </td>
                    {/* Converte centavos para reais */}
                    <td className="p-3 text-white">R$ {faturamento.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
