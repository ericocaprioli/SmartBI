import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, funcionarios, InsertFuncionario, pagamentos, InsertPagamento, producao, InsertProducao } from "../drizzle/schema";
import { ENV } from './_core/env';
import csv from 'csv-parser';
import { Readable } from 'stream';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Funcionarios
export async function getFuncionarios() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(funcionarios).where(eq(funcionarios.ativo, 1));
}

export async function getFuncionarioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(funcionarios).where(eq(funcionarios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createFuncionario(data: InsertFuncionario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(funcionarios).values(data);
  return result;
}

export async function updateFuncionario(id: number, data: Partial<InsertFuncionario>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(funcionarios).set(data).where(eq(funcionarios.id, id));
}

// Pagamentos
export async function getPagamentosByMes(mes: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pagamentos).where(eq(pagamentos.mes_referencia, mes));
}

export async function getPagamentoByFuncionarioAndMes(funcionario_id: number, mes: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pagamentos).where(
    and(eq(pagamentos.funcionario_id, funcionario_id), eq(pagamentos.mes_referencia, mes))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPagamento(data: InsertPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(pagamentos).values(data);
}

export async function updatePagamento(id: number, data: Partial<InsertPagamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(pagamentos).set(data).where(eq(pagamentos.id, id));
}

// Producao
export async function getProducaoByMes(mes: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(producao).where(eq(producao.mes_referencia, mes));
}

export async function getProducaoByFuncionarioAndMes(funcionario_id: number, mes: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(producao).where(
    and(eq(producao.funcionario_id, funcionario_id), eq(producao.mes_referencia, mes))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProducao(data: InsertProducao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(producao).values(data);
}

export async function updateProducao(id: number, data: Partial<InsertProducao>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(producao).set(data).where(eq(producao.id, id));
}

// KPIs
export async function getKPIsDashboard(mes: string) {
  const db = await getDb();
  if (!db) return null;
  
  const pagamentosMes = await db.select().from(pagamentos).where(eq(pagamentos.mes_referencia, mes));
  const funcionariosAtivos = await db.select().from(funcionarios).where(eq(funcionarios.ativo, 1));
  
  const totalSalarios = pagamentosMes.reduce((sum, p) => sum + (p.salario_liquido || 0), 0);
  const totalDescontos = pagamentosMes.reduce((sum, p) => sum + ((p.inss || 0) + (p.desconto_diversos || 0)), 0);
  const mediaSalarial = pagamentosMes.length > 0 ? totalSalarios / pagamentosMes.length : 0;
  
  return {
    totalSalarios,
    totalDescontos,
    mediaSalarial,
    numFuncionariosAtivos: funcionariosAtivos.length,
    custoTotalFolha: totalSalarios + totalDescontos,
  };
}

// Importação CSV - Funcionários
export async function importFuncionariosCSV(csvContent: string) {
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
      const data: InsertFuncionario = {
        nome: row.nome || '',
        funcao: row.funcao || '',
        setor: row.setor || '',
        salario_base: Math.round(parseFloat(row.salario_base || '0') * 100),
        data_admissao: row.data_admissao || null,
        situacao: row.situacao || 'Ativo',
        ativo: row.ativo === '1' || row.ativo === 'true' ? 1 : 0,
      };
      const result = await db.insert(funcionarios).values(data);
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error: String(error), row });
    }
  }
  return results;
}

// Importação CSV - Pagamentos
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

// Importação CSV - Produção
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
        valor_peca: Math.round(parseFloat(row.valor_peca || '0') * 100),
        producao_realizada: parseInt(row.producao_realizada || '0'),
        faturamento_mensal: Math.round(parseFloat(row.faturamento_mensal || '0') * 100),
      };
      const result = await db.insert(producao).values(data);
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error: String(error), row });
    }
  }
  return results;
}
