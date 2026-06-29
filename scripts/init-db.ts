// Importação do SQL.js para banco de dados SQLite em memória
import initSqlJs from 'sql.js';

// Importação de módulos do Node.js para manipulação de caminhos e arquivos
import path from 'path';
import fs from 'fs';

/**
 * initDatabase inicializa o banco de dados SQLite
 * Carrega banco existente ou cria novo
 * Cria todas as tabelas necessárias
 * Salva o banco no arquivo
 */
async function initDatabase() {
  // Obtém caminho do banco de dados da variável de ambiente ou usa padrão
  const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'smartbi.db');
  console.log('Initializing database at:', dbPath);
  
  // Inicializa SQL.js
  const SQL = await initSqlJs();
  let db;
  
  // Se o arquivo do banco existe, carrega-o. Caso contrário, cria novo.
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }
  
  // Cria tabelas no banco de dados
  console.log('Creating tables...');
  createTables(db);
  
  // Exporta e salva o banco de dados no arquivo
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  // Fecha conexão com o banco
  db.close();
  console.log('Database initialized successfully');
}

/**
 * createTables cria todas as tabelas necessárias no banco de dados
 * Cria tabelas: users, funcionarios, pagamentos, producao
 * Cada tabela tem seus campos e restrições definidos
 */
function createTables(db: any) {
  // Cria tabela de usuários para autenticação
  db.run(`
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

  // Cria tabela de funcionários
  db.run(`
    CREATE TABLE IF NOT EXISTS funcionarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      funcao TEXT NOT NULL,
      situacao TEXT NOT NULL,
      forma_pagamento TEXT NOT NULL,
      tipo_chave_pix TEXT,
      pix TEXT,
      banco TEXT,
      agencia TEXT,
      conta TEXT,
      salario_base INTEGER NOT NULL,
      data_admissao TEXT,
      data_demissao TEXT,
      ativo INTEGER DEFAULT 1 NOT NULL,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Cria tabela de funções (cargos)
  db.run(`
    CREATE TABLE IF NOT EXISTS funcoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      ativo INTEGER DEFAULT 1 NOT NULL,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Cria tabela de situações contratuais
  db.run(`
    CREATE TABLE IF NOT EXISTS situacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      ativo INTEGER DEFAULT 1 NOT NULL,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Cria tabela de formas de pagamento
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

  // Cria tabela de pagamentos (folha de pagamento)
  db.run(`
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
      vale_transporte INTEGER DEFAULT 0,
      irrf INTEGER DEFAULT 0,
      fgts INTEGER DEFAULT 0,
      total_proventos INTEGER DEFAULT 0,
      total_descontos INTEGER DEFAULT 0,
      salario_total INTEGER DEFAULT 0,
      salario_liquido INTEGER,
      ferias INTEGER DEFAULT 0,
      terco_ferias INTEGER DEFAULT 0,
      decimo_terceiro INTEGER DEFAULT 0,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Cria tabela de produção
  db.run(`
    CREATE TABLE IF NOT EXISTS producao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id),
      mes_referencia TEXT NOT NULL,
      dias_trabalhados INTEGER DEFAULT 1,
      dia INTEGER DEFAULT 0,
      meta_dia INTEGER,
      producao_dia INTEGER DEFAULT 0,
      eficiencia INTEGER DEFAULT 0,
      producao_acumulada INTEGER DEFAULT 0,
      saldo_acumulado INTEGER DEFAULT 0,
      eficiencia_acumulada INTEGER DEFAULT 0,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Cria tabela de cotações (dólar, algodão, diesel)
  db.run(`
    CREATE TABLE IF NOT EXISTS cotacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      nome TEXT NOT NULL,
      valor INTEGER NOT NULL,
      unidade TEXT NOT NULL,
      valor_brl INTEGER DEFAULT 0,
      unidade_brl TEXT,
      variacao INTEGER DEFAULT 0,
      fonte TEXT,
      coletado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Cria tabela de meses
  db.run(`
    CREATE TABLE IF NOT EXISTS meses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes_referencia TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      ativo INTEGER DEFAULT 1 NOT NULL,
      status TEXT DEFAULT 'planejado' NOT NULL,
      observacoes TEXT,
      criado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      atualizado_em INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('Tables created successfully');
}

// Executa inicialização do banco de dados e trata erros
initDatabase().catch(console.error);
