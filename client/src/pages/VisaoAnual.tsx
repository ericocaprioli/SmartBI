// Importação de hooks do React para gerenciar estado e memoização
import { useState, useMemo } from "react";

// Importação do cliente tRPC para chamadas de API
import { trpc } from "@/lib/trpc";

// Importação de componentes UI
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Importação de componentes de gráficos do Recharts
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Importação do layout do dashboard
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Lista de anos disponíveis para seleção na visão anual
 */
const ANOS = [
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
];

/**
 * Nomes abreviados dos meses para exibição nos gráficos
 */
const MESES_NOMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

/**
 * VisaoAnual é a página de consolidação mensal de dados anuais
 * 
 * Funcionalidades:
 * - Seleção de ano para análise
 * - Consolidação de dados de pagamentos e produção por mês
 * - Cálculo de totais anuais (salários, descontos, faturamento, produção)
 * - Gráficos de evolução mensal de custos, faturamento e produção
 * - Gráfico comparativo de custo de folha vs faturamento
 * - Tabela detalhada mensal com margem calculada
 * - Conversão de valores de centavos para reais na exibição
 * 
 * Cálculos realizados:
 * - Soma de salários líquidos por mês
 * - Soma de descontos (INSS + descontos diversos) por mês
 * - Soma de faturamento mensal por mês
 * - Soma de produção realizada e meta por mês
 * - Custo total de folha (salários + descontos)
 * - Margem (faturamento - custo total)
 */
