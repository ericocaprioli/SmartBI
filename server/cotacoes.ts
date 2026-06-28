// Importação do axios para requisições HTTP às APIs de cotações
import axios from "axios";

// Importação de funções de banco de dados para persistência de cotações
import { insertCotacao, getUltimaCotacaoPorTipo, saveDb, getDb } from "./db";

/**
 * Módulo de Cotações
 * 
 * Responsável por:
 * - Buscar cotações de dólar, algodão e diesel via APIs externas gratuitas
 * - Calcular variação percentual em relação à última coleta
 * - Persistir histórico no banco de dados SQLite local
 * - Agendar coletas automáticas 2x por dia
 * 
 * Fontes de dados (todas gratuitas, sem chave de API):
 * - Dólar: AwesomeAPI (economia.awesomeapi.com.br)
 * - Algodão: Yahoo Finance (CT=F - Cotton Futures)
 * - Diesel: Yahoo Finance (HO=F - Heating Oil, proxy para diesel)
 */

// User-Agent usado nas requisições ao Yahoo Finance (evita bloqueio)
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Fatores de conversão de unidades
// 1 libra-peso (pound) = 0,453592 kg
const LB_PARA_KG = 0.453592;
// 1 galão americano = 3,78541 litros
const GAL_PARA_LITRO = 3.78541;

/**
 * Tipo que representa uma cotação coletada antes de persistir
 */
interface CotacaoColetada {
  tipo: "dolar" | "algodao" | "diesel";
  nome: string;
  valor: number; // valor real (não em centavos)
  unidade: string;
  fonte: string;
}

/**
 * fetchDolar busca a cotação do dólar comercial via AwesomeAPI
 * 
 * @returns Cotação do dólar ou null em caso de erro
 */
async function fetchDolar(): Promise<CotacaoColetada | null> {
  try {
    const url = "https://economia.awesomeapi.com.br/last/USD-BRL";
    const response = await axios.get(url, { timeout: 10000 });
    // A resposta tem formato { USDBRL: { bid: "5.43", ... } }
    const bid = parseFloat(response.data?.USDBRL?.bid);
    if (isNaN(bid)) return null;
    return {
      tipo: "dolar",
      nome: "Dólar Comercial",
      valor: bid,
      unidade: "BRL",
      fonte: "AwesomeAPI",
    };
  } catch (error) {
    console.warn("[Cotações] Falha ao buscar dólar:", String(error));
    return null;
  }
}

/**
 * fetchYahoo busca o último preço de um símbolo no Yahoo Finance
 * 
 * @param symbol - Símbolo do ativo (ex: "CT=F", "HO=F")
 * @returns Preço atual ou null em caso de erro
 */
async function fetchYahoo(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": USER_AGENT },
    });
    // O preço atual fica em chart.result[0].meta.regularMarketPrice
    const price = response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (typeof price !== "number") return null;
    return price;
  } catch (error) {
    console.warn(`[Cotações] Falha ao buscar ${symbol}:`, String(error));
    return null;
  }
}

/**
 * fetchAlgodao busca a cotação do algodão (Cotton Futures CT=F)
 * Valor em centavos de dólar por libra-peso
 * 
 * @returns Cotação do algodão ou null em caso de erro
 */
async function fetchAlgodao(): Promise<CotacaoColetada | null> {
  const price = await fetchYahoo("CT=F");
  if (price === null) return null;
  return {
    tipo: "algodao",
    nome: "Algodão",
    valor: price,
    unidade: "USX/lb", // centavos de dólar por libra
    fonte: "Yahoo Finance",
  };
}

/**
 * fetchDiesel busca a cotação do diesel (Heating Oil HO=F como proxy)
 * Valor em dólar por galão
 * 
 * @returns Cotação do diesel ou null em caso de erro
 */
async function fetchDiesel(): Promise<CotacaoColetada | null> {
  const price = await fetchYahoo("HO=F");
  if (price === null) return null;
  return {
    tipo: "diesel",
    nome: "Diesel (Heating Oil)",
    valor: price,
    unidade: "USD/gal", // dólar por galão
    fonte: "Yahoo Finance",
  };
}

/**
 * calcularValorBRL converte uma cotação para reais conforme o tipo
 * 
 * Conversões:
 * - Dólar: já está em reais (BRL)
 * - Algodão: de centavos de dólar por libra (USX/lb) para R$/kg
 * - Diesel: de dólar por galão (USD/gal) para R$/litro
 * 
 * @param c - Cotação coletada (valor em unidade original)
 * @param dolarValor - Valor atual do dólar em reais
 * @returns Objeto com valor em reais e unidade correspondente
 */
function calcularValorBRL(
  c: CotacaoColetada,
  dolarValor: number
): { valorBrl: number; unidadeBrl: string } {
  // Dólar já está em reais
  if (c.tipo === "dolar") {
    return { valorBrl: c.valor, unidadeBrl: "BRL" };
  }

  // Sem dólar disponível, não há como converter
  if (dolarValor <= 0) {
    return { valorBrl: 0, unidadeBrl: "" };
  }

  if (c.tipo === "algodao") {
    // c.valor está em centavos de dólar por libra (ex: 76.78 = US$ 0,7678/lb)
    const usdPorLb = c.valor / 100;
    const usdPorKg = usdPorLb / LB_PARA_KG;
    const brlPorKg = usdPorKg * dolarValor;
    return { valorBrl: brlPorKg, unidadeBrl: "R$/kg" };
  }

  if (c.tipo === "diesel") {
    // c.valor está em dólar por galão (ex: 3.1022 = US$ 3,1022/gal)
    const usdPorLitro = c.valor / GAL_PARA_LITRO;
    const brlPorLitro = usdPorLitro * dolarValor;
    return { valorBrl: brlPorLitro, unidadeBrl: "R$/L" };
  }

  return { valorBrl: 0, unidadeBrl: "" };
}

