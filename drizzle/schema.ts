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
   * Valor vindo do cadastro de situações (ex: "CLT", "Contrato", "Experiência")
   */
  situacao: text("situacao").notNull(),
  
  /** Forma de pagamento (ex: Pix, Conta Bancária, Dinheiro) — vinda do cadastro */
  forma_pagamento: text("forma_pagamento").notNull(),
  
  /**
   * Tipo da chave PIX (quando forma de pagamento for PIX)
   * Valores: "cpf", "cnpj", "telefone", "email", "aleatoria"
   */
  tipo_chave_pix: text("tipo_chave_pix"),
  
  /** Valor da chave PIX para pagamento (opcional) */
  pix: text("pix"),
  
  /** Banco (quando forma de pagamento for Conta Bancária) */
  banco: text("banco"),
  
  /** Agência da conta bancária (quando forma de pagamento for Conta Bancária) */
  agencia: text("agencia"),
  
  /** Número da conta corrente (quando forma de pagamento for Conta Bancária) */
  conta: text("conta"),
  
  /**
   * Salário base do funcionário
   * Armazenado em centavos (multiplicado por 100)
   */
  salario_base: integer("salario_base").notNull(),
  
  /**
   * Data de admissão do funcionário
   * Formato: YYYY-MM-DD
   */
  data_admissao: text("data_admissao"),
  
  /**
   * Data de demissão do funcionário
   * Formato: YYYY-MM-DD
   */
  data_demissao: text("data_demissao"),
  
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

  /**
   * Desconto de Vale-transporte (em centavos)
   * Máximo 6% do salário base
   * Padrão: 0
   */
  vale_transporte: integer("vale_transporte").default(0),

  /**
   * Desconto de IRRF (Imposto de Renda Retido na Fonte) (em centavos)
   * Padrão: 0
   */
  irrf: integer("irrf").default(0),

  /**
   * FGTS (Fundo de Garantia do Tempo de Serviço) (em centavos)
   * 8% sobre salário bruto (encargo patronal)
   * Padrão: 0
   */
  fgts: integer("fgts").default(0),

  /**
   * Total de proventos (em centavos)
   * Soma de salário_bruto, salario_familia, premio_producao, premio_assiduidade, hora_extra
   * Padrão: 0
   */
  total_proventos: integer("total_proventos").default(0),

  /**
   * Total de descontos (em centavos)
   * Soma de inss, desconto_diversos, vale_transporte, irrf
   * Padrão: 0
   */
  total_descontos: integer("total_descontos").default(0),

  /**
   * Salário total calculado (em centavos)
   * Soma de todos os proventos menos descontos
   * Padrão: 0
   * @deprecated Use total_proventos - total_descontos
   */
  salario_total: integer("salario_total").default(0),

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
  
  /**
   * Dias trabalhados
   * Padrão: 1
   */
  dias_trabalhados: integer("dias_trabalhados").default(1),
  
  /**
   * Dia do mês (1-31)
   * Padrão: 0
   */
  dia: integer("dia").default(0),
  
  /** Meta diária de produção (quantidade de peças) */
  meta_dia: integer("meta_dia"),
  
  /**
   * Produção realizada no dia (quantidade de peças)
   * Padrão: 0
   */
  producao_dia: integer("producao_dia").default(0),
  
  /**
   * Eficiência diária (producao_dia / meta_dia * 100)
   * Padrão: 0
   */
  eficiencia: integer("eficiencia").default(0),
  
  /**
   * Produção acumulada até o dia
   * Padrão: 0
   */
  producao_acumulada: integer("producao_acumulada").default(0),
  
  /**
   * Saldo acumulado (producao_acumulada - meta_esperada)
   * Padrão: 0
   */
  saldo_acumulado: integer("saldo_acumulado").default(0),
  
  /**
   * Eficiência acumulada até o dia
   * Padrão: 0
   */
  eficiencia_acumulada: integer("eficiencia_acumulada").default(0),
  
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

