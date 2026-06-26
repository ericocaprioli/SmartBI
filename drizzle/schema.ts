import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const funcionarios = mysqlTable("funcionarios", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  funcao: varchar("funcao", { length: 255 }).notNull(),
  situacao: mysqlEnum("situacao", ["CLT", "Contrato", "Experiência"]).notNull(),
  forma_pagamento: varchar("forma_pagamento", { length: 100 }).notNull(),
  pix: varchar("pix", { length: 255 }),
  salario_base: int("salario_base").notNull(),
  ativo: int("ativo").default(1).notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  atualizado_em: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type Funcionario = typeof funcionarios.$inferSelect;
export type InsertFuncionario = typeof funcionarios.$inferInsert;

export const pagamentos = mysqlTable("pagamentos", {
  id: int("id").autoincrement().primaryKey(),
  funcionario_id: int("funcionario_id").notNull().references(() => funcionarios.id),
  mes_referencia: varchar("mes_referencia", { length: 7 }).notNull(), // YYYY-MM
  dias_trabalhados: int("dias_trabalhados"),
  salario_base_mes: int("salario_base_mes"),
  valor_dia: int("valor_dia"),
  salario_bruto: int("salario_bruto"),
  salario_familia: int("salario_familia").default(0),
  premio_producao: int("premio_producao").default(0),
  premio_assiduidade: int("premio_assiduidade").default(0),
  hora_extra: int("hora_extra").default(0),
  inss: int("inss").default(0),
  desconto_diversos: int("desconto_diversos").default(0),
  salario_liquido: int("salario_liquido"),
  ferias: int("ferias").default(0),
  terco_ferias: int("terco_ferias").default(0),
  decimo_terceiro: int("decimo_terceiro").default(0),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  atualizado_em: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type Pagamento = typeof pagamentos.$inferSelect;
export type InsertPagamento = typeof pagamentos.$inferInsert;

export const producao = mysqlTable("producao", {
  id: int("id").autoincrement().primaryKey(),
  funcionario_id: int("funcionario_id").notNull().references(() => funcionarios.id),
  mes_referencia: varchar("mes_referencia", { length: 7 }).notNull(), // YYYY-MM
  meta_dia: int("meta_dia"),
  meta_mes: int("meta_mes"),
  valor_peca: int("valor_peca"),
  producao_realizada: int("producao_realizada").default(0),
  faturamento_mensal: int("faturamento_mensal").default(0),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  atualizado_em: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type Producao = typeof producao.$inferSelect;
export type InsertProducao = typeof producao.$inferInsert;