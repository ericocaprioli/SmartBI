// Importação de operadores do Drizzle ORM para consultas
import { eq, and, desc } from "drizzle-orm";

// Importação do Drizzle ORM para SQL.js (SQLite in-memory)
import { drizzle } from "drizzle-orm/sql-js";

// Importação do SQL.js para banco de dados SQLite no navegador/servidor
import initSqlJs from 'sql.js';

// Importação de schemas e tipos do Drizzle
import { InsertUser, users, funcionarios, InsertFuncionario, pagamentos, InsertPagamento, producao, InsertProducao, cotacoes, InsertCotacao, meses, InsertMes, funcoes, InsertFuncao, situacoes, InsertSituacao, formas_pagamento, InsertFormaPagamento } from "../drizzle/schema";

// Importação de variáveis de ambiente
import { ENV } from './_core/env';

// Importação do parser CSV para processamento de arquivos CSV
import csv from 'csv-parser';

// Importação de Readable do Node.js para criar streams
import { Readable } from 'stream';

// Importação de módulos do Node.js para manipulação de arquivos e caminhos
import path from 'path';
import fs from 'fs';

/**
 * Variáveis privadas para armazenar instâncias do banco de dados
 * _db: instância do Drizzle ORM
 * _sqlInstance: instância do SQL.js
 * _rawDb: instância bruta do banco de dados SQLite
 */
let _db: ReturnType<typeof drizzle> | null = null;
let _sqlInstance: any = null;
let _rawDb: any = null;

/**
 * getDb cria e retorna a instância do banco de dados
 * 
 * Funcionalidades:
 * - Criação lazy (só cria quando necessário)
 * - Carrega banco de arquivo se existir
 * - Cria banco em memória se arquivo não existir
 * - Usa SQL.js para SQLite no servidor
 * - Envelopa com Drizzle ORM para queries type-safe
 * 
 * @returns Instância do Drizzle ORM ou null se falhar
 */
