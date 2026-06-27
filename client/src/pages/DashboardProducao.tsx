import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import Gauge from "@/components/Gauge";
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

// Mock/demo data used when backend is unavailable (guest mode)
const MOCK_PRODUCAO = [
  { id: 1, funcionario_id: 1, meta_dia: 50, meta_mes: 1000, producao_realizada: 1200, valor_peca: 250, faturamento_mensal: 120000 },
  { id: 2, funcionario_id: 2, meta_dia: 40, meta_mes: 800, producao_realizada: 600, valor_peca: 200, faturamento_mensal: 60000 },
  { id: 3, funcionario_id: 3, meta_dia: 30, meta_mes: 600, producao_realizada: 450, valor_peca: 180, faturamento_mensal: 81000 },
  { id: 4, funcionario_id: 4, meta_dia: 20, meta_mes: 400, producao_realizada: 360, valor_peca: 220, faturamento_mensal: 79200 },
];

const MOCK_PAGAMENTOS = [
  { funcionario_id: 1, dias_trabalhados: 22 },
  { funcionario_id: 2, dias_trabalhados: 20 },
  { funcionario_id: 3, dias_trabalhados: 18 },
  { funcionario_id: 4, dias_trabalhados: 20 },
];

export default function DashboardProducao() {
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  const { data: producaoRemote } = trpc.producao.listByMes.useQuery(mesSelecionado);
  const producao = producaoRemote && producaoRemote.length > 0 ? producaoRemote : MOCK_PRODUCAO;  
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  const { data: pagamentosRemote } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  const pagamentos = pagamentosRemote && pagamentosRemote.length > 0 ? pagamentosRemote : MOCK_PAGAMENTOS;

  const getFuncionarioNome = (id: number) => {
    return funcionarios?.find((f) => f.id === id)?.nome || `Funcionário ${id}`;
  };

  const produtividadeData = useMemo(() => {
    if (!producao) return [];
    return producao.map((p) => ({
      nome: getFuncionarioNome(p.funcionario_id),
      meta: p.meta_mes || 0,
      realizado: p.producao_realizada || 0,
      eficiencia: p.meta_mes > 0 ? ((p.producao_realizada / p.meta_mes) * 100).toFixed(1) : "0",
    }));
  }, [producao, funcionarios]);

  const faturamentoData = useMemo(() => {
    if (!producao) return [];
    return producao.map((p) => ({
      nome: getFuncionarioNome(p.funcionario_id),
      faturamento: (p.faturamento_mensal || 0) / 100,
    }));
  }, [producao, funcionarios]);

  const pagamentosMap = useMemo(() => {
    if (!pagamentos) return {} as Record<number, number>;
    return pagamentos.reduce((acc, pagamento) => {
      acc[pagamento.funcionario_id] = pagamento.dias_trabalhados || 0;
      return acc;
    }, {} as Record<number, number>);
  }, [pagamentos]);

  const totalMetaDia = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.meta_dia || 0), 0);
  }, [producao]);

  const totalMetaMes = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.meta_mes || 0), 0);
  }, [producao]);

  const totalRealizado = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.producao_realizada || 0), 0);
  }, [producao]);

  const valorPecaMedio = useMemo(() => {
    if (!producao || producao.length === 0) return 0;
    const valores = producao.filter((p) => p.valor_peca && p.valor_peca > 0).map((p) => p.valor_peca || 0);
    return valores.length > 0 ? valores.reduce((sum, value) => sum + value, 0) / valores.length / 100 : 0;
  }, [producao]);

  const producaoDetalhada = useMemo(() => {
    if (!producao) return [];
    return producao.map((p) => {
      const diasTrabalhados = pagamentosMap[p.funcionario_id] || 0;
      const metaDia = p.meta_dia || 0;
      const metaMes = p.meta_mes || 0;
      const realizado = p.producao_realizada || 0;
      const eficienciaDia = metaDia > 0 && diasTrabalhados > 0 ? ((realizado / (metaDia * diasTrabalhados)) * 100).toFixed(1) : "0";
      const producaoAcumulada = metaMes > 0 ? ((realizado / metaMes) * 100).toFixed(1) : "0";
      const saldo = realizado - metaMes;
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

  const eficienciaAcumulada = useMemo(() => {
    if (!producao) return 0;
    const totalMeta = producao.reduce((sum, p) => sum + (p.meta_mes || 0), 0);
    const totalRealizado = producao.reduce((sum, p) => sum + (p.producao_realizada || 0), 0);
    return totalMeta > 0 ? ((totalRealizado / totalMeta) * 100).toFixed(1) : "0";
  }, [producao]);

  const saldoAcumulado = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => {
      const meta = p.meta_mes || 0;
      const realizado = p.producao_realizada || 0;
      return sum + (realizado - meta);
    }, 0);
  }, [producao]);

  const totalFaturamento = useMemo(() => {
    if (!producao) return 0;
    return producao.reduce((sum, p) => sum + (p.faturamento_mensal || 0), 0) / 100;
  }, [producao]);

  const metaAtingida = totalMetaMes > 0 ? ((totalRealizado / totalMetaMes) * 100).toFixed(1) : "0";

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho */}
        <div className="border-2 border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">DASHBOARD DE PRODUÇÃO</h1>
              <p className="text-muted-foreground dimension-marker">Análise de metas, eficiência e faturamento</p>
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

        {/* Painel de comando */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">EFICIÊNCIA MÉDIA</p>
            <p className="text-3xl font-bold text-white">{eficienciaAcumulada}%</p>
            <p className="text-sm text-muted-foreground mt-2">Comparado à meta do mês</p>
          </div>
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">SALDO ACUMULADO</p>
            <p className="text-3xl font-bold text-white">{saldoAcumulado >= 0 ? `+${saldoAcumulado}` : saldoAcumulado}</p>
            <p className="text-sm text-muted-foreground mt-2">Peças acima/abaixo da meta</p>
          </div>
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">FATURAMENTO TOTAL</p>
            <p className="text-3xl font-bold text-white">R$ {totalFaturamento.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">Receita mensal estimada</p>
          </div>
          <div className="cad-panel-card">
            <p className="dimension-marker mb-2">META ATINGIDA</p>
            <p className="text-3xl font-bold text-white">{metaAtingida}%</p>
            <p className="text-sm text-muted-foreground mt-2">Proporção do realizado sobre a meta</p>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="cad-card">
            <p className="dimension-marker mb-2">META DIA</p>
            <p className="text-2xl font-bold text-accent">
              {totalMetaDia}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">META MÊS</p>
            <p className="text-2xl font-bold text-accent">
              {totalMetaMes}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">REALIZADO</p>
            <p className="text-2xl font-bold text-accent">
              {totalRealizado}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">VALOR PEÇA</p>
            <p className="text-2xl font-bold text-accent">
              R$ {valorPecaMedio.toFixed(2)}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">FATURAMENTO MENSAL</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totalFaturamento.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Velocímetro elegante */}
        <div className="flex justify-center">
          <div className="cad-card w-full lg:w-1/3">
            <p className="dimension-marker mb-4">EFICIÊNCIA ACUMULADA</p>
            <div className="flex justify-center">
              <Gauge value={Number(eficienciaAcumulada)} size={220} label="Acumulada" />
            </div>
          </div>
        </div>

        <div className="cad-card">
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
                {producaoDetalhada.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{item.nome}</td>
                    <td className="p-3 text-white">{item.diasTrabalhados}</td>
                    <td className="p-3 text-white">{item.meta_dia || 0}</td>
                    <td className="p-3 text-white">{item.meta_mes || 0}</td>
                    <td className="p-3 text-white">{item.producao_realizada || 0}</td>
                    <td className="p-3 text-white">{item.eficienciaDia}%</td>
                    <td className="p-3 text-white">{item.producaoAcumulada}%</td>
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

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Meta vs Realizado */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">META VS REALIZADO POR FUNCIONÁRIO</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtividadeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Legend />
                <Bar dataKey="meta" fill="#003d7a" name="Meta" />
                <Bar dataKey="realizado" fill="#0066cc" name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Eficiência */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">EFICIÊNCIA POR FUNCIONÁRIO (%)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtividadeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Bar dataKey="eficiencia" fill="#0066cc" name="Eficiência (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Faturamento */}
          <div className="cad-card lg:col-span-2">
            <p className="dimension-marker mb-4">FATURAMENTO POR FUNCIONÁRIO (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faturamentoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Bar dataKey="faturamento" fill="#0066cc" name="Faturamento (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="cad-card overflow-x-auto">
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
                    <td className={`p-3 text-white ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {saldo >= 0 ? "+" : ""}{saldo}
                    </td>
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
