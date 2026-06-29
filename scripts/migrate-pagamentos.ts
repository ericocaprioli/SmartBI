// Importação do SQL.js para manipulação do banco SQLite
import initSqlJs from "sql.js";

// Módulos do Node para arquivos e caminhos
import path from "path";
import fs from "fs";

/**
 * Script de migração para adicionar campos de conformidade fiscal/trabalhista
 * à tabela pagamentos.
 *
 * Novas colunas:
 * - vale_transporte (desconto de vale-transporte)
 * - irrf (imposto de renda retido na fonte)
 * - fgts (fundo de garantia - 8% sobre salário bruto)
 * - total_proventos (soma de todos os proventos)
 * - total_descontos (soma de todos os descontos)
 */
async function migrate() {
  const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "smartbi.db");
  console.log("Migrando banco em:", dbPath);

  const SQL = await initSqlJs();

  if (!fs.existsSync(dbPath)) {
    console.error("Banco não encontrado. Rode o init-db primeiro.");
    process.exit(1);
  }

  const db = new SQL.Database(fs.readFileSync(dbPath));

  // Função auxiliar: verifica se uma coluna existe numa tabela
  const colunaExiste = (tabela: string, coluna: string): boolean => {
    const res = db.exec(`PRAGMA table_info(${tabela})`);
    if (res.length === 0) return false;
    return res[0].values.some((row: any[]) => row[1] === coluna);
  };

  // Adiciona novas colunas em pagamentos se não existirem
  const novasColunas = ["vale_transporte", "irrf", "fgts", "total_proventos", "total_descontos"];
  for (const coluna of novasColunas) {
    if (!colunaExiste("pagamentos", coluna)) {
      db.run(`ALTER TABLE pagamentos ADD COLUMN ${coluna} INTEGER DEFAULT 0`);
      console.log(`Coluna pagamentos.${coluna} adicionada.`);
    } else {
      console.log(`Coluna pagamentos.${coluna} já existe.`);
    }
  }

  // Salva o banco
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  db.close();
  console.log("Migração concluída com sucesso.");
}

migrate().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
