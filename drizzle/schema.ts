// Importação de tipos do Drizzle ORM para SQLite
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Tabela users - Tabela principal de usuários para autenticação
 * 
 * Funcionalidades:
 * - Armazena informações de usuários do sistema
 * - Suporta autenticação via OAuth (Manus)
 * - Define roles de acesso (user/admin)
 * - Rastreia timestamps de criação, atualização e último login
 * 
 * Colunas usam camelCase para compatibilidade com campos do banco e tipos gerados
 * Estenda este arquivo com tabelas adicionais conforme o produto cresce
 */
export const users = sqliteTable("users", {
  /**
   * Chave primária substituta
   * Valor numérico auto-incrementado gerenciado pelo banco
   * Use para relações entre tabelas
   */
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  /**
   * Identificador OAuth (openId) retornado do callback OAuth
   * Único por usuário, usado para autenticação
   */
  openId: text("openId").notNull().unique(),
  
  /** Nome completo do usuário */
  name: text("name"),
  
  /** Email do usuário */
  email: text("email"),
  
  /** Método de login usado (ex: oauth, email) */
  loginMethod: text("loginMethod"),
  
  /**
   * Role do usuário no sistema
   * Padrão: "user"
   * Valores possíveis: "user", "admin"
   */
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  
  /** Timestamp de criação do usuário */
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  
  /** Timestamp da última atualização do usuário */
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
  
  /** Timestamp do último login do usuário */
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).defaultNow().notNull(),
});

/**
 * Tipo User inferido da tabela users
 * Representa um usuário selecionado do banco
 */
export type User = typeof users.$inferSelect;

/**
 * Tipo InsertUser inferido da tabela users
 * Representa dados para inserir um novo usuário
 */
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela funcionarios - Armazena informações de funcionários
 * 
 * Funcionalidades:
 * - Cadastro de funcionários da empresa
 * - Informações pessoais e profissionais
 * - Situação contratual (CLT, Contrato, Experiência)
 * - Dados de pagamento (forma, PIX, salário)
 * - Controle de ativação/desativação
 * - Timestamps de criação e atualização
 */
