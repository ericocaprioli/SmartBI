import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const ANOS = [
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
];

const MESES_NOMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function VisaoAnual() {
  const [anoSelecionado, setAnoSelecionado] = useState("2026");
  
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  const { data: pagamentos } = trpc.pagamentos.listAll.useQuery(); // Buscar todos os pagamentos
  const { data: producao } = trpc.producao.listAll.useQuery(); // Buscar toda a produção

  // Dados mensais consolidados
  const dadosAnuais = useMemo(() => {
    if (!pagamentos || !producao) return [];

    const dadosPorMes: Record<string, {
      totalSalarios: number;
      totalDescontos: number;
      totalFaturamento: number;
      totalProducao: number;
      totalMeta: number;
    }> = {};

    // Inicializar todos os meses do ano
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

    // Processar pagamentos
    pagamentos.forEach((p) => {
      if (p.mes_referencia.startsWith(anoSelecionado)) {
        dadosPorMes[p.mes_referencia].totalSalarios += (p.salario_liquido || 0);
        dadosPorMes[p.mes_referencia].totalDescontos += (p.inss || 0) + (p.desconto_diversos || 0);
      }
    });

    // Processar produção
    producao.forEach((p) => {
      if (p.mes_referencia.startsWith(anoSelecionado)) {
        dadosPorMes[p.mes_referencia].totalFaturamento += (p.faturamento_mensal || 0);
        dadosPorMes[p.mes_referencia].totalProducao += (p.producao_realizada || 0);
        dadosPorMes[p.mes_referencia].totalMeta += (p.meta_mes || 0);
      }
    });

    return Object.entries(dadosPorMes).map(([mes, dados]) => ({
      mes: MESES_NOMES[parseInt(mes.split("-")[1]) - 1],
      totalSalarios: dados.totalSalarios / 100,
      totalDescontos: dados.totalDescontos / 100,
      totalFaturamento: dados.totalFaturamento / 100,
      totalProducao: dados.totalProducao,
      totalMeta: dados.totalMeta,
      custoTotal: (dados.totalSalarios + dados.totalDescontos) / 100,
    }));
  }, [pagamentos, producao, anoSelecionado]);

  // Totais anuais
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
        {/* Cabeçalho */}
        <div className="border-2 border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">VISÃO ANUAL</h1>
              <p className="text-muted-foreground dimension-marker">Consolidação mensal de dados</p>
            </div>
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

        {/* KPIs Anuais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="cad-card">
            <p className="dimension-marker mb-2">TOTAL SALÁRIOS</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.totalSalarios.toFixed(2)}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">TOTAL DESCONTOS</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.totalDescontos.toFixed(2)}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">CUSTO TOTAL FOLHA</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.custoTotal.toFixed(2)}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">TOTAL FATURAMENTO</p>
            <p className="text-2xl font-bold text-accent">
              R$ {totaisAnuais.totalFaturamento.toFixed(2)}
            </p>
          </div>
          <div className="cad-card">
            <p className="dimension-marker mb-2">TOTAL PRODUÇÃO</p>
            <p className="text-2xl font-bold text-accent">
              {totaisAnuais.totalProducao} peças
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução de Custos */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">EVOLUÇÃO DE CUSTOS MENSAL (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Legend />
                <Bar dataKey="totalSalarios" fill="#0066cc" name="Salários" />
                <Bar dataKey="totalDescontos" fill="#003d7a" name="Descontos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Evolução de Faturamento */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">EVOLUÇÃO DE FATURAMENTO MENSAL (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Line type="monotone" dataKey="totalFaturamento" stroke="#0066cc" strokeWidth={2} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Evolução de Produção */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">EVOLUÇÃO DE PRODUÇÃO (peças)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Legend />
                <Bar dataKey="totalMeta" fill="#003d7a" name="Meta" />
                <Bar dataKey="totalProducao" fill="#0066cc" name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Custo Total vs Faturamento */}
          <div className="cad-card">
            <p className="dimension-marker mb-4">CUSTO FOLHA vs FATURAMENTO (R$)</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid #0066cc" }} />
                <Legend />
                <Line type="monotone" dataKey="custoTotal" stroke="#d9534f" strokeWidth={2} name="Custo Folha" />
                <Line type="monotone" dataKey="totalFaturamento" stroke="#0066cc" strokeWidth={2} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="cad-card overflow-x-auto">
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
              {dadosAnuais.map((d, idx) => {
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