/**
 * collectCotacoes coleta todas as cotações e persiste no banco
 * 
 * Processo:
 * 1. Busca dólar, algodão e diesel em paralelo
 * 2. Para cada cotação obtida, calcula a variação percentual vs última coleta
 * 3. Insere no banco (valor convertido para centavos)
 * 4. Salva o banco em arquivo
 * 
 * @returns Resumo da coleta (sucessos e falhas)
 */
export async function collectCotacoes() {
  console.log("[Cotações] Iniciando coleta de cotações...");

  // Garante que o banco está disponível
  const db = await getDb();
  if (!db) {
    console.warn("[Cotações] Banco indisponível, coleta abortada");
    return { sucessos: 0, falhas: 0 };
  }

  // Busca todas as cotações em paralelo
  const [dolar, algodao, diesel] = await Promise.all([
    fetchDolar(),
    fetchAlgodao(),
    fetchDiesel(),
  ]);

  const coletadas = [dolar, algodao, diesel].filter(
    (c): c is CotacaoColetada => c !== null
  );

  // Valor do dólar coletado (usado para converter algodão e diesel em reais)
  // Se o dólar não foi obtido, a conversão fica indisponível (valor_brl = 0)
  const dolarValor = dolar?.valor ?? 0;

  let sucessos = 0;
  let falhas = 0;

  for (const c of coletadas) {
    try {
      // Converte valor original para centavos (multiplica por 100)
      const valorCentavos = Math.round(c.valor * 100);

      // Calcula o valor convertido em reais (BRL) conforme o tipo
      const { valorBrl, unidadeBrl } = calcularValorBRL(c, dolarValor);
      const valorBrlCentavos = Math.round(valorBrl * 100);

      // Busca última cotação do tipo para calcular variação (baseada em reais)
      const ultima = await getUltimaCotacaoPorTipo(c.tipo);
      let variacao = 0;
      if (ultima && (ultima.valor_brl ?? 0) > 0 && valorBrlCentavos > 0) {
        // Variação percentual multiplicada por 100 (ex: 250 = 2,50%)
        variacao = Math.round(
          ((valorBrlCentavos - (ultima.valor_brl ?? 0)) /
            (ultima.valor_brl ?? 1)) *
            100 *
            100
        );
      }

      // Insere nova cotação no histórico
      await insertCotacao({
        tipo: c.tipo,
        nome: c.nome,
        valor: valorCentavos,
        unidade: c.unidade,
        valor_brl: valorBrlCentavos,
        unidade_brl: unidadeBrl,
        variacao,
        fonte: c.fonte,
      });
      sucessos++;
      console.log(
        `[Cotações] ${c.nome}: ${c.valor} ${c.unidade} => R$ ${valorBrl.toFixed(
          2
        )} ${unidadeBrl} (variação ${(variacao / 100).toFixed(2)}%)`
      );
    } catch (error) {
      falhas++;
      console.warn(`[Cotações] Falha ao salvar ${c.nome}:`, String(error));
    }
  }

  // Conta como falha os tipos que não retornaram dados
  falhas += 3 - coletadas.length;

  // Persiste o banco em arquivo
  if (sucessos > 0) {
    await saveDb();
  }

  console.log(
    `[Cotações] Coleta concluída: ${sucessos} sucesso(s), ${falhas} falha(s)`
  );
  return { sucessos, falhas };
}

// Intervalo de 12 horas em milissegundos (coleta 2x por dia)
const INTERVALO_12H = 12 * 60 * 60 * 1000;

// Referência ao intervalo do scheduler (para evitar duplicação)
let schedulerIniciado = false;

/**
 * startCotacaoScheduler inicia o agendador de coletas automáticas
 * 
 * Comportamento:
 * - Executa uma coleta inicial 10 segundos após o start (não bloqueia o boot)
 * - Agenda coletas a cada 12 horas (2x por dia)
 * - Protege contra múltiplas inicializações
 * 
 * Nota: usa setInterval em vez de cron para evitar dependências externas
 */
export function startCotacaoScheduler() {
  if (schedulerIniciado) return;
  schedulerIniciado = true;

  console.log("[Cotações] Agendador iniciado (coleta a cada 12h)");

  // Coleta inicial após 10s (dá tempo do servidor subir completamente)
  setTimeout(() => {
    collectCotacoes().catch((err) =>
      console.warn("[Cotações] Erro na coleta inicial:", String(err))
    );
  }, 10000);

  // Agenda coletas periódicas a cada 12 horas
  setInterval(() => {
    collectCotacoes().catch((err) =>
      console.warn("[Cotações] Erro na coleta agendada:", String(err))
    );
  }, INTERVALO_12H);
}
