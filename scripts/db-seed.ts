// Importação de configurações de variáveis de ambiente
import "dotenv/config";

// Importação de criação de pool de conexões MySQL
import { createPool } from "mysql2/promise";

// Importação do Drizzle ORM para MySQL
import { drizzle } from "drizzle-orm/mysql2";

// Importação dos esquemas de tabelas do banco de dados
import { funcionarios, pagamentos, producao } from "../drizzle/schema";

/**
 * Obtém a string de conexão do banco de dados das variáveis de ambiente
 * Se não estiver definida, lança um erro instruindo o usuário a configurar
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script. Copy .env.example to .env and set DATABASE_URL.");
}

// Cria pool de conexões MySQL
const pool = createPool(connectionString);

// Inicializa Drizzle ORM com o pool de conexões
const db = drizzle(pool);

/**
 * main é a função principal do script de seed
 * Verifica se o banco já contém dados antes de inserir
 * Insere dados de exemplo de funcionários, pagamentos e produção
 */
async function main() {
  // Verifica se já existem funcionários no banco
  const existingFuncionario = await db.select().from(funcionarios).limit(1);
  if (existingFuncionario.length > 0) {
    console.log("Database already contains funcionarios. Seed skipped.");
    process.exit(0);
  }

  /**
 * Dados de exemplo de funcionários para seed
 * Salário base em centavos (450000 = R$ 4.500,00)
 */
  const funcionariosSeed = [
    {
      nome: "João Silva",
      funcao: "Analista de Produção",
      situacao: "CLT",
      forma_pagamento: "Transferência",
      pix: "joao.silva@pix.example",
      salario_base: 450000, // R$ 4.500,00 em centavos
      ativo: 1,
    },
    {
      nome: "Mariana Costa",
      funcao: "Operadora de Máquina",
      situacao: "Contrato",
      forma_pagamento: "Boleto",
      pix: "mariana.costa@pix.example",
      salario_base: 320000, // R$ 3.200,00 em centavos
      ativo: 1,
    },
    {
      nome: "Carlos Pereira",
      funcao: "Supervisor de Linha",
      situacao: "CLT",
      forma_pagamento: "PIX",
      pix: "carlos.pereira@pix.example",
      salario_base: 580000, // R$ 5.800,00 em centavos
      ativo: 1,
    },
  ];

  // Insere funcionários no banco de dados
  const inserted = await db.insert(funcionarios).values(funcionariosSeed);
  
  // Busca funcionários inseridos para obter seus IDs
  const rows = await db.select().from(funcionarios).orderBy(funcionarios.id);

  /**
 * Dados de exemplo de pagamentos para seed
 * Todos os valores monetários em centavos
 */
  const pagamentosSeed = [
    {
      funcionario_id: rows[0].id,
      mes_referencia: "2026-06",
      dias_trabalhados: 22,
      salario_base_mes: 450000,
      valor_dia: 20455,
      salario_bruto: 450000,
      salario_familia: 25000,
      premio_producao: 15000,
      premio_assiduidade: 5000,
      hora_extra: 10000,
      inss: 45000,
      desconto_diversos: 12000,
      salario_liquido: 533000, // R$ 5.330,00
      ferias: 0,
      terco_ferias: 0,
      decimo_terceiro: 0,
    },
    {
      funcionario_id: rows[1].id,
      mes_referencia: "2026-06",
      dias_trabalhados: 20,
      salario_base_mes: 320000,
      valor_dia: 16000,
      salario_bruto: 320000,
      salario_familia: 0,
      premio_producao: 12000,
      premio_assiduidade: 0,
      hora_extra: 0,
      inss: 32000,
      desconto_diversos: 8000,
      salario_liquido: 304000, // R$ 3.040,00
      ferias: 0,
      terco_ferias: 0,
      decimo_terceiro: 0,
    },
    {
      funcionario_id: rows[2].id,
      mes_referencia: "2026-06",
      dias_trabalhados: 22,
      salario_base_mes: 580000,
      valor_dia: 26364,
      salario_bruto: 580000,
      salario_familia: 0,
      premio_producao: 25000,
      premio_assiduidade: 10000,
      hora_extra: 20000,
      inss: 58000,
      desconto_diversos: 15000,
      salario_liquido: 630000, // R$ 6.300,00
      ferias: 0,
      terco_ferias: 0,
      decimo_terceiro: 0,
    },
  ];

  /**
 * Dados de exemplo de produção para seed
 * Valor por peça e faturamento em centavos
 */
  const producaoSeed = [
    {
      funcionario_id: rows[0].id,
      mes_referencia: "2026-06",
      meta_dia: 180,
      meta_mes: 3960,
      valor_peca: 250, // R$ 2,50 por peça
      producao_realizada: 4100,
      faturamento_mensal: 1025000, // R$ 10.250,00
    },
    {
      funcionario_id: rows[1].id,
      mes_referencia: "2026-06",
      meta_dia: 150,
      meta_mes: 3300,
      valor_peca: 210, // R$ 2,10 por peça
      producao_realizada: 3250,
      faturamento_mensal: 682500, // R$ 6.825,00
    },
    {
      funcionario_id: rows[2].id,
      mes_referencia: "2026-06",
      meta_dia: 200,
      meta_mes: 4400,
      valor_peca: 320, // R$ 3,20 por peça
      producao_realizada: 4550,
      faturamento_mensal: 1456000, // R$ 14.560,00
    },
  ];

  // Insere pagamentos e produção no banco de dados
  await db.insert(pagamentos).values(pagamentosSeed);
  await db.insert(producao).values(producaoSeed);

  console.log("Seed concluído: funcionarios, pagamentos e producao inseridos.");
  
  // Fecha pool de conexões
  await pool.end();
}

// Executa função principal e trata erros
main().catch((error) => {
  console.error("Erro no seed:", error);
  process.exit(1);
});