export async function getDb() {
  // Se já existe instância, retorna
  if (!_db) {
    try {
      // Inicializa SQL.js se ainda não foi inicializado
      if (!_sqlInstance) {
        _sqlInstance = await initSqlJs();
      }
      
      // Determina caminho do banco de dados
      // Usa DATABASE_URL ou padrão: smartbi.db no diretório atual
      const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'smartbi.db');
      let db;
      
      // Se arquivo existe, carrega do arquivo
      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new _sqlInstance.Database(fileBuffer);
        console.log("[Database] Loaded existing SQLite database:", dbPath);
      } else {
        // Se não existe, cria banco em memória
        db = new _sqlInstance.Database();
        console.log("[Database] Created new SQLite database in memory");
      }
      
      // Armazena instância bruta e cria instância Drizzle
      _rawDb = db;
      _db = drizzle(db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * saveDb salva o banco de dados em arquivo
 * 
 * Funcionalidades:
 * - Exporta dados do banco em memória
 * - Salva em arquivo SQLite
 * - Usa caminho configurado ou padrão
 * 
 * Útil para persistir dados entre reinicializações
 */
export async function saveDb() {
  if (_rawDb && _sqlInstance) {
    try {
      const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'smartbi.db');
      // Exporta dados do banco
      const data = _rawDb.export();
      // Converte para Buffer
      const buffer = Buffer.from(data);
      // Escreve em arquivo
      fs.writeFileSync(dbPath, buffer);
      console.log("[Database] Saved database to:", dbPath);
    } catch (error) {
      console.warn("[Database] Failed to save:", error);
    }
  }
}

/**
 * upsertUser insere ou atualiza um usuário
 * 
 * Funcionalidades:
 * - Se usuário existe (por openId), atualiza
 * - Se não existe, insere novo
 * - Define role como admin se openId corresponder ao owner
 * - Atualiza lastSignedIn sempre
 * 
 * @param user - Dados do usuário para upsert
 * @throws Error se openId não for fornecido
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  // Valida se openId foi fornecido
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Verifica se usuário já existe
    const existingUser = await getUserByOpenId(user.openId);
    
    // Prepara valores para inserção/atualização
    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      // Define role: admin se for owner, senão user
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    if (existingUser) {
      // Atualiza usuário existente
      await db.update(users).set(values).where(eq(users.openId, user.openId));
    } else {
      // Insere novo usuário
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * getUserByOpenId busca um usuário pelo openId
 * 
 * @param openId - Identificador único do usuário
 * @returns Usuário encontrado ou undefined
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // Busca usuário por openId, limitando a 1 resultado
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== FUNCIONÁRIOS ====================

/**
 * getFuncionarios lista todos os funcionários ativos
 * 
 * @returns Array de funcionários com ativo=1
 */
export async function getFuncionarios() {
  const db = await getDb();
  if (!db) return [];
  // Retorna todos os funcionários (filtro de ativo removido temporariamente)
  return await db.select().from(funcionarios);
}

/**
 * getFuncionarioById busca um funcionário por ID
 * 
 * @param id - ID do funcionário
 * @returns Funcionário encontrado ou undefined
 */
export async function getFuncionarioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(funcionarios).where(eq(funcionarios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * createFuncionario cria um novo funcionário
 * 
 * @param data - Dados do funcionário
 * @returns Resultado da inserção
 * @throws Error se banco não estiver disponível
 */
export async function createFuncionario(data: InsertFuncionario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(funcionarios).values(data);
  return result;
}

/**
 * updateFuncionario atualiza um funcionário existente
 * 
 * @param id - ID do funcionário
 * @param data - Dados a atualizar (parcial)
 * @returns Resultado da atualização
 * @throws Error se banco não estiver disponível
 */
export async function updateFuncionario(id: number, data: Partial<InsertFuncionario>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(funcionarios).set(data).where(eq(funcionarios.id, id));
  await saveDb();
  return result;
}

/**
 * deleteFuncionario exclui um funcionário (soft delete)
 * 
 * Funcionalidades:
 * - Marca funcionário como inativo (ativo=0)
 * - Não remove dados do banco, apenas desativa
 * - Mantém histórico de pagamentos e produção
 * 
 * @param id - ID do funcionário
 * @returns Resultado da atualização
 * @throws Error se banco não estiver disponível
 */
export async function deleteFuncionario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete: marca ativo como 0 em vez de remover o registro
  return await db.update(funcionarios).set({ ativo: 0 }).where(eq(funcionarios.id, id));
}

// ==================== PAGAMENTOS ====================

/**
 * getPagamentosByMes lista pagamentos de um mês específico
 * 
 * @param mes - Mês no formato YYYY-MM
 * @returns Array de pagamentos do mês
 */
export async function getPagamentosByMes(mes: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pagamentos).where(eq(pagamentos.mes_referencia, mes));
}

/**
 * getPagamentoByFuncionarioAndMes busca pagamento de um funcionário em um mês
 * 
 * @param funcionario_id - ID do funcionário
 * @param mes - Mês no formato YYYY-MM
 * @returns Pagamento encontrado ou undefined
 */
export async function getPagamentoByFuncionarioAndMes(funcionario_id: number, mes: string) {
  const db = await getDb();
  if (!db) return undefined;
  // Busca por funcionario_id E mes_referencia
  const result = await db.select().from(pagamentos).where(
    and(eq(pagamentos.funcionario_id, funcionario_id), eq(pagamentos.mes_referencia, mes))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * createPagamento cria um novo pagamento
 * 
 * @param data - Dados do pagamento
 * @returns Resultado da inserção
 * @throws Error se banco não estiver disponível
 */
export async function createPagamento(data: InsertPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(pagamentos).values(data);
}

/**
 * updatePagamento atualiza um pagamento existente
 * 
 * @param id - ID do pagamento
 * @param data - Dados a atualizar (parcial)
 * @returns Resultado da atualização
 * @throws Error se banco não estiver disponível
 */
export async function updatePagamento(id: number, data: Partial<InsertPagamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(pagamentos).set(data).where(eq(pagamentos.id, id));
}

/**
 * deletePagamento exclui um pagamento por ID
 * 
 * @param id - ID do pagamento
 * @returns Pagamento excluído
 */
export async function deletePagamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(pagamentos).where(eq(pagamentos.id, id));
}

// ==================== PRODUÇÃO ====================

/**
 * getProducaoByMes lista produção de um mês específico
 * 
 * @param mes - Mês no formato YYYY-MM
 * @returns Array de produção do mês
 */
export async function getProducaoByMes(mes: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(producao).where(eq(producao.mes_referencia, mes));
}

/**
 * getProducaoByFuncionarioAndMes busca produção de um funcionário em um mês
 * 
 * @param funcionario_id - ID do funcionário
 * @param mes - Mês no formato YYYY-MM
 * @returns Produção encontrada ou undefined
 */
export async function getProducaoByFuncionarioAndMes(funcionario_id: number, mes: string) {
  const db = await getDb();
  if (!db) return undefined;
  // Busca por funcionario_id E mes_referencia
  const result = await db.select().from(producao).where(
    and(eq(producao.funcionario_id, funcionario_id), eq(producao.mes_referencia, mes))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * createProducao cria um novo registro de produção
 * 
 * @param data - Dados da produção
 * @returns Resultado da inserção
 * @throws Error se banco não estiver disponível
 */
export async function createProducao(data: InsertProducao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(producao).values(data);
}

/**
 * updateProducao atualiza um registro de produção existente
 * 
 * @param id - ID da produção
 * @param data - Dados a atualizar (parcial)
 * @returns Resultado da atualização
 * @throws Error se banco não estiver disponível
 */
export async function updateProducao(id: number, data: Partial<InsertProducao>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(producao).set(data).where(eq(producao.id, id));
}

// ==================== KPIs DASHBOARD ====================

/**
 * getKPIsDashboard calcula KPIs do dashboard para um mês específico
 * 
 * KPIs calculados:
 * - totalSalarios: soma de todos os salários líquidos
 * - totalDescontos: soma de INSS e descontos diversos
 * - mediaSalarial: média salarial dos pagamentos
 * - numFuncionariosAtivos: número de funcionários ativos
 * - custoTotalFolha: soma de salários + descontos
 * 
 * @param mes - Mês no formato YYYY-MM
 * @returns Objeto com KPIs calculados ou null
 */
export async function getKPIsDashboard(mes: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Busca pagamentos do mês
  const pagamentosMes = await db.select().from(pagamentos).where(eq(pagamentos.mes_referencia, mes));
  
  // Busca funcionários ativos
  const funcionariosAtivos = await db.select().from(funcionarios).where(eq(funcionarios.ativo, 1));
  
  // Calcula total de salários base (usando salario_base_mes que tem valor)
  const totalSalarios = pagamentosMes.reduce((sum, p) => sum + (p.salario_base_mes || 0), 0);
  
  // Calcula total de descontos (INSS + descontos diversos)
  const totalDescontos = pagamentosMes.reduce((sum, p) => sum + ((p.inss || 0) + (p.desconto_diversos || 0)), 0);
  
  // Calcula média salarial
  const mediaSalarial = pagamentosMes.length > 0 ? totalSalarios / pagamentosMes.length : 0;
  
  return {
    totalSalarios,
    totalDescontos,
    mediaSalarial,
    numFuncionariosAtivos: funcionariosAtivos.length,
    custoTotalFolha: totalSalarios + totalDescontos,
  };
}

// ==================== IMPORTAÇÃO CSV ====================

/**
 * importFuncionariosCSV importa funcionários de um CSV
 * 
 * Funcionalidades:
 * - Parseia conteúdo CSV
 * - Converte valores para tipos corretos
 * - Multiplica salários por 100 (armazenamento em centavos)
 * - Insere cada funcionário no banco
 * - Retorna array com resultados (sucesso/erro)
 * 
 * @param csvContent - Conteúdo do CSV como string
 * @returns Array de resultados com status de cada importação
 * @throws Error se banco não estiver disponível
 */
export async function importFuncionariosCSV(csvContent: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records: any[] = [];
  // Cria stream legível do conteúdo CSV
  const stream = Readable.from([csvContent]);
  
  // Parseia CSV
  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  const results = [];
  // Processa cada linha do CSV
  for (const row of records) {
    try {
      const data: InsertFuncionario = {
        nome: row.nome || '',
        funcao: row.funcao || '',
        situacao: row.situacao || 'CLT',
        forma_pagamento: row.forma_pagamento || 'Pix',
        pix: row.pix || null,
        // Converte salário para centavos (multiplica por 100)
        salario_base: Math.round(parseFloat(row.salario_base || '0') * 100),
        // Define ativo como 1 por padrão
        ativo: row.ativo === '1' || row.ativo === 'true' ? 1 : 1,
      };
      const result = await db.insert(funcionarios).values(data);
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error: String(error), row });
    }
  }
  return results;
}

/**
 * importPagamentosCSV importa pagamentos de um CSV
 * 
 * Funcionalidades:
 * - Parseia conteúdo CSV
 * - Converte valores para tipos corretos
 * - Multiplica valores monetários por 100 (armazenamento em centavos)
 * - Insere cada pagamento no banco
 * - Retorna array com resultados (sucesso/erro)
 * 
 * @param csvContent - Conteúdo do CSV como string
 * @returns Array de resultados com status de cada importação
 * @throws Error se banco não estiver disponível
 */
export async function importPagamentosCSV(csvContent: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records: any[] = [];
  const stream = Readable.from([csvContent]);
  
  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  const results = [];
  for (const row of records) {
    try {
      const data: InsertPagamento = {
        funcionario_id: parseInt(row.funcionario_id || '0'),
        mes_referencia: row.mes_referencia || '',
        dias_trabalhados: parseInt(row.dias_trabalhados || '0'),
        // Converte valores monetários para centavos
        salario_base_mes: Math.round(parseFloat(row.salario_base_mes || '0') * 100),
        valor_dia: Math.round(parseFloat(row.valor_dia || '0') * 100),
        salario_bruto: Math.round(parseFloat(row.salario_bruto || '0') * 100),
        salario_familia: Math.round(parseFloat(row.salario_familia || '0') * 100),
        premio_producao: Math.round(parseFloat(row.premio_producao || '0') * 100),
        premio_assiduidade: Math.round(parseFloat(row.premio_assiduidade || '0') * 100),
        hora_extra: Math.round(parseFloat(row.hora_extra || '0') * 100),
        inss: Math.round(parseFloat(row.inss || '0') * 100),
        desconto_diversos: Math.round(parseFloat(row.desconto_diversos || '0') * 100),
        salario_liquido: Math.round(parseFloat(row.salario_liquido || '0') * 100),
        ferias: Math.round(parseFloat(row.ferias || '0') * 100),
        terco_ferias: Math.round(parseFloat(row.terco_ferias || '0') * 100),
        decimo_terceiro: Math.round(parseFloat(row.decimo_terceiro || '0') * 100),
      };
      const result = await db.insert(pagamentos).values(data);
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error: String(error), row });
    }
  }
  return results;
}

