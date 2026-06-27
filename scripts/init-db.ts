import Database from 'better-sqlite3';
import * as fs from 'fs';
import path from 'path';

async function initDatabase() {
  const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'smartbi.db');
  console.log('Initializing database at:', dbPath);
  
  const db = new Database(dbPath);
  
  // Create tables
  console.log('Creating tables...');
  createTables(db);
  
  db.close();
  console.log('Database initialized successfully');
}

function createTables(db: Database.Database) {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT DEFAULT 'user' NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      lastSignedIn INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create funcionarios table
  db.exec(`
    CREATE TABLE IF NOT EXISTS funcionarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      funcao TEXT NOT NULL,
      situacao TEXT NOT NULL,
      forma_pagamento TEXT NOT NULL,
      pix TEXT,
      salario_base INTEGER NOT NULL,
      ativo INTEGER DEFAULT 1 NOT NULL,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create pagamentos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id),
      mes_referencia TEXT NOT NULL,
      dias_trabalhados INTEGER,
      salario_base_mes INTEGER,
      valor_dia INTEGER,
      salario_bruto INTEGER,
      salario_familia INTEGER DEFAULT 0,
      premio_producao INTEGER DEFAULT 0,
      premio_assiduidade INTEGER DEFAULT 0,
      hora_extra INTEGER DEFAULT 0,
      inss INTEGER DEFAULT 0,
      desconto_diversos INTEGER DEFAULT 0,
      salario_liquido INTEGER,
      ferias INTEGER DEFAULT 0,
      terco_ferias INTEGER DEFAULT 0,
      decimo_terceiro INTEGER DEFAULT 0,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create producao table
  db.exec(`
    CREATE TABLE IF NOT EXISTS producao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id),
      mes_referencia TEXT NOT NULL,
      meta_dia INTEGER,
      meta_mes INTEGER,
      valor_peca INTEGER,
      producao_realizada INTEGER DEFAULT 0,
      faturamento_mensal INTEGER DEFAULT 0,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('Tables created successfully');
}

initDatabase().catch(console.error);
