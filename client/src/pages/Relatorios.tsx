import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

export default function Relatorios() {
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  const { data: pagamentos } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  const { data: producao } = trpc.producao.listByMes.useQuery(mesSelecionado);

  // Custo de folha por função
  const custoPorFuncao = useMemo(() => {
    if (!pagamentos || !funcionarios) return [];
    const custoMap: Record<string, number> = {};
    
    pagamentos.forEach((p) => {
      const func = funcionarios.find((f) => f.id === p.funcionario_id);
      if (func) {
        const custoTotal = (p.salario_liquido || 0) + (p.inss || 0) + (p.desconto_diversos || 0);
        custoMap[func.funcao] = (custoMap[func.funcao] || 0) + custoTotal;
      }
    });

    return Object.entries(custoMap).map(([funcao, custo]) => ({
      funcao,
      custo: custo / 100,
    }));
  }, [pagamentos, funcionarios]);

  // Distribuição por situação
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

  // Eficiência de produção por funcionário
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

  // Eficiência média por função
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
        {/* Cabeçalho */}
        <div className="border-2 border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">RELATÓRIOS CRUZADOS</h1>
              <p className="text-muted-foreground dimension-marker">Análise multidimensional de dados</p>
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

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custo de Folha por Função */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">CUSTO DE FOLHA POR FUNÇÃO (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={custoPorFuncao}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="funcao" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Bar dataKey="custo" fill="#0066cc" name="Custo (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribuição por Situação */}
          <div className="cad-card">
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
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Eficiência por Funcionário */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">EFICIÊNCIA DE PRODUÇÃO POR FUNCIONÁRIO (%)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eficienciaPorFuncionario}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Bar dataKey="eficiencia" fill="#0066cc" name="Eficiência (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Eficiência Média por Função */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">EFICIÊNCIA MÉDIA POR FUNÇÃO (%)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eficienciaPorFuncao}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="funcao" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Bar dataKey="eficiencia" fill="#003d7a" name="Eficiência Média (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabelas Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabela Custo por Função */}
          <div className="cad-card overflow-x-auto">
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

          {/* Tabela Eficiência por Função */}
          <div className="cad-card overflow-x-auto">
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
