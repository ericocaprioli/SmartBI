import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
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

export default function DashboardProducao() {
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  const { data: producao } = trpc.producao.listByMes.useQuery(mesSelecionado);
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();

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

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="cad-card">
            <p className="dimension-marker mb-2">EFICIÊNCIA ACUMULADA</p>
            <p className="text-2xl font-bold text-accent">
              {eficienciaAcumulada}%
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">SALDO ACUMULADO</p>
            <p className={`text-2xl font-bold ${saldoAcumulado >= 0 ? "text-green-400" : "text-red-400"}`}>
              {saldoAcumulado >= 0 ? "+" : ""}{saldoAcumulado} peças
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">TOTAL FATURAMENTO</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totalFaturamento.toFixed(2)}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">FUNCIONÁRIOS</p>
            <p className="text-2xl font-bold text-accent">
              {producao?.length || 0}
            </p>
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