/**
 * importProducaoCSV importa produção de um CSV
 * 
 * Funcionalidades:
 * - Parseia conteúdo CSV
 * - Converte valores para tipos corretos
 * - Multiplica valores monetários por 100 (armazenamento em centavos)
 * - Insere cada registro de produção no banco
 * - Retorna array com resultados (sucesso/erro)
 * 
 * @param csvContent - Conteúdo do CSV como string
 * @returns Array de resultados com status de cada importação
 * @throws Error se banco não estiver disponível
 */
export async function importProducaoCSV(csvContent: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records: any[] = [];
  const stream = Readable.from([csvContent]);
  
  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  const results = [];
  for (const row of records) {
    try {
      const data: InsertProducao = {
        funcionario_id: parseInt(row.funcionario_id || '0'),
        mes_referencia: row.mes_referencia || '',
        meta_dia: parseInt(row.meta_dia || '0'),
        meta_mes: parseInt(row.meta_mes || '0'),
        // Converte valores monetários para centavos
        valor_peca: Math.round(parseFloat(row.valor_peca || '0') * 100),
        producao_realizada: parseInt(row.producao_realizada || '0'),
        faturamento_mensal: Math.round(parseFloat(row.faturamento_mensal || '0') * 100),
        dias_trabalhados: parseInt(row.dias_trabalhados || '0'),
        eficiencia: parseInt(row.eficiencia || '0'),
        producao_percentual: parseInt(row.producao_percentual || '0'),
        saldo: parseInt(row.saldo || '0'),
        eficiencia_acumulada: parseInt(row.eficiencia_acumulada || '0'),
      };
      const result = await db.insert(producao).values(data);
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error: String(error), row });
    }
  }
  return results;
}