/**
 * Tabela cotacoes - Armazena histórico de cotações de commodities e moedas
 * 
 * Funcionalidades:
 * - Registro de cotações de dólar, algodão e diesel
 * - Histórico atualizado 2x por dia via APIs externas (yfinance/AwesomeAPI)
 * - Permite gráficos de tendência e análise de variação
 * - Cada coleta gera um novo registro (mantém histórico completo)
 * 
 * Fontes de dados:
 * - Dólar: AwesomeAPI (USD-BRL)
 * - Algodão: Yahoo Finance (CT=F - Cotton Futures)
 * - Diesel: Yahoo Finance (HO=F - Heating Oil como proxy)
 */
export const cotacoes = sqliteTable("cotacoes", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  /**
   * Tipo da cotação
   * Valores: "dolar", "algodao", "diesel"
   */
  tipo: text("tipo", { enum: ["dolar", "algodao", "diesel"] }).notNull(),
  
  /** Nome amigável da cotação (ex: "Dólar Comercial", "Algodão") */
  nome: text("nome").notNull(),
  
  /**
   * Valor da cotação
   * Armazenado em centavos (multiplicado por 100) para precisão
   */
  valor: integer("valor").notNull(),
  
  /** Unidade de medida original (ex: "BRL", "USX/lb", "USD/gal") */
  unidade: text("unidade").notNull(),
  
  /**
   * Valor convertido para reais (BRL)
   * Armazenado em centavos
   * - Dólar: igual ao valor original
   * - Algodão: R$/kg (convertido de USD¢/lb usando o dólar do momento)
   * - Diesel: R$/litro (convertido de USD/galão usando o dólar do momento)
   */
  valor_brl: integer("valor_brl").default(0),
  
  /** Unidade da conversão em reais (ex: "BRL", "R$/kg", "R$/L") */
  unidade_brl: text("unidade_brl"),
  
  /**
   * Variação percentual em relação à coleta anterior
   * Armazenado multiplicado por 100 (ex: 250 = 2,50%)
   * Pode ser negativo
   */
  variacao: integer("variacao").default(0),
  
  /** Fonte dos dados (ex: "AwesomeAPI", "Yahoo Finance") */
  fonte: text("fonte"),
  
  /** Timestamp da coleta da cotação */
  coletado_em: integer("coletado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/**
 * Tipo Cotacao inferido da tabela cotacoes
 * Representa uma cotação selecionada do banco
 */
export type Cotacao = typeof cotacoes.$inferSelect;

/**
 * Tipo InsertCotacao inferido da tabela cotacoes
 * Representa dados para inserir uma nova cotação
 */
export type InsertCotacao = typeof cotacoes.$inferInsert;

/**
 * Tabela meses - Armazena meses disponíveis para produção e dashboard
 * 
 * Funcionalidades:
 * - Centralização da gestão de meses do sistema
 * - Permitir inclusão de meses de anos anteriores
 * - Ativação/desativação de meses
 * - Interface administrativa para gerenciamento
 * - Filtro automático em todas as páginas
 */
export const meses = sqliteTable("meses", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  /**
   * Mês de referência
   * Formato: YYYY-MM (ex: 2024-01)
   */
  mes_referencia: text("mes_referencia").notNull().unique(),
  
  /**
   * Label amigável para exibição
   * Ex: "Janeiro 2024"
   */
  label: text("label").notNull(),
  
  /**
   * Status de ativação do mês
   * 1 = ativo, 0 = inativo
   * Padrão: 1
   */
  ativo: integer("ativo").default(1).notNull(),
  
  /**
   * Status do mês
   * Valores: "planejado", "em_andamento", "concluido"
   * Padrão: "planejado"
   */
  status: text("status", { enum: ["planejado", "em_andamento", "concluido"] }).default("planejado").notNull(),
  
  /** Observações sobre o mês (opcional) */
  observacoes: text("observacoes"),
  
  /** Timestamp de criação do registro */
  criado_em: integer("criado_em", { mode: "timestamp" }).defaultNow().notNull(),
  
  /** Timestamp da última atualização do registro */
  atualizado_em: integer("atualizado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/**
 * Tipo Mes inferido da tabela meses
 * Representa um mês selecionado do banco
 */
export type Mes = typeof meses.$inferSelect;

/**
 * Tipo InsertMes inferido da tabela meses
 * Representa dados para inserir um novo mês
 */
export type InsertMes = typeof meses.$inferInsert;

/**
 * Tabela funcoes - Cadastro de funções/cargos disponíveis
 *
 * Funcionalidades:
 * - Centraliza a gestão de funções dos funcionários
 * - Popula o dropdown de função no cadastro de funcionário
 * - Ativação/desativação de funções
 */
export const funcoes = sqliteTable("funcoes", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),

  /** Nome da função/cargo (único) */
  nome: text("nome").notNull().unique(),

  /** Status de ativação (1 = ativo, 0 = inativo) */
  ativo: integer("ativo").default(1).notNull(),

  /** Timestamp de criação do registro */
  criado_em: integer("criado_em", { mode: "timestamp" }).defaultNow().notNull(),

  /** Timestamp da última atualização do registro */
  atualizado_em: integer("atualizado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/** Tipo Funcao inferido da tabela funcoes */
export type Funcao = typeof funcoes.$inferSelect;

/** Tipo InsertFuncao para inserir uma nova função */
export type InsertFuncao = typeof funcoes.$inferInsert;

/**
 * Tabela situacoes - Cadastro de situações contratuais disponíveis
 *
 * Funcionalidades:
 * - Centraliza a gestão de situações (ex: CLT, Contrato, Experiência)
 * - Popula o dropdown de situação no cadastro de funcionário
 * - Ativação/desativação de situações
 */
export const situacoes = sqliteTable("situacoes", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),

  /** Nome da situação (único) */
  nome: text("nome").notNull().unique(),

  /** Status de ativação (1 = ativo, 0 = inativo) */
  ativo: integer("ativo").default(1).notNull(),

  /** Timestamp de criação do registro */
  criado_em: integer("criado_em", { mode: "timestamp" }).defaultNow().notNull(),

  /** Timestamp da última atualização do registro */
  atualizado_em: integer("atualizado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/** Tipo Situacao inferido da tabela situacoes */
export type Situacao = typeof situacoes.$inferSelect;

/** Tipo InsertSituacao para inserir uma nova situação */
export type InsertSituacao = typeof situacoes.$inferInsert;

/**
 * Tabela formas_pagamento - Cadastro de formas de pagamento disponíveis
 *
 * Funcionalidades:
 * - Centraliza a gestão de formas de pagamento
 * - Cada forma tem um "tipo" que define os campos condicionais no cadastro
 *   do funcionário: "pix", "conta" ou "dinheiro"
 * - Popula o dropdown de forma de pagamento no cadastro de funcionário
 */
export const formas_pagamento = sqliteTable("formas_pagamento", {
  /** Chave primária auto-incrementada */
  id: integer("id").primaryKey({ autoIncrement: true }),

  /** Nome da forma de pagamento (único) */
  nome: text("nome").notNull().unique(),

  /**
   * Tipo da forma de pagamento
   * Define os campos condicionais exibidos no cadastro do funcionário
   * Valores: "pix", "conta", "dinheiro"
   */
  tipo: text("tipo", { enum: ["pix", "conta", "dinheiro"] }).notNull(),

  /** Status de ativação (1 = ativo, 0 = inativo) */
  ativo: integer("ativo").default(1).notNull(),

  /** Timestamp de criação do registro */
  criado_em: integer("criado_em", { mode: "timestamp" }).defaultNow().notNull(),

  /** Timestamp da última atualização do registro */
  atualizado_em: integer("atualizado_em", { mode: "timestamp" }).defaultNow().notNull(),
});

/** Tipo FormaPagamento inferido da tabela formas_pagamento */
export type FormaPagamento = typeof formas_pagamento.$inferSelect;

/** Tipo InsertFormaPagamento para inserir uma nova forma de pagamento */
export type InsertFormaPagamento = typeof formas_pagamento.$inferInsert;