export default function VisaoAnual() {
  // Estado para ano selecionado (padrão: 2026)
  const [anoSelecionado, setAnoSelecionado] = useState("2026");
  
  // Query para listar funcionários
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  
  // Query para listar todos os pagamentos (não filtrado por mês)
  const { data: pagamentos } = trpc.pagamentos.listAll.useQuery();
  
  // Query para listar toda a produção (não filtrada por mês)
  const { data: producao } = trpc.producao.listAll.useQuery();

  /**
 * dadosAnuais consolida dados mensais de pagamentos e produção
 * Inicializa todos os meses do ano com zero
 * Processa pagamentos para somar salários e descontos
 * Processa produção para somar faturamento, produção realizada e meta
 * Converte centavos para reais
 */
  const dadosAnuais = useMemo(() => {
    if (!pagamentos || !producao) return [];

    const dadosPorMes: Record<string, {
      totalSalarios: number;
      totalDescontos: number;
      totalFaturamento: number;
      totalProducao: number;
      totalMeta: number;
    }> = {};

    // Inicializa todos os meses do ano com valores zerados
    for (let i = 1; i <= 12; i++) {
      const mesKey = `${anoSelecionado}-${String(i).padStart(2, '0')}`;
      dadosPorMes[mesKey] = {
        totalSalarios: 0,
        totalDescontos: 0,
        totalFaturamento: 0,
        totalProducao: 0,
        totalMeta: 0,
      };
    }

    // Processa pagamentos: soma salários líquidos e descontos por mês
    pagamentos.forEach((p) => {
      if (p.mes_referencia.startsWith(anoSelecionado)) {
        dadosPorMes[p.mes_referencia].totalSalarios += (p.salario_liquido || 0);
        dadosPorMes[p.mes_referencia].totalDescontos += (p.inss || 0) + (p.desconto_diversos || 0);
      }
    });

    // Processa produção: soma faturamento, produção realizada e meta por mês
    producao.forEach((p) => {
      if (p.mes_referencia.startsWith(anoSelecionado)) {
        dadosPorMes[p.mes_referencia].totalFaturamento += (p.faturamento_mensal || 0);
        dadosPorMes[p.mes_referencia].totalProducao += (p.producao_realizada || 0);
        dadosPorMes[p.mes_referencia].totalMeta += (p.meta_mes || 0);
      }
    });

    return Object.entries(dadosPorMes).map(([mes, dados]) => ({
      mes: MESES_NOMES[parseInt(mes.split("-")[1]) - 1], // Converte mês numérico para nome abreviado
      totalSalarios: dados.totalSalarios / 100, // Converte centavos para reais
      totalDescontos: dados.totalDescontos / 100,
      totalFaturamento: dados.totalFaturamento / 100,
      totalProducao: dados.totalProducao,
      totalMeta: dados.totalMeta,
      custoTotal: (dados.totalSalarios + dados.totalDescontos) / 100, // Custo total de folha
    }));
  }, [pagamentos, producao, anoSelecionado]);

  /**
 * totaisAnuais calcula os totais anuais somando todos os meses
 * Soma salários, descontos, faturamento, produção e custo total
 */
  const totaisAnuais = useMemo(() => {
    return dadosAnuais.reduce((acc, mes) => ({
      totalSalarios: acc.totalSalarios + mes.totalSalarios,
      totalDescontos: acc.totalDescontos + mes.totalDescontos,
      totalFaturamento: acc.totalFaturamento + mes.totalFaturamento,
      totalProducao: acc.totalProducao + mes.totalProducao,
      custoTotal: acc.custoTotal + mes.custoTotal,
    }), { totalSalarios: 0, totalDescontos: 0, totalFaturamento: 0, totalProducao: 0, custoTotal: 0 });
  }, [dadosAnuais]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e seleção de ano */}
        <div className="border-2 border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">VISÃO ANUAL</h1>
              <p className="text-muted-foreground dimension-marker">Consolidação mensal de dados</p>
            </div>
            {/* Dropdown para seleção de ano */}
            <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
              <SelectTrigger className="w-48 cad-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((ano) => (
                  <SelectItem key={ano.value} value={ano.value}>
                    {ano.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Anuais - Cards com totais consolidados */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="glass-card">
            <p className="dimension-marker mb-2">TOTAL SALÁRIOS</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.totalSalarios.toFixed(2)}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">TOTAL DESCONTOS</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.totalDescontos.toFixed(2)}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">CUSTO TOTAL FOLHA</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.custoTotal.toFixed(2)}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">TOTAL FATURAMENTO</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.totalFaturamento.toFixed(2)}
            </p>
          </div>
          <div className="glass-card">
            <p className="dimension-marker mb-2">TOTAL PRODUÇÃO</p>
            <p className="text-2xl font-bold text-accent">
              {totaisAnuais.totalProducao} peças
            </p>
          </div>
        </div>

        {/* Gráficos - Grid com visualizações de evolução mensal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico: Evolução de Custos Mensal */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">EVOLUÇÃO DE CUSTOS MENSAL (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Legend />
                <Bar dataKey="totalSalarios" fill="oklch(0.7 0.25 280)" name="Salários" />
                <Bar dataKey="totalDescontos" fill="oklch(0.65 0.25 220)" name="Descontos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Evolução de Faturamento Mensal */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">EVOLUÇÃO DE FATURAMENTO MENSAL (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Line type="monotone" dataKey="totalFaturamento" stroke="#0066cc" strokeWidth={2} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Evolução de Produção */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">EVOLUÇÃO DE PRODUÇÃO (peças)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Legend />
                <Bar dataKey="totalMeta" fill="oklch(0.65 0.25 220)" name="Meta" />
                <Bar dataKey="totalProducao" fill="oklch(0.7 0.25 280)" name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico: Custo de Folha vs Faturamento */}
          <div className="glass-card">
            <p className="dimension-marker mb-4">CUSTO FOLHA vs FATURAMENTO (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(168, 85, 247, 0.5)" }} />
                <Legend />
                <Line type="monotone" dataKey="custoTotal" stroke="#d9534f" strokeWidth={2} name="Custo Folha" />
                <Line type="monotone" dataKey="totalFaturamento" stroke="#0066cc" strokeWidth={2} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Detalhada - Detalhamento mensal com margem */}
        <div className="glass-card overflow-x-auto">
          <p className="dimension-marker mb-4">DETALHAMENTO MENSAL</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">MÊS</th>
                <th className="text-left p-3 dimension-marker">SALÁRIOS (R$)</th>
                <th className="text-left p-3 dimension-marker">DESCONTOS (R$)</th>
                <th className="text-left p-3 dimension-marker">CUSTO TOTAL (R$)</th>
                <th className="text-left p-3 dimension-marker">FATURAMENTO (R$)</th>
                <th className="text-left p-3 dimension-marker">PRODUÇÃO</th>
                <th className="text-left p-3 dimension-marker">META</th>
                <th className="text-left p-3 dimension-marker">MARGEM</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeia dados anuais para linhas da tabela */}
              {dadosAnuais.map((d, idx) => {
                // Calcula margem (faturamento - custo total)
                const margem = d.totalFaturamento - d.custoTotal;
                return (
                  <tr key={idx} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{d.mes}</td>
                    <td className="p-3 text-white">R$ {d.totalSalarios.toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {d.totalDescontos.toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {d.custoTotal.toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {d.totalFaturamento.toFixed(2)}</td>
                    <td className="p-3 text-white">{d.totalProducao}</td>
                    <td className="p-3 text-white">{d.totalMeta}</td>
                    {/* Margem em verde se positiva, vermelho se negativa */}
                    <td className={`p-3 text-white ${margem >= 0 ? "text-green-400" : "text-red-400"}`}>
                      R$ {margem.toFixed(2)}
                    </td>
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