// ==================== COTAÇÕES ====================

/**
 * insertCotacao insere uma nova cotação no histórico
 * 
 * @param data - Dados da cotação (tipo, nome, valor, unidade, variacao, fonte)
 * @returns Resultado da inserção
 * @throws Error se banco não estiver disponível
 */
export async function insertCotacao(data: InsertCotacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Define explicitamente coletado_em como Date atual.
  // Com mode: "timestamp", o Drizzle converte para segundos (Unix) corretamente.
  // Isso evita o bug do defaultNow() que armazena milissegundos, gerando datas
  // incorretas (ex: ano 58463) ao serem lidas de volta.
  const result = await db.insert(cotacoes).values({
    ...data,
    coletado_em: new Date(),
  });
  return result;
}

/**
 * getLatestCotacoes retorna a cotação mais recente de cada tipo
 * 
 * Funcionalidades:
 * - Busca todas as cotações ordenadas por data (mais recentes primeiro)
 * - Retorna apenas o registro mais recente de cada tipo (dolar, algodao, diesel)
 * 
 * @returns Array com a última cotação de cada tipo
 */
export async function getLatestCotacoes() {
  const db = await getDb();
  if (!db) return [];
  // Busca todas as cotações ordenadas por data decrescente
  const todas = await db.select().from(cotacoes).orderBy(desc(cotacoes.coletado_em));
  // Filtra apenas o registro mais recente de cada tipo
  const vistos = new Set<string>();
  const ultimas = [];
  for (const c of todas) {
    if (!vistos.has(c.tipo)) {
      vistos.add(c.tipo);
      ultimas.push(c);
    }
  }
  return ultimas;
}