export const funcionarios = sqliteTable("funcionarios", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  /** Nome completo do funcionário */
  nome: text("nome").notNull(),
  
  /** Função/cargo do funcionário */
  funcao: text("funcao").notNull(),
  
  /**
   * Situação contratual do funcionário
   * Valores possíveis: "CLT", "Contrato", "Experiência"
   */
  situacao: text("situacao", { enum: ["CLT", "Contrato", "Experiência"] }).notNull(),
  
  /** Forma de pagamento (ex: Pix, Transferência, Dinheiro) */
  forma_pagamento: text("forma_pagamento").notNull(),
  
  /** Chave PIX para pagamento (opcional) */
  pix: text("pix"),
  
  /**
   * Salário base do funcionário
   * Armazenado em centavos (multiplicado por 100)
   */
  salario_base: integer("salario_base").notNull(),
  
  /**
   * Status de ativação do funcionário
   * 1 = ativo, 0 = inativo
   * Padrão: 1
   */
  ativo: integer("ativo").default(1).notNull(),
  
  /** Timestamp de criação do registro */
  criado_em: integer("criado_em", { mode: "timestamp" }).defaultNow().notNull(),
  
  /** Timestamp da última atualização do registro */
  atualizado_em: integer("atualizado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/**
 * Tipo Funcionario inferido da tabela funcionarios
 * Representa um funcionário selecionado do banco
 */
export type Funcionario = typeof funcionarios.$inferSelect;

/**
 * Tipo InsertFuncionario inferido da tabela funcionarios
 * Representa dados para inserir um novo funcionário
 */
export type InsertFuncionario = typeof funcionarios.$inferInsert;

/**
 * Tabela pagamentos - Armazena pagamentos mensais de funcionários
 * 
 * Funcionalidades:
 * - Registro de pagamentos por funcionário e mês
 * - Cálculos de salários (bruto, líquido, família)
 * - Prêmios (produção, assiduidade)
 * - Descontos (INSS, diversos)
 * - Benefícios (férias, 1/3 férias, 13º salário)
 * - Horas extras
 * - Timestamps de criação e atualização
 * 
 * Relacionamento:
 * - funcionario_id: chave estrangeira para tabela funcionarios
 */
export const pagamentos = sqliteTable("pagamentos", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  /**
   * Chave estrangeira para tabela funcionarios
   * Referencia o funcionário que recebeu o pagamento
   */
  funcionario_id: integer("funcionario_id").notNull().references(() => funcionarios.id),
  
  /**
   * Mês de referência do pagamento
   * Formato: YYYY-MM (ex: 2024-01)
   */
  mes_referencia: text("mes_referencia").notNull(),
  
  /** Número de dias trabalhados no mês */
  dias_trabalhados: integer("dias_trabalhados"),
  
  /** Salário base do mês (em centavos) */
  salario_base_mes: integer("salario_base_mes"),
  
  /** Valor diário calculado (em centavos) */
  valor_dia: integer("valor_dia"),
  
  /** Salário bruto total (em centavos) */
  salario_bruto: integer("salario_bruto"),
  
  /**
   * Salário família (em centavos)
   * Padrão: 0
   */
  salario_familia: integer("salario_familia").default(0),
  
  /**
   * Prêmio por produção (em centavos)
   * Padrão: 0
   */
  premio_producao: integer("premio_producao").default(0),
  
  /**
   * Prêmio por assiduidade (em centavos)
   * Padrão: 0
   */
  premio_assiduidade: integer("premio_assiduidade").default(0),
  
  /**
   * Valor de horas extras (em centavos)
   * Padrão: 0
   */
  hora_extra: integer("hora_extra").default(0),
  
  /**
   * Desconto de INSS (em centavos)
   * Padrão: 0
   */
  inss: integer("inss").default(0),
  
  /**
   * Outros descontos diversos (em centavos)
   * Padrão: 0
   */
  desconto_diversos: integer("desconto_diversos").default(0),
  
  /** Salário líquido final (em centavos) */
  salario_liquido: integer("salario_liquido"),
  
  /**
   * Valor de férias (em centavos)
   * Padrão: 0
   */
  ferias: integer("ferias").default(0),
  
  /**
   * Valor de 1/3 de férias (em centavos)
   * Padrão: 0
   */
  terco_ferias: integer("terco_ferias").default(0),
  
  /**
   * Valor de 13º salário (em centavos)
   * Padrão: 0
   */
  decimo_terceiro: integer("decimo_terceiro").default(0),
  
  /** Timestamp de criação do registro */
  criado_em: integer("criado_em", { mode: "timestamp" }).defaultNow().notNull(),
  
  /** Timestamp da última atualização do registro */
  atualizado_em: integer("atualizado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/**
 * Tipo Pagamento inferido da tabela pagamentos
 * Representa um pagamento selecionado do banco
 */
export type Pagamento = typeof pagamentos.$inferSelect;

/**
 * Tipo InsertPagamento inferido da tabela pagamentos
 * Representa dados para inserir um novo pagamento
 */
export type InsertPagamento = typeof pagamentos.$inferInsert;

/**
 * Tabela producao - Armazena metas e resultados de produção
 * 
 * Funcionalidades:
 * - Registro de metas de produção (diária, mensal)
 * - Valor por peça produzida
 * - Produção realizada (quantidade)
 * - Faturamento mensal calculado
 * - Timestamps de criação e atualização
 * 
 * Relacionamento:
 * - funcionario_id: chave estrangeira para tabela funcionarios
 */
export const producao = sqliteTable("producao", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  /**
   * Chave estrangeira para tabela funcionarios
   * Referencia o funcionário relacionado à produção
   */
  funcionario_id: integer("funcionario_id").notNull().references(() => funcionarios.id),
  
  /**
   * Mês de referência da produção
   * Formato: YYYY-MM (ex: 2024-01)
   */
  mes_referencia: text("mes_referencia").notNull(),
  
  /** Meta diária de produção (quantidade de peças) */
  meta_dia: integer("meta_dia"),
  
  /** Meta mensal de produção (quantidade de peças) */
  meta_mes: integer("meta_mes"),
  
  /** Valor por peça produzida (em centavos) */
  valor_peca: integer("valor_peca"),
  
  /**
   * Produção realizada (quantidade de peças)
   * Padrão: 0
   */
  producao_realizada: integer("producao_realizada").default(0),
  
  /**
   * Faturamento mensal calculado (em centavos)
   * Padrão: 0
   */
  faturamento_mensal: integer("faturamento_mensal").default(0),
  
  /** Timestamp de criação do registro */
  criado_em: integer("criado_em", { mode: "timestamp" }).defaultNow().notNull(),
  
  /** Timestamp da última atualização do registro */
  atualizado_em: integer("atualizado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/**
 * Tipo Producao inferido da tabela producao
 * Representa um registro de produção selecionado do banco
 */
export type Producao = typeof producao.$inferSelect;

/**
 * Tipo InsertProducao inferido da tabela producao
 * Representa dados para inserir um novo registro de produção
 */
export type InsertProducao = typeof producao.$inferInsert;