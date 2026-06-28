// Importação de hooks do React
import { useState } from "react";

// Importação do cliente tRPC para chamadas de API
import { trpc } from "@/lib/trpc";

// Importação do layout do dashboard
import DashboardLayout from "@/components/DashboardLayout";

// Importação do componente Button
import { Button } from "@/components/ui/button";

// Importação de componentes de gráfico do Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Importação de ícones do Lucide React
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Sprout, Fuel } from "lucide-react";

// Importação de toast para notificações
import { toast } from "sonner";

/**
 * Configuração visual de cada tipo de cotação
 * Define ícone, cor e descrição de cada commodity/moeda
 */
const CONFIG_COTACOES = {
  dolar: {
    icon: DollarSign,
    cor: "oklch(0.7 0.25 140)",
    descricao: "Câmbio comercial USD/BRL",
  },
  algodao: {
    icon: Sprout,
    cor: "oklch(0.7 0.25 180)",
    descricao: "Cotton Futures (CT=F) — convertido para R$/kg",
  },
  diesel: {
    icon: Fuel,
    cor: "oklch(0.7 0.25 40)",
    descricao: "Heating Oil (HO=F) — convertido para R$/litro",
  },
} as const;

// Tipos de cotação disponíveis
type TipoCotacao = "dolar" | "algodao" | "diesel";

/**
 * formatarValorBRL formata o valor convertido em reais com sua unidade
 * Valores são armazenados em centavos (divididos por 100)
 * 
 * @param valorBrl - Valor em reais (centavos)
 * @param unidadeBrl - Unidade da conversão (BRL, R$/kg, R$/L)
 * @returns String formatada (ex: "R$ 5,17", "R$ 8,75/kg")
 */
function formatarValorBRL(valorBrl: number, unidadeBrl?: string | null): string {
  const real = valorBrl / 100;
  if (!unidadeBrl || unidadeBrl === "BRL") {
    return `R$ ${real.toFixed(2)}`;
  }
  // unidadeBrl já vem como "R$/kg" ou "R$/L"
  return `R$ ${real.toFixed(2)}${unidadeBrl.replace("R$", "")}`;
}

/**
 * formatarValorOriginal formata o valor na unidade original (referência)
 * 
 * @param valor - Valor original em centavos
 * @param unidade - Unidade original
 * @returns String formatada
 */
function formatarValorOriginal(valor: number, unidade: string): string {
  const real = valor / 100;
  if (unidade === "BRL") {
    return `R$ ${real.toFixed(2)}`;
  }
  if (unidade === "USX/lb") {
    return `${real.toFixed(2)} ¢/lb`;
  }
  if (unidade === "USD/gal") {
    return `US$ ${real.toFixed(2)}/gal`;
  }
  return real.toFixed(2);
}

/**
 * Cotacoes é a página de visualização de cotações de mercado
 * 
 * Funcionalidades:
 * - Exibe cotações atuais de dólar, algodão e diesel em cards
 * - Mostra variação percentual em relação à coleta anterior
 * - Gráficos de tendência histórica para cada cotação
 * - Botão de atualização manual das cotações
 * - Dados coletados automaticamente 2x por dia via APIs gratuitas
 */