/**
 * getCotacoesByTipo retorna o histórico de cotações de um tipo específico
 * 
 * @param tipo - Tipo da cotação (dolar, algodao, diesel)
 * @param limit - Número máximo de registros (padrão: 60)
 * @returns Array de cotações ordenadas por data (mais antigas primeiro para gráficos)
 */
export async function getCotacoesByTipo(tipo: "dolar" | "algodao" | "diesel", limit: number = 60) {
  const db = await getDb();
  if (!db) return [];
  // Busca cotações do tipo, mais recentes primeiro, limitado
  const result = await db
    .select()
    .from(cotacoes)
    .where(eq(cotacoes.tipo, tipo))
    .orderBy(desc(cotacoes.coletado_em))
    .limit(limit);
  // Inverte para ordem cronológica (mais antigas primeiro) para exibição em gráficos
  return result.reverse();
}

/**
 * getUltimaCotacaoPorTipo retorna a última cotação registrada de um tipo
 * Usada para calcular variação percentual ao coletar nova cotação
 * 
 * @param tipo - Tipo da cotação
 * @returns Última cotação do tipo ou undefined
 */
export async function getUltimaCotacaoPorTipo(tipo: "dolar" | "algodao" | "diesel") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(cotacoes)
    .where(eq(cotacoes.tipo, tipo))
    .orderBy(desc(cotacoes.coletado_em))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== MESES ====================

