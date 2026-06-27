import "dotenv/config";
import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { funcionarios, pagamentos, producao } from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script. Copy .env.example to .env and set DATABASE_URL.");
}

const pool = createPool(connectionString);
const db = drizzle(pool);

async function main() {
  const existingFuncionario = await db.select().from(funcionarios).limit(1);
  if (existingFuncionario.length > 0) {
    console.log("Database already contains funcionarios. Seed skipped.");
    process.exit(0);
  }

  const funcionariosSeed = [
    {
      nome: "João Silva",
      funcao: "Analista de Produção",
      situacao: "CLT",
      forma_pagamento: "Transferência",
      pix: "joao.silva@pix.example",
      salario_base: 450000,
      ativo: 1,
    },
    {
      nome: "Mariana Costa",
      funcao: "Operadora de Máquina",
      situacao: "Contrato",
      forma_pagamento: "Boleto",
      pix: "mariana.costa@pix.example",
      salario_base: 320000,
      ativo: 1,
    },
    {
      nome: "Carlos Pereira",
      funcao: "Supervisor de Linha",
      situacao: "CLT",
      forma_pagamento: "PIX",
      pix: "carlos.pereira@pix.example",
      salario_base: 580000,
      ativo: 1,
    },
  ];

  const inserted = await db.insert(funcionarios).values(funcionariosSeed);
  const rows = await db.select().from(funcionarios).orderBy(funcionarios.id);

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
      salario_liquido: 533000,
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
      salario_liquido: 304000,
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
      salario_liquido: 630000,
      ferias: 0,
      terco_ferias: 0,
      decimo_terceiro: 0,
    },
  ];

  const producaoSeed = [
    {
      funcionario_id: rows[0].id,
      mes_referencia: "2026-06",
      meta_dia: 180,
      meta_mes: 3960,
      valor_peca: 250,
      producao_realizada: 4100,
      faturamento_mensal: 1025000,
    },
    {
      funcionario_id: rows[1].id,
      mes_referencia: "2026-06",
      meta_dia: 150,
      meta_mes: 3300,
      valor_peca: 210,
      producao_realizada: 3250,
      faturamento_mensal: 682500,
    },
    {
      funcionario_id: rows[2].id,
      mes_referencia: "2026-06",
      meta_dia: 200,
      meta_mes: 4400,
      valor_peca: 320,
      producao_realizada: 4550,
      faturamento_mensal: 1456000,
    },
  ];

  await db.insert(pagamentos).values(pagamentosSeed);
  await db.insert(producao).values(producaoSeed);

  console.log("Seed concluído: funcionarios, pagamentos e producao inseridos.");
  await pool.end();
}

main().catch((error) => {
  console.error("Erro no seed:", error);
  process.exit(1);
});