export default function Cotacoes() {
  // Estado do tipo selecionado para o gráfico de histórico
  const [tipoGrafico, setTipoGrafico] = useState<TipoCotacao>("dolar");

  // Query para obter as cotações mais recentes
  const { data: cotacoes, refetch: refetchLatest } = trpc.cotacoes.latest.useQuery();

  // Query para obter o histórico do tipo selecionado
  const { data: historico, refetch: refetchHistory } = trpc.cotacoes.history.useQuery(tipoGrafico);

  // Mutation para atualização manual de cotações
  const refreshMutation = trpc.cotacoes.refresh.useMutation();

  /**
   * handleRefresh dispara a coleta manual de cotações
   */
  const handleRefresh = async () => {
    try {
      const result = await refreshMutation.mutateAsync();
      toast.success(
        `Cotações atualizadas: ${result.sucessos} sucesso(s), ${result.falhas} falha(s)`
      );
      // Recarrega dados
      refetchLatest();
      refetchHistory();
    } catch (error) {
      toast.error("Erro ao atualizar cotações");
    }
  };

  // Prepara dados do gráfico (usa valor em reais e formata data)
  const dadosGrafico =
    historico?.map((c) => ({
      data: new Date(c.coletado_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      valor: (c.valor_brl ?? 0) / 100,
    })) ?? [];

  // Configuração visual do tipo selecionado para o gráfico
  const configGrafico = CONFIG_COTACOES[tipoGrafico];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e botão de atualização */}
        <div className="glass-card-gradient p-6 animate-pulse-glow">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">COTAÇÕES DE MERCADO</h1>
              <p className="text-muted-foreground dimension-marker">
                Dólar, Algodão e Diesel — atualizado 2x por dia
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
              className="gradient-button"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`}
              />
              {refreshMutation.isPending ? "ATUALIZANDO..." : "ATUALIZAR AGORA"}
            </Button>
          </div>
        </div>

        {/* Cards de cotações atuais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["dolar", "algodao", "diesel"] as TipoCotacao[]).map((tipo) => {
            // Busca a cotação do tipo
            const cotacao = cotacoes?.find((c) => c.tipo === tipo);
            const config = CONFIG_COTACOES[tipo];
            const Icon = config.icon;
            const variacao = (cotacao?.variacao ?? 0) / 100;
            const positiva = variacao >= 0;

            return (
              <button
                key={tipo}
                onClick={() => setTipoGrafico(tipo)}
                className={`glass-card-gradient text-left transition-all hover:scale-[1.02] ${
                  tipoGrafico === tipo ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-6 w-6" style={{ color: config.cor }} />
                  {/* Badge de variação */}
                  {cotacao && (
                    <div
                      className={`flex items-center gap-1 text-sm font-semibold ${
                        positiva ? "text-success" : "text-destructive"
                      }`}
                    >
                      {positiva ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {positiva ? "+" : ""}
                      {variacao.toFixed(2)}%
                    </div>
                  )}
                </div>
                <p className="dimension-marker mb-1">{cotacao?.nome ?? config.descricao}</p>
                <p className="text-2xl font-bold gradient-text">
                  {cotacao
                    ? formatarValorBRL(cotacao.valor_brl ?? 0, cotacao.unidade_brl)
                    : "Sem dados"}
                </p>
                {/* Valor na unidade original como referência (exceto dólar) */}
                {cotacao && tipo !== "dolar" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Origem: {formatarValorOriginal(cotacao.valor, cotacao.unidade)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{config.descricao}</p>
                {cotacao && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualizado:{" "}
                    {new Date(cotacao.coletado_em).toLocaleString("pt-BR")}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Gráfico de tendência histórica */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <p className="dimension-marker">
              HISTÓRICO — {CONFIG_COTACOES[tipoGrafico] && tipoGrafico.toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">{configGrafico.descricao}</p>
          </div>
          {dadosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="data" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(168, 85, 247, 0.5)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={configGrafico.cor}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="dimension-marker mb-2">Sem histórico disponível</p>
              <p className="text-sm text-muted-foreground">
                Clique em "ATUALIZAR AGORA" para coletar as primeiras cotações.
              </p>
            </div>
          )}
        </div>

        {/* Nota informativa sobre as fontes */}
        <div className="glass-card">
          <p className="dimension-marker mb-2">SOBRE OS DADOS</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <strong>Dólar:</strong> AwesomeAPI (câmbio comercial USD/BRL)
            </li>
            <li>
              <strong>Algodão:</strong> Yahoo Finance — Cotton Futures (CT=F). Origem em
              centavos de dólar por libra, convertido para <strong>R$/kg</strong> (1 lb =
              0,4536 kg).
            </li>
            <li>
              <strong>Diesel:</strong> Yahoo Finance — Heating Oil (HO=F), proxy para diesel.
              Origem em dólar por galão, convertido para <strong>R$/litro</strong> (1 galão =
              3,7854 L).
            </li>
            <li className="pt-2">
              A conversão para reais usa o <strong>dólar coletado no mesmo momento</strong>,
              garantindo precisão no histórico.
            </li>
            <li>
              As cotações são coletadas automaticamente <strong>2x por dia</strong> e
              armazenadas localmente para análise de tendência.
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