/**
 * getMeses lista todos os meses ativos
 * 
 * @returns Array de meses ativos ordenados por mes_referencia
 */
export async function getMeses() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(meses).where(eq(meses.ativo, 1)).orderBy(meses.mes_referencia);
}

/**
 * getMesById busca um mês por ID
 * 
 * @param id - ID do mês
 * @returns Mês encontrado ou undefined
 */
export async function getMesById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(meses).where(eq(meses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * createMes cria um novo mês
 * 
 * @param data - Dados do mês
 * @returns Resultado da inserção
 */
export async function createMes(data: InsertMes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(meses).values(data);
  await saveDb();
  return result;
}

/**
 * updateMes atualiza um mês existente
 * 
 * @param id - ID do mês
 * @param data - Dados a atualizar (parcial)
 * @returns Resultado da atualização
 */
export async function updateMes(id: number, data: Partial<InsertMes>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(meses).set(data).where(eq(meses.id, id));
  await saveDb();
  return result;
}

/**
 * deleteMes exclui um mês por ID
 * 
 * @param id - ID do mês
 * @returns Mês excluído
 * @throws Error se houver produção ou pagamentos cadastrados para o mês
 */
export async function deleteMes(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Busca o mês para obter mes_referencia
  const mes = await getMesById(id);
  if (!mes) {
    throw new Error("Mês não encontrado");
  }

  // Verifica se há pagamentos para este mês
  const pagamentosMes = await getPagamentosByMes(mes.mes_referencia);
  if (pagamentosMes.length > 0) {
    throw new Error("Não é possível excluir este mês pois existem pagamentos cadastrados");
  }

  // Verifica se há produção para este mês
  const producaoMes = await getProducaoByMes(mes.mes_referencia);
  if (producaoMes.length > 0) {
    throw new Error("Não é possível excluir este mês pois existem dados de produção cadastrados");
  }

  return await db.delete(meses).where(eq(meses.id, id));
}

// ==================== FUNÇÕES (CARGOS) ====================

/**
 * getFuncoes lista todas as funções ativas
 * @returns Array de funções ativas ordenadas por nome
 */
export async function getFuncoes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(funcoes).where(eq(funcoes.ativo, 1)).orderBy(funcoes.nome);
}

/**
 * createFuncao cria uma nova função
 * @param data - Dados da função (nome)
 * @returns Resultado da inserção
 */
export async function createFuncao(data: InsertFuncao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(funcoes).values(data);
  await saveDb();
  return result;
}

/**
 * updateFuncao atualiza uma função existente
 * @param id - ID da função
 * @param data - Dados a atualizar (parcial)
 * @returns Resultado da atualização
 */
export async function updateFuncao(id: number, data: Partial<InsertFuncao>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(funcoes).set(data).where(eq(funcoes.id, id));
  await saveDb();
  return result;
}

/**
 * deleteFuncao exclui uma função por ID
 * @param id - ID da função
 * @returns Resultado da exclusão
 * @throws Error se a função estiver em uso por algum funcionário
 */
export async function deleteFuncao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const funcao = await db.select().from(funcoes).where(eq(funcoes.id, id)).limit(1);
  if (funcao.length === 0) throw new Error("Função não encontrada");

  // Verifica se há funcionários usando esta função
  const emUso = await db.select().from(funcionarios).where(eq(funcionarios.funcao, funcao[0].nome)).limit(1);
  if (emUso.length > 0) {
    throw new Error("Não é possível excluir esta função pois existem funcionários cadastrados com ela");
  }

  const result = await db.delete(funcoes).where(eq(funcoes.id, id));
  await saveDb();
  return result;
}

