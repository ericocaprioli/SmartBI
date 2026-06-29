// Importação do SQL.js para manipulação do banco SQLite
import initSqlJs from "sql.js";

// Módulos do Node para arquivos e caminhos
import path from "path";
import fs from "fs";

/**
 * Script de migração para adicionar os cadastros de Função, Situação e
 * Forma de Pagamento ao banco já existente, além das novas colunas de
 * dados de pagamento na tabela funcionarios.
 *
 * Operações idempotentes:
 * - CREATE TABLE IF NOT EXISTS para as novas tabelas
 * - ALTER TABLE ADD COLUMN apenas se a coluna ainda não existir
 * - Seed inicial de situações e formas de pagamento padrão
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

  // Cria novas tabelas
  db.run(`
    CREATE TABLE IF NOT EXISTS funcoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      ativo INTEGER DEFAULT 1 NOT NULL,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS situacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      ativo INTEGER DEFAULT 1 NOT NULL,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS formas_pagamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL,
      ativo INTEGER DEFAULT 1 NOT NULL,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  console.log("Tabelas funcoes, situacoes e formas_pagamento criadas/verificadas.");

  // Função auxiliar: verifica se uma coluna existe numa tabela
  const colunaExiste = (tabela: string, coluna: string): boolean => {
    const res = db.exec(`PRAGMA table_info(${tabela})`);
    if (res.length === 0) return false;
    // A coluna "name" é a segunda (índice 1) no resultado de table_info
    return res[0].values.some((row: any[]) => row[1] === coluna);
  };

  // Adiciona novas colunas em funcionarios se não existirem
  const novasColunas = ["tipo_chave_pix", "banco", "agencia", "conta"];
  for (const coluna of novasColunas) {
    if (!colunaExiste("funcionarios", coluna)) {
      db.run(`ALTER TABLE funcionarios ADD COLUMN ${coluna} TEXT`);
      console.log(`Coluna funcionarios.${coluna} adicionada.`);
    } else {
      console.log(`Coluna funcionarios.${coluna} já existe.`);
    }
  }

  // Seed inicial de situações padrão (a partir das que já existiam no enum)
  const situacoesPadrao = ["CLT", "Contrato", "Experiência"];
  for (const nome of situacoesPadrao) {
    db.run(`INSERT OR IGNORE INTO situacoes (nome) VALUES (?)`, [nome]);
  }
  console.log("Situações padrão inseridas (se ausentes).");

  // Seed inicial de formas de pagamento padrão
  const formasPadrao: Array<{ nome: string; tipo: string }> = [
    { nome: "PIX", tipo: "pix" },
    { nome: "Conta Bancária", tipo: "conta" },
    { nome: "Dinheiro", tipo: "dinheiro" },
  ];
  for (const f of formasPadrao) {
    db.run(`INSERT OR IGNORE INTO formas_pagamento (nome, tipo) VALUES (?, ?)`, [f.nome, f.tipo]);
  }
  console.log("Formas de pagamento padrão inseridas (se ausentes).");

  // Seed de funções a partir das funções já usadas pelos funcionários existentes
  const funcoesExistentes = db.exec(`SELECT DISTINCT funcao FROM funcionarios WHERE funcao IS NOT NULL AND funcao != ''`);
  if (funcoesExistentes.length > 0) {
    for (const row of funcoesExistentes[0].values) {
      const nome = row[0];
      if (nome) {
        db.run(`INSERT OR IGNORE INTO funcoes (nome) VALUES (?)`, [nome]);
      }
    }
    console.log("Funções existentes dos funcionários importadas para o cadastro.");
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