// ==================== SITUAÇÕES ====================

/**
 * getSituacoes lista todas as situações ativas
 * @returns Array de situações ativas ordenadas por nome
 */
export async function getSituacoes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(situacoes).where(eq(situacoes.ativo, 1)).orderBy(situacoes.nome);
}

/**
 * createSituacao cria uma nova situação
 * @param data - Dados da situação (nome)
 * @returns Resultado da inserção
 */
export async function createSituacao(data: InsertSituacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(situacoes).values(data);
  await saveDb();
  return result;
}

/**
 * updateSituacao atualiza uma situação existente
 * @param id - ID da situação
 * @param data - Dados a atualizar (parcial)
 * @returns Resultado da atualização
 */
export async function updateSituacao(id: number, data: Partial<InsertSituacao>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(situacoes).set(data).where(eq(situacoes.id, id));
  await saveDb();
  return result;
}

/**
 * deleteSituacao exclui uma situação por ID
 * @param id - ID da situação
 * @returns Resultado da exclusão
 * @throws Error se a situação estiver em uso por algum funcionário
 */
export async function deleteSituacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const situacao = await db.select().from(situacoes).where(eq(situacoes.id, id)).limit(1);
  if (situacao.length === 0) throw new Error("Situação não encontrada");

  const emUso = await db.select().from(funcionarios).where(eq(funcionarios.situacao, situacao[0].nome)).limit(1);
  if (emUso.length > 0) {
    throw new Error("Não é possível excluir esta situação pois existem funcionários cadastrados com ela");
  }

  const result = await db.delete(situacoes).where(eq(situacoes.id, id));
  await saveDb();
  return result;
}

// ==================== FORMAS DE PAGAMENTO ====================

/**
 * getFormasPagamento lista todas as formas de pagamento ativas
 * @returns Array de formas de pagamento ativas ordenadas por nome
 */
export async function getFormasPagamento() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(formas_pagamento).where(eq(formas_pagamento.ativo, 1)).orderBy(formas_pagamento.nome);
}

/**
 * createFormaPagamento cria uma nova forma de pagamento
 * @param data - Dados da forma (nome, tipo)
 * @returns Resultado da inserção
 */
export async function createFormaPagamento(data: InsertFormaPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(formas_pagamento).values(data);
  await saveDb();
  return result;
}

/**
 * updateFormaPagamento atualiza uma forma de pagamento existente
 * @param id - ID da forma de pagamento
 * @param data - Dados a atualizar (parcial)
 * @returns Resultado da atualização
 */
export async function updateFormaPagamento(id: number, data: Partial<InsertFormaPagamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(formas_pagamento).set(data).where(eq(formas_pagamento.id, id));
  await saveDb();
  return result;
}

/**
 * deleteFormaPagamento exclui uma forma de pagamento por ID
 * @param id - ID da forma de pagamento
 * @returns Resultado da exclusão
 * @throws Error se a forma estiver em uso por algum funcionário
 */
export async function deleteFormaPagamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const forma = await db.select().from(formas_pagamento).where(eq(formas_pagamento.id, id)).limit(1);
  if (forma.length === 0) throw new Error("Forma de pagamento não encontrada");

  const emUso = await db.select().from(funcionarios).where(eq(funcionarios.forma_pagamento, forma[0].nome)).limit(1);
  if (emUso.length > 0) {
    throw new Error("Não é possível excluir esta forma de pagamento pois existem funcionários cadastrados com ela");
  }

  const result = await db.delete(formas_pagamento).where(eq(formas_pagamento.id, id));
  await saveDb();
  return result;
}